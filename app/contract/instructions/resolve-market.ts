import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { Cinefi } from "../types";
import {
	deriveMarketPDA,
	deriveOracleReportPDA,
	deriveVaultPDA,
	deriveTreasuryPDA,
} from "../pdas";

/**
 * Build resolve_market instruction
 */
export async function resolveMarket(
	program: Program<Cinefi>,
	resolver: PublicKey,
	mediaId: bigint,
) {
	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [oracleReportPDA] = deriveOracleReportPDA(
		program.programId,
		marketPDA,
	);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [treasuryPDA] = deriveTreasuryPDA(program.programId);

	return program.methods
		.resolveMarket()
		.accounts({
			caller: resolver,
		})
		.instruction();
}

export async function resolveMarketAndSend(
	program: Program<Cinefi>,
	resolver: PublicKey,
	mediaId: bigint,
) {
	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [oracleReportPDA] = deriveOracleReportPDA(
		program.programId,
		marketPDA,
	);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [treasuryPDA] = deriveTreasuryPDA(program.programId);

	return program.methods
		.resolveMarket()
		.accounts({
			caller: resolver,
		})
		.rpc();
}
