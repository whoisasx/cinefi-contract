import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { Cinefi } from "../../contract/cinefi";
import IDL from "../../contract/cinefi.json";
import { config, Network } from "./config";
import {
	MarketData,
	UserPositionData,
	OracleReportData,
	OracleSubmissionData,
	BucketPoolData,
	BucketPrizeData,
} from "./types/events";

function makeProgram(network: Network): Program<Cinefi> {
	const rpcUrl =
		network === "mainnet" ? config.mainnetRpcUrl : config.devnetRpcUrl;
	const connection = new Connection(rpcUrl, "confirmed");
	const provider = new AnchorProvider(connection, {} as never, {
		commitment: "confirmed",
	});
	return new Program<Cinefi>(IDL as Cinefi, provider);
}

const programs: Partial<Record<Network, Program<Cinefi>>> = {};

export function getProgram(network: Network): Program<Cinefi> {
	if (!programs[network]) {
		programs[network] = makeProgram(network);
	}
	return programs[network]!;
}

export async function fetchMarket(
	pubkey: PublicKey,
	network: Network,
): Promise<MarketData> {
	const program = getProgram(network);
	const acc = await program.account["market"].fetch(pubkey);

	return {
		pubkey: pubkey.toBase58(),
		mediaId: acc.mediaId.toString(),
		creator: acc.creator.toBase58(),

		createdAt: acc.createdAt.toNumber(),
		bettingStartsAt: acc.bettingStartsAt.toNumber(),
		bettingClosesAt: acc.bettingClosesAt.toNumber(),
		settleAt: acc.settleAt.toNumber(),
		claimDeadline: acc.claimDeadline.toNumber(),

		radius: acc.radius,
		protocolFeeBps: acc.protocolFeeBps,
		creatorFeeBps: acc.creatorFeeBps,

		oracleSet: acc.oracleSet.map((k: PublicKey) => k.toBase58()),
		oracleThreshold: acc.oracleThreshold,

		totalPool: acc.totalPool.toString(),
		totalPrizePool: acc.totalPrizePool.toString(),

		finalOutcome: acc.resolved ? acc.finalOutcome : null,
		fallbackUsed: acc.fallbackUsed,

		resolved: acc.resolved,
		closed: acc.closed,
		reclaimed: acc.reclaimed,
	};
}

export async function fetchUserPosition(
	pubkey: PublicKey,
	network: Network,
): Promise<UserPositionData> {
	const program = getProgram(network);
	const acc = await program.account["userPosition"].fetch(pubkey);

	return {
		pubkey: pubkey.toBase58(),
		user: acc.user.toBase58(),
		market: acc.market.toBase58(),
		bucket: acc.bucket,
		amount: acc.amount.toString(),
		weightedAmount: acc.weightedAmount.toString(),
		claimed: acc.claimed,
	};
}

export async function fetchOracleReport(
	pubkey: PublicKey,
	network: Network,
): Promise<OracleReportData> {
	const program = getProgram(network);
	const acc = await program.account["oracleReport"].fetch(pubkey);

	const submissions: OracleSubmissionData[] = (
		acc.submissions as Array<{ signer: PublicKey; score: number }>
	)
		.slice(0, acc.submissionCount)
		.map((s) => ({ signer: s.signer.toBase58(), score: s.score }));

	return {
		pubkey: pubkey.toBase58(),
		market: acc.market.toBase58(),
		submissionCount: acc.submissionCount,
		submissions,
		agreedScore: acc.finalized ? acc.agreedScore : null,
		finalized: acc.finalized,
		disputed: acc.disputed,
	};
}

export async function fetchBucketPool(
	marketPubkey: PublicKey,
	bucket: number,
	network: Network,
): Promise<BucketPoolData> {
	const program = getProgram(network);
	const acc = await program.account["market"].fetch(marketPubkey);
	const pool = acc.pool as Array<{ toString(): string }>;
	const weightedPool = acc.weightedPool as Array<{ toString(): string }>;
	return {
		bucket,
		amount: pool[bucket].toString(),
		weightedAmount: weightedPool[bucket].toString(),
	};
}

export async function fetchBucketPrizes(
	marketPubkey: PublicKey,
	network: Network,
): Promise<BucketPrizeData[]> {
	const program = getProgram(network);
	const acc = await program.account["market"].fetch(marketPubkey);
	const bucketPrize = acc.bucketPrize as Array<{ toString(): string }>;
	return bucketPrize
		.map((prize, bucket) => ({ bucket, prize: prize.toString() }))
		.filter(({ prize }) => prize !== "0");
}
