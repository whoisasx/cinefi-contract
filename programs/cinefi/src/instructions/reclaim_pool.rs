use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;

pub fn reclaim_pool(ctx:Context<ReclaimPool>)->Result<()>{
  Ok(())
}

#[derive(Accounts)]
pub struct ReclaimPool<'info>{
  #[account(mut)]
  pub caller: Signer<'info>,

  #[account(
    mut,
    seeds=[MARKET_SEED,&market.media_id.to_le_bytes()],
    bump=market.bump,
    constraint= market.resolved
      @ErrorCode::MarketNotResolved,
    constraint = !market.reclaimed
      @ErrorCode::MarketAlreadyClaimed,
    constraint= Clock::get()?.unix_timestamp >= market.claim_deadline
      @ErrorCode::ClaimDeadlineNotPassed
  )]
  pub market: Account<'info ,Market>,

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

  pub system_program: Program<'info,System>
}