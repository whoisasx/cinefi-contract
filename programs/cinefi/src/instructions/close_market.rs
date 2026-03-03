use anchor_lang::prelude::*;
use crate::{errors::ErrorCode, states::*};

pub fn close_market(ctx:Context<CloseMarket>)->Result<()>{
  let clock=Clock::get()?;
  let now=clock.unix_timestamp;

  let market=&mut ctx.accounts.market;
  require!(!market.closed, ErrorCode::MarketAlreadyClosed);
  require!(!market.resolved, ErrorCode::MarketAlreadyResolved);
  require!(now >= market.betting_closes_at, ErrorCode::BettingStillOpen);

  market.closed=true;
  
  Ok(())
}

#[derive(Accounts)]
pub struct CloseMarket<'info>{
  #[account(mut)]
  pub caller: Signer<'info>,


  #[account(
    mut,
    seeds=[MARKET_SEED, &market.media_id.to_le_bytes()],
    bump=market.bump,
    constraint = !market.closed
      @ErrorCode::MarketAlreadyClosed,
    constraint = Clock::get()?.unix_timestamp >= market.betting_closes_at
      @ErrorCode::BettingStillOpen
  )]
  pub market: Box<Account<'info, Market>>
}