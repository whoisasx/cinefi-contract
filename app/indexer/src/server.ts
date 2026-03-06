import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { config, Network } from "./config";
import { decodeInstruction } from "./decoder";
import { dispatch } from "./handlers";
import { sendEvent } from "./backend-client";
import { HeliusWebhookPayload } from "./types/helius";

const HeliusInstructionSchema = z.object({
	accounts: z.array(z.string()),
	data: z.string(),
	programId: z.string(),
	innerInstructions: z.array(z.unknown()).default([]),
});

const HeliusTransactionSchema = z.object({
	signature: z.string(),
	slot: z.number(),
	timestamp: z.number(),
	feePayer: z.string(),
	transactionError: z.string().nullable().default(null),
	instructions: z.array(HeliusInstructionSchema),
	description: z.string().optional(),
	type: z.string().optional(),
	source: z.string().optional(),
	fee: z.number().optional(),
	nativeTransfers: z.array(z.unknown()).default([]),
	tokenTransfers: z.array(z.unknown()).default([]),
	accountData: z.array(z.unknown()).default([]),
	events: z.record(z.unknown()).default({}),
});

const WebhookBodySchema = z.array(HeliusTransactionSchema);

const IDL = require("../../contract/cinefi.json") as { address: string };
const PROGRAM_ID = IDL.address;

// ─── Express app ─────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req: Request, res: Response) => {
	res.json({ status: "ok", programId: PROGRAM_ID });
});

async function handleWebhook(
	networkParam: string,
	body: unknown,
	res: Response,
): Promise<void> {
	if (networkParam !== "mainnet" && networkParam !== "devnet") {
		res.status(400).json({
			error: "Invalid network. Use /webhook/mainnet or /webhook/devnet",
		});
		return;
	}
	const network = networkParam as Network;
	res.status(200).json({ received: true });
	const parsed = WebhookBodySchema.safeParse(body);
	if (!parsed.success) {
		console.error(
			"[webhook] Invalid Helius payload shape:",
			parsed.error.flatten(),
		);
		return;
	}

	const transactions = parsed.data as HeliusWebhookPayload;

	for (const tx of transactions) {
		if (tx.transactionError !== null) {
			console.debug(`[webhook] Skipping failed tx ${tx.signature}`);
			continue;
		}
		for (const ix of tx.instructions) {
			if (ix.programId !== PROGRAM_ID) continue;

			const decoded = decodeInstruction(ix.data);
			if (!decoded) {
				console.debug(
					`[webhook] Unknown CineFi instruction in tx ${tx.signature} — skipping`,
				);
				continue;
			}

			console.log(
				`[webhook] Processing [${decoded.name}] tx=${tx.signature} slot=${tx.slot} network=${network}`,
			);

			try {
				const payload = await dispatch(decoded.name, tx, ix, network);
				if (!payload) {
					console.warn(
						`[webhook] No handler for instruction: ${decoded.name}`,
					);
					continue;
				}

				await sendEvent(payload);
				console.log(`[webhook] Forwarded [${decoded.name}] to backend`);
			} catch (err) {
				console.error(
					`[webhook] Error processing [${decoded.name}] tx=${tx.signature}:`,
					err instanceof Error ? err.message : err,
				);
			}
		}
	}
}

app.post(
	"/webhook/:network",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			await handleWebhook(
				(req.params["network"] as string) ?? "",
				req.body,
				res,
			);
		} catch (err) {
			next(err);
		}
	},
);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error("[server] Unhandled error:", err.message);
	if (!res.headersSent) {
		res.status(500).json({ error: "Internal server error" });
	}
});

app.listen(config.port, () => {
	console.log(`[server] CineFi indexer listening on :` + config.port);
	console.log(`[server] Program ID: ${PROGRAM_ID}`);
	console.log(`[server] Webhook endpoints:`);
	console.log(`[server]   POST /webhook/mainnet`);
	console.log(`[server]   POST /webhook/devnet`);
});

export default app;
