use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;

pub fn resolve_market(ctx:Context<ResolveMarket>)->Result<()>{
  Ok(())
}

#[derive(Accounts)]
pub struct ResolveMarket<'info>{
  #[account(mut)]
  pub caller: Signer<'info>,

  #[account(
    mut, 
    seeds=[MARKET_SEED, &market.media_id.to_le_bytes()],
    bump=market.bump,
    constraint= market.closed
      @ErrorCode::MarketNotClosed,
    constraint= !market.resolved
      @ErrorCode::MarketAlreadyResolved,
    constraint= Clock::get()?.unix_timestamp >= market.settle_at
      @ErrorCode::SettlementNotReady
  )]
  pub market: Account<'info, Market>,

  #[account(
    seeds=[ORACLE_REPORT_SEED, market.key().as_ref()],
    bump=oracle_report.bump,
    constraint= oracle_report.finalized
      @ErrorCode::OracleNotFinalized
  )]
  pub oracle_report: Account<'info, OracleReport>,

  #[account(
    mut,
    seeds=[VAULT_SEED, market.key().as_ref()],
    bump
  )]
  pub vault: UncheckedAccount<'info>,

  #[account(
    mut,
    seeds=[TREASURY_SEED],
    bump
  )]
  pub treasury: UncheckedAccount<'info>,

  pub system_program: Program<'info, System>
}