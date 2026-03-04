import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { Cinefi } from "../types";
import { deriveMarketPDA, deriveVaultPDA, deriveTreasuryPDA } from "../pdas";

export async function reclaimPool(
	program: Program<Cinefi>,
	reclaimer: PublicKey,
	mediaId: bigint,
) {
	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [treasuryPDA] = deriveTreasuryPDA(program.programId);

	return program.methods
		.reclaimPool()
		.accounts({
			caller: reclaimer,
		})
		.instruction();
}

export async function reclaimPoolAndSend(
	program: Program<Cinefi>,
	reclaimer: PublicKey,
	mediaId: bigint,
) {
	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [treasuryPDA] = deriveTreasuryPDA(program.programId);

	return program.methods
		.reclaimPool()
		.accounts({
			caller: reclaimer,
		})
		.rpc();
}
