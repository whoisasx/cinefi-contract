import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { Cinefi } from "../types";
import {
	deriveMarketPDA,
	deriveVaultPDA,
	deriveUserPositionPDA,
} from "../pdas";

export async function claimReward(
	program: Program<Cinefi>,
	user: PublicKey,
	mediaId: bigint,
	bucket: number,
) {
	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [userPositionPDA] = deriveUserPositionPDA(
		program.programId,
		user,
		marketPDA,
		bucket,
	);

	return program.methods
		.claimReward()
		.accounts({
			user,
			userPosition: userPositionPDA,
		})
		.instruction();
}

export async function claimRewardAndSend(
	program: Program<Cinefi>,
	user: PublicKey,
	mediaId: bigint,
	bucket: number,
) {
	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [userPositionPDA] = deriveUserPositionPDA(
		program.programId,
		user,
		marketPDA,
		bucket,
	);

	return program.methods
		.claimReward()
		.accounts({
			user,
			userPosition: userPositionPDA,
		})
		.rpc();
}
