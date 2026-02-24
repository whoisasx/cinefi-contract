use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct SubmitScore<'info>{
  #[account(mut)]
  pub oracle_signer:Signer<'info>,

  #[account(
    seeds=[MARKET_SEED, &market.media_id.to_le_bytes()],
    bump,
    constraint= market.closed
      @ErrorCode::MarketNotClosed,
    constraint= !market.resolved
      @ErrorCode::MarketAlreadyResolved,
    constraint= market.oracle_set.contains(oracle_signer.key)
      @ErrorCode::UnauthorizedOracle
  )]
  pub market:Account<'info,Market>,

  #[account()]
  pub oracle_report: Account<'info, OracleReport>,

  pub system_program: Program<'info, System>
}