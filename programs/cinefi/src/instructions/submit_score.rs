use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;

pub fn submit_score(ctx:Context<SubmitScore>, score: u8)->Result<()>{
  Ok(())
}

#[derive(Accounts)]
pub struct SubmitScore<'info>{
  #[account(mut)]
  pub oracle_signer:Signer<'info>,

  #[account(
    seeds=[MARKET_SEED, &market.media_id.to_le_bytes()],
    bump=market.bump,
    constraint= market.closed
      @ErrorCode::MarketNotClosed,
    constraint= !market.resolved
      @ErrorCode::MarketAlreadyResolved,
    constraint= market.oracle_set.contains(oracle_signer.key)
      @ErrorCode::UnauthorizedOracle
  )]
  pub market:Account<'info,Market>,

  #[account(
    mut,
    seeds=[ORACLE_REPORT_SEED, market.key().as_ref()],
    bump=oracle_report.bump,
    constraint= !oracle_report.finalized
      @ErrorCode::OracleAlreadyFinalized,
    constraint= !oracle_report.disputed
      @ErrorCode::OracleDisputed
  )]
  pub oracle_report: Account<'info, OracleReport>,

  pub system_program: Program<'info, System>
}