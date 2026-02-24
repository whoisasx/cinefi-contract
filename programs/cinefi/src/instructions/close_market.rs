use anchor_lang::prelude::*;
use crate::{errors::ErrorCode, states::*};

pub fn close_market(ctx:Context<CloseMarket>)->Result<()>{
  Ok(())
}

#[derive(Accounts)]
pub struct CloseMarket<'info>{
  #[account(mut)]
  pub caller: Signer<'info>,


  #[account(
    mut,
    seeds=[MARKET_SEED, &market.key().as_ref()],
    bump=market.bump,
    constraint = !market.closed
      @ErrorCode::MarketAlreadyClosed,
    constraint = Clock::get()?.unix_timestamp >= market.betting_closes_at
      @ErrorCode::BettingStillOpen
  )]
  pub market: Account<'info, Market>
}