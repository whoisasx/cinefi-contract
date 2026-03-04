import { PublicKey } from "@solana/web3.js";
import { IdlAccounts } from "@coral-xyz/anchor";

export type { Cinefi } from "../cinefi";
import type { Cinefi } from "../cinefi";

export type Market = IdlAccounts<Cinefi>["market"];
export type OracleReport = IdlAccounts<Cinefi>["oracleReport"];
export type UserPosition = IdlAccounts<Cinefi>["userPosition"];

export type OracleSubmission = {
	signer: PublicKey;
	score: number;
};

export interface CreateMarketParams {
	mediaId: bigint;
	bettingStartsAfter?: number | null;
	radius?: number;
	oracleSet: [PublicKey, PublicKey, PublicKey];
	oracleThreshold?: number;
}

export interface PlaceBetParams {
	mediaId: bigint;
	bucket: number;
	amount: bigint | number;
}

export interface SubmitScoreParams {
	mediaId: bigint;
	score: number;
}

export interface MarketState {
	isOpen: boolean;
	isClosed: boolean;
	isResolved: boolean;
	isReclaimed: boolean;
	canBet: boolean;
	canClose: boolean;
	canSubmitScore: boolean;
	canResolve: boolean;
	canClaim: boolean;
	canReclaim: boolean;
}

export interface PositionSummary {
	bucket: number;
	amount: bigint;
	weightedAmount: bigint;
	claimed: boolean;
	isWinner: boolean;
	potentialReward: bigint;
}
