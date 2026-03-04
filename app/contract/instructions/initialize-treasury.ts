import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { Cinefi } from "../types";
import { deriveTreasuryPDA } from "../pdas";

export async function initializeTreasury(
	program: Program<Cinefi>,
	authority: PublicKey,
) {
	const [treasuryPDA] = deriveTreasuryPDA(program.programId);

	return program.methods
		.initializeTreasury()
		.accounts({
			authority,
		})
		.instruction();
}

export async function initializeTreasuryAndSend(
	program: Program<Cinefi>,
	authority: PublicKey,
) {
	const [treasuryPDA] = deriveTreasuryPDA(program.programId);

	return program.methods
		.initializeTreasury()
		.accounts({
			authority,
		})
		.rpc();
}
