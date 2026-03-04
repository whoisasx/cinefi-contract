import { PublicKey } from "@solana/web3.js";
import { MIN_BUCKET, MAX_BUCKET } from "../constants";
import type { Market } from "../types";

export function mediaIdToBytes(mediaId: bigint): Buffer {
	const buf = Buffer.alloc(8);
	buf.writeBigInt64LE(mediaId);
	return buf;
}

export function bucketToBytes(bucket: number): Buffer {
	const buf = Buffer.alloc(1);
	buf.writeUInt8(bucket);
	return buf;
}

export function validateBucket(bucket: number): void {
	if (!Number.isInteger(bucket)) {
		throw new Error("Bucket must be an integer");
	}
	if (bucket < MIN_BUCKET || bucket > MAX_BUCKET) {
		throw new Error(
			`Bucket must be between ${MIN_BUCKET} and ${MAX_BUCKET}`,
		);
	}
}

export function validateAmount(amount: bigint | number): void {
	const amt = typeof amount === "bigint" ? amount : BigInt(amount);
	if (amt <= BigInt(0)) {
		throw new Error("Amount must be greater than zero");
	}
}

/**
 * Validate oracle threshold
 */
export function validateOracleThreshold(
	threshold: number,
	oracleCount: number,
): void {
	if (threshold < 1 || threshold > oracleCount) {
		throw new Error(
			`Oracle threshold must be between 1 and ${oracleCount}`,
		);
	}
}

export function isWinningBucket(
	userBucket: number,
	finalOutcome: number,
	radius: number,
): boolean {
	const distance = Math.abs(userBucket - finalOutcome);
	return distance <= radius;
}

export function getCurrentTimestamp(): number {
	return Math.floor(Date.now() / 1000);
}

export function isBettingOpen(market: Market, currentTime?: number): boolean {
	const now = currentTime ?? getCurrentTimestamp();
	return (
		now >= market.bettingStartsAt.toNumber() &&
		now < market.bettingClosesAt.toNumber() &&
		!market.closed
	);
}

export function canCloseMarket(market: Market, currentTime?: number): boolean {
	const now = currentTime ?? getCurrentTimestamp();
	return now >= market.bettingClosesAt.toNumber() && !market.closed;
}

export function canSubmitScore(market: Market, currentTime?: number): boolean {
	const now = currentTime ?? getCurrentTimestamp();
	const windowStart = market.settleAt.toNumber() + 0; // ORACLE_WINDOWS_START_SECONDS
	const windowEnd = market.settleAt.toNumber() + 3600; // ORACLE_WINDOWS_CLOSE_SECONDS
	return (
		now >= windowStart &&
		now < windowEnd &&
		market.closed &&
		!market.resolved
	);
}

export function canResolveMarket(market: Market): boolean {
	return market.closed && !market.resolved;
}

export function canClaimReward(market: Market, currentTime?: number): boolean {
	const now = currentTime ?? getCurrentTimestamp();
	return (
		market.resolved &&
		!market.reclaimed &&
		now <= market.claimDeadline.toNumber()
	);
}

export function canReclaimPool(market: Market, currentTime?: number): boolean {
	const now = currentTime ?? getCurrentTimestamp();
	return (
		market.resolved &&
		!market.reclaimed &&
		now > market.claimDeadline.toNumber()
	);
}

export function lamportsToSol(lamports: bigint): number {
	return Number(lamports) / 1e9;
}

export function solToLamports(sol: number): bigint {
	return BigInt(Math.floor(sol * 1e9));
}

export function getMarketState(market: Market, currentTime?: number) {
	const now = currentTime ?? getCurrentTimestamp();

	return {
		isOpen: isBettingOpen(market, now),
		isClosed: market.closed,
		isResolved: market.resolved,
		isReclaimed: market.reclaimed,
		canBet: isBettingOpen(market, now),
		canClose: canCloseMarket(market, now),
		canSubmitScore: canSubmitScore(market, now),
		canResolve: canResolveMarket(market),
		canClaim: canClaimReward(market, now),
		canReclaim: canReclaimPool(market, now),
	};
}
