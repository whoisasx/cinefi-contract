import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { Cinefi, SubmitScoreParams } from "../types";
import { deriveMarketPDA, deriveOracleReportPDA } from "../pdas";
import { validateBucket } from "../utils";

export async function submitScore(
	program: Program<Cinefi>,
	oracleSigner: PublicKey,
	params: SubmitScoreParams,
) {
	const { mediaId, score } = params;

	// Validate score is within bucket range
	validateBucket(score);

	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [oracleReportPDA] = deriveOracleReportPDA(
		program.programId,
		marketPDA,
	);

	return program.methods
		.submitScore(score)
		.accounts({
			oracleSigner,
		})
		.instruction();
}

export async function submitScoreAndSend(
	program: Program<Cinefi>,
	oracleSigner: PublicKey,
	params: SubmitScoreParams,
) {
	const { mediaId, score } = params;

	validateBucket(score);

	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [oracleReportPDA] = deriveOracleReportPDA(
		program.programId,
		marketPDA,
	);

	return program.methods
		.submitScore(score)
		.accounts({
			oracleSigner,
		})
		.rpc();
}
