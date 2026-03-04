import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import type { Cinefi, CreateMarketParams } from "../types";
import {
	deriveMarketPDA,
	deriveVaultPDA,
	deriveOracleReportPDA,
} from "../pdas";
import { DEFAULT_RADIUS } from "../constants";
import { validateOracleThreshold } from "../utils";

/**
 * Build create_market instruction
 */
export async function createMarket(
	program: Program<Cinefi>,
	creator: PublicKey,
	params: CreateMarketParams,
) {
	const {
		mediaId,
		bettingStartsAfter = null,
		radius = DEFAULT_RADIUS,
		oracleSet,
		oracleThreshold = 2,
	} = params;

	// Validate inputs
	validateOracleThreshold(oracleThreshold, 3);

	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [oracleReportPDA] = deriveOracleReportPDA(
		program.programId,
		marketPDA,
	);

	return program.methods
		.createMarket(
			bettingStartsAfter ? new BN(bettingStartsAfter) : null,
			new BN(mediaId.toString()),
			radius,
			oracleSet,
			oracleThreshold,
		)
		.accounts({
			creator,
		})
		.instruction();
}

export async function createMarketAndSend(
	program: Program<Cinefi>,
	creator: PublicKey,
	params: CreateMarketParams,
) {
	const {
		mediaId,
		bettingStartsAfter = null,
		radius = DEFAULT_RADIUS,
		oracleSet,
		oracleThreshold = 2,
	} = params;

	validateOracleThreshold(oracleThreshold, 3);

	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [oracleReportPDA] = deriveOracleReportPDA(
		program.programId,
		marketPDA,
	);

	return program.methods
		.createMarket(
			bettingStartsAfter ? new BN(bettingStartsAfter) : null,
			new BN(mediaId.toString()),
			radius,
			oracleSet,
			oracleThreshold,
		)
		.accounts({
			creator,
		})
		.rpc();
}
