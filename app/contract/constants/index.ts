export const TIME_MULTIPLIERS: readonly number[] = [
	1000, 904, 818, 740, 670, 606, 548, 496, 449, 406, 367, 332, 301, 272,
] as const;

export const MULTIPLIER_SCALE = 1000;
export const CLOSENESS_SCALE = 1_000_000;
export const MINIMUM_STAKE_AMOUNT = 0;
export const SECONDS_PER_DAY = 86_400;
export const SECONDS_PER_HOUR = 3_600;
export const BETTING_DURATION_DAYS = 14;
export const SETTLEMENT_DAY = 21;
export const CLAIM_WINDOW_DAYS = 14;
export const DEFAULT_RADIUS = 5;
export const DEFAULT_PROTOCOL_FEE_BPS = 300;
export const DEFAULT_CREATOR_FEE_BPS = 0;
export const MAX_ORACLE_SIGNER = 3;
export const ORACLE_WINDOWS_START_SECONDS = 0;
export const ORACLE_WINDOWS_CLOSE_SECONDS = 3_600;
export const MAX_BUCKETS = 101;
export const MIN_BUCKET = 0;
export const MAX_BUCKET = 100;

export function getTimeMultiplier(day: number): number {
	if (day < 1 || day > TIME_MULTIPLIERS.length) {
		throw new Error(`Day must be between 1 and ${TIME_MULTIPLIERS.length}`);
	}
	return TIME_MULTIPLIERS[day - 1];
}

export function calculateDaysRemaining(
	bettingStartsAt: number,
	bettingClosesAt: number,
	currentTime: number,
): number {
	const secondsElapsed = currentTime - bettingStartsAt;
	const totalDuration = bettingClosesAt - bettingStartsAt;
	const secondsRemaining = Math.max(0, totalDuration - secondsElapsed);
	const daysRemaining = Math.ceil(secondsRemaining / SECONDS_PER_DAY);

	return Math.max(1, Math.min(BETTING_DURATION_DAYS, daysRemaining));
}
