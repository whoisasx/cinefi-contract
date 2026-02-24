use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode{
  #[msg("market is already closed")]
  MarketAlreadyClosed,

  #[msg("market is not closed yet")]
  MarketNotClosed,

  #[msg("market is already resolved")]
  MarketAlreadyResolved,

  #[msg("market is not resolved yet")]
  MarketNotResolved,

  #[msg("market has been already reclaimed")]
  MarketAlreadyClaimed,


  #[msg("betting is not started yet")]
  BettingNotStarted,

  #[msg("betting window is closed")]
  BettingClosed,

  #[msg("betting window is still open")]
  BettingStillOpen,

  #[msg("settlement time not reached yet")]
  SettlementNotReady,

  #[msg("seltlement time is not valid")]
  SettlementTimeInvalid,

  #[msg("claim deadline is passed")]
  ClaimDeadlinePassed,

  #[msg("claim deadline has not passed yet")]
  ClaimDeadlineNotPassed,


  #[msg("oracle submission window is not open")]
  OracleWindowClosed,

  #[msg("signer is not in the oracle set")]
  UnauthorizedOracle,

  #[msg("oracle report is finalized already")]
  OracleAlreadyFinalized,

  #[msg("oracle report is not finalized yet")]
  OracleNotFinalized,

  #[msg("oracle signer has already submitted")]
  OracleAlreadySubmitted,

  #[msg("oracle report is disputed - signers disagree")]
  OracleDisputed,


  #[msg("invalid bucket: must be 0-99")]
  InvalidBucket,

  #[msg("bet amount must be greater than zero")]
  InvalidAmount,

  #[msg("reward already claimed")]
  AlreadyClaimed,

  #[msg("user is not a winner - bucket outside winning radius")]
  NotAWinner,

  #[msg("you did not place this position")]
  Unauthorized,

  #[msg("math overflow")]
  MathOverflow,

  #[msg("math underflow")]
  MathUnderflow
}