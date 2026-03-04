import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { Cinefi, Market, OracleReport, UserPosition } from "../types";
import {
	deriveMarketPDA,
	deriveOracleReportPDA,
	deriveUserPositionPDA,
} from "../pdas";

/**
 * Fetch Market account
 */
export async function fetchMarket(
	program: Program<Cinefi>,
	mediaId: bigint,
): Promise<Market | null> {
	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);

	try {
		return await program.account.market.fetch(marketPDA);
	} catch (error) {
		return null;
	}
}

export async function fetchMarkets(
	program: Program<Cinefi>,
	mediaIds: bigint[],
): Promise<(Market | null)[]> {
	return Promise.all(mediaIds.map((id) => fetchMarket(program, id)));
}

export async function fetchOracleReport(
	program: Program<Cinefi>,
	marketKey: PublicKey,
): Promise<OracleReport | null> {
	const [oracleReportPDA] = deriveOracleReportPDA(
		program.programId,
		marketKey,
	);

	try {
		return await program.account.oracleReport.fetch(oracleReportPDA);
	} catch (error) {
		return null;
	}
}

export async function fetchUserPosition(
	program: Program<Cinefi>,
	userKey: PublicKey,
	marketKey: PublicKey,
	bucket: number,
): Promise<UserPosition | null> {
	const [positionPDA] = deriveUserPositionPDA(
		program.programId,
		userKey,
		marketKey,
		bucket,
	);

	try {
		return await program.account.userPosition.fetch(positionPDA);
	} catch (error) {
		return null;
	}
}

export async function fetchUserPositionsForMarket(
	program: Program<Cinefi>,
	userKey: PublicKey,
	marketKey: PublicKey,
): Promise<UserPosition[]> {
	const positions: UserPosition[] = [];

	const fetchPromises = Array.from({ length: 101 }, (_, bucket) =>
		fetchUserPosition(program, userKey, marketKey, bucket),
	);

	const results = await Promise.all(fetchPromises);

	return results.filter(
		(pos: UserPosition | null): pos is UserPosition => pos !== null,
	);
}

export async function accountExists(
	connection: Connection,
	publicKey: PublicKey,
): Promise<boolean> {
	const accountInfo = await connection.getAccountInfo(publicKey);
	return accountInfo !== null;
}
