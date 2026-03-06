import { Network } from "../config";

export interface EventEnvelope<T extends string, D> {
	eventType: T;
	network: Network;
	signature: string;
	slot: number;
	timestamp: number;
	marketId?: string;
	data: D;
}

export interface MarketData {
	pubkey: string;
	mediaId: string;
	creator: string;
	createdAt: number;
	bettingStartsAt: number;
	bettingClosesAt: number;
	settleAt: number;
	claimDeadline: number;

	radius: number;
	protocolFeeBps: number;
	creatorFeeBps: number;

	oracleSet: string[];
	oracleThreshold: number;

	totalPool: string;
	totalPrizePool: string;

	finalOutcome: number | null;
	fallbackUsed: boolean;

	resolved: boolean;
	closed: boolean;
	reclaimed: boolean;
}

export interface UserPositionData {
	pubkey: string;
	user: string;
	market: string;
	bucket: number;
	amount: string;
	weightedAmount: string;
	claimed: boolean;
}

export interface OracleReportData {
	pubkey: string;
	market: string;
	submissionCount: number;
	submissions: OracleSubmissionData[];
	agreedScore: number | null;
	finalized: boolean;
	disputed: boolean;
}

export interface OracleSubmissionData {
	signer: string;
	score: number;
}

export interface BucketPoolData {
	bucket: number;
	amount: string;
	weightedAmount: string;
}

export interface BucketPrizeData {
	bucket: number;
	prize: string;
}

export type CreateMarketEvent = EventEnvelope<
	"create_market",
	{ market: MarketData; oracleReport: OracleReportData }
>;

export type PlaceBetEvent = EventEnvelope<
	"place_bet",
	{
		market: MarketData;
		position: UserPositionData;
		bucketPool: BucketPoolData;
	}
>;

export type CloseMarketEvent = EventEnvelope<
	"close_market",
	{ market: MarketData }
>;

export type SubmitScoreEvent = EventEnvelope<
	"submit_score",
	{ oracleReport: OracleReportData }
>;

export type ResolveMarketEvent = EventEnvelope<
	"resolve_market",
	{
		market: MarketData;
		oracleReport: OracleReportData;
		bucketPrizes: BucketPrizeData[];
	}
>;

export type ClaimRewardEvent = EventEnvelope<
	"claim_reward",
	{ position: UserPositionData }
>;

export type ReclaimPoolEvent = EventEnvelope<
	"reclaim_pool",
	{ market: MarketData }
>;

export type InitializeTreasuryEvent = EventEnvelope<
	"initialize_treasury",
	Record<string, never>
>;

export type EventPayload =
	| CreateMarketEvent
	| PlaceBetEvent
	| CloseMarketEvent
	| SubmitScoreEvent
	| ResolveMarketEvent
	| ClaimRewardEvent
	| ReclaimPoolEvent
	| InitializeTreasuryEvent;
