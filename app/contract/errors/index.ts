export enum CinefiErrorCode {
	MarketAlreadyClosed = 6000,
	MarketNotClosed = 6001,
	MarketAlreadyResolved = 6002,
	MarketNotResolved = 6003,
	MarketAlreadyClaimed = 6004,
	BettingNotStarted = 6005,
	BettingClosed = 6006,
	BettingStillOpen = 6007,
	SettlementNotReady = 6008,
	SettlementTimeInvalid = 6009,
	ClaimDeadlinePassed = 6010,
	ClaimDeadlineNotPassed = 6011,
	OracleWindowClosed = 6012,
	UnauthorizedOracle = 6013,
	InvalidOracleThreshold = 6014,
	OracleAlreadyFinalized = 6015,
	OracleNotFinalized = 6016,
	OracleAlreadySubmitted = 6017,
	OracleDisputed = 6018,
	InvalidBucket = 6019,
	InvalidAmount = 6020,
	AlreadyClaimed = 6021,
	InsufficientClaimAmount = 6022,
	NotAWinner = 6023,
	Unauthorized = 6024,
	MathOverflow = 6025,
	MathUnderflow = 6026,
}

export const ERROR_MESSAGES: Record<CinefiErrorCode, string> = {
	[CinefiErrorCode.MarketAlreadyClosed]: "market is already closed",
	[CinefiErrorCode.MarketNotClosed]: "market is not closed yet",
	[CinefiErrorCode.MarketAlreadyResolved]: "market is already resolved",
	[CinefiErrorCode.MarketNotResolved]: "market is not resolved yet",
	[CinefiErrorCode.MarketAlreadyClaimed]: "market has been already reclaimed",
	[CinefiErrorCode.BettingNotStarted]: "betting is not started yet",
	[CinefiErrorCode.BettingClosed]: "betting window is closed",
	[CinefiErrorCode.BettingStillOpen]: "betting window is still open",
	[CinefiErrorCode.SettlementNotReady]: "settlement time not reached yet",
	[CinefiErrorCode.SettlementTimeInvalid]: "settlement time is not valid",
	[CinefiErrorCode.ClaimDeadlinePassed]: "claim deadline is passed",
	[CinefiErrorCode.ClaimDeadlineNotPassed]:
		"claim deadline has not passed yet",
	[CinefiErrorCode.OracleWindowClosed]:
		"oracle submission window is not open",
	[CinefiErrorCode.UnauthorizedOracle]: "signer is not in the oracle set",
	[CinefiErrorCode.InvalidOracleThreshold]: "invalid oracle threshold",
	[CinefiErrorCode.OracleAlreadyFinalized]:
		"oracle report is finalized already",
	[CinefiErrorCode.OracleNotFinalized]: "oracle report is not finalized yet",
	[CinefiErrorCode.OracleAlreadySubmitted]:
		"oracle signer has already submitted",
	[CinefiErrorCode.OracleDisputed]:
		"oracle report is disputed - signers disagree",
	[CinefiErrorCode.InvalidBucket]: "invalid bucket: must be from 1 to 100",
	[CinefiErrorCode.InvalidAmount]:
		"bet amount must be greater than zero dollar",
	[CinefiErrorCode.AlreadyClaimed]: "reward already claimed",
	[CinefiErrorCode.InsufficientClaimAmount]: "insufficient reward amount",
	[CinefiErrorCode.NotAWinner]:
		"user is not a winner - bucket outside winning radius",
	[CinefiErrorCode.Unauthorized]: "you did not place this position",
	[CinefiErrorCode.MathOverflow]: "math overflow",
	[CinefiErrorCode.MathUnderflow]: "math underflow",
};

export class CinefiError extends Error {
	constructor(public code: CinefiErrorCode, message?: string) {
		super(message || ERROR_MESSAGES[code] || `Unknown error code: ${code}`);
		this.name = "CinefiError";
	}

	static fromCode(code: number): CinefiError | null {
		if (code >= 6000 && code <= 6026) {
			return new CinefiError(code as CinefiErrorCode);
		}
		return null;
	}
}

export function parseCinefiError(error: any): CinefiError | null {
	// Check for Anchor program error
	if (error?.code !== undefined) {
		return CinefiError.fromCode(error.code);
	}

	// Check for error in logs
	if (error?.logs) {
		for (const log of error.logs) {
			const match = log.match(/custom program error: 0x([0-9a-fA-F]+)/);
			if (match) {
				const code = parseInt(match[1], 16);
				const cinefiError = CinefiError.fromCode(code);
				if (cinefiError) return cinefiError;
			}
		}
	}

	return null;
}
