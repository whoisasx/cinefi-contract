import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { Cinefi } from "../types";
import { deriveMarketPDA } from "../pdas";

export async function closeMarket(
	program: Program<Cinefi>,
	caller: PublicKey,
	mediaId: bigint,
) {
	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);

	return program.methods
		.closeMarket()
		.accounts({
			caller,
		})
		.instruction();
}

export async function closeMarketAndSend(
	program: Program<Cinefi>,
	caller: PublicKey,
	mediaId: bigint,
) {
	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);

	return program.methods
		.closeMarket()
		.accounts({
			caller,
		})
		.rpc();
}
