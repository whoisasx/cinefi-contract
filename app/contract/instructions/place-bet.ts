import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import type { Cinefi, PlaceBetParams } from "../types";
import {
	deriveMarketPDA,
	deriveVaultPDA,
	deriveUserPositionPDA,
} from "../pdas";
import { validateBucket, validateAmount } from "../utils";

export async function placeBet(
	program: Program<Cinefi>,
	user: PublicKey,
	params: PlaceBetParams,
) {
	const { mediaId, bucket, amount } = params;

	// Validate inputs
	validateBucket(bucket);
	validateAmount(amount);

	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [userPositionPDA] = deriveUserPositionPDA(
		program.programId,
		user,
		marketPDA,
		bucket,
	);

	const bnAmount =
		typeof amount === "bigint" ? new BN(amount.toString()) : new BN(amount);

	return program.methods
		.placeBet(bucket, bnAmount)
		.accounts({
			user,
			userPosition: userPositionPDA,
		})
		.instruction();
}

export async function placeBetAndSend(
	program: Program<Cinefi>,
	user: PublicKey,
	params: PlaceBetParams,
) {
	const { mediaId, bucket, amount } = params;

	validateBucket(bucket);
	validateAmount(amount);

	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [userPositionPDA] = deriveUserPositionPDA(
		program.programId,
		user,
		marketPDA,
		bucket,
	);

	const bnAmount =
		typeof amount === "bigint" ? new BN(amount.toString()) : new BN(amount);

	return program.methods
		.placeBet(bucket, bnAmount)
		.accounts({
			user,
			userPosition: userPositionPDA,
		})
		.rpc();
}
