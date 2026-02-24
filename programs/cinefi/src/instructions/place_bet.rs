use anchor_lang::prelude::*;
use crate::{errors::ErrorCode, states::*};

pub fn place_bet(ctx:Context<PlaceBet>, bucket: u8, amount: u64)->Result<()>{
  Ok(())
}

#[derive(Accounts)]
#[instruction(bucket: u8, amount: u64)]
pub struct PlaceBet<'info>{
  #[account(mut)]
  pub user: Signer<'info>,

  #[account(
    mut,
    seeds=[MARKET_SEED, &market.media_id.to_le_bytes()],
    bump = market.bump,
    constraint = !market.resolved
      @ErrorCode::MarketAlreadyResolved,
    constraint = !market.closed
      @ErrorCode::MarketAlreadyClosed,
    constraint = Clock::get()?.unix_timestamp >=market.betting_starts_at
      @ErrorCode::BettingNotStarted,
    constraint = Clock::get()?.unix_timestamp <= market.betting_closes_at
      @ErrorCode::BettingClosed
  )]
  pub market: Account<'info, Market>,

  #[account(
    init_if_needed,
    payer = user,
    space = 8+UserPosition::INIT_SPACE,
    seeds = [POSITION_SEED, user.key().as_ref(), market.key().as_ref(), &[bucket]],
    bump,
    constraint = user_position.user == Pubkey::default() || user_position.user == user.key() 
      @ErrorCode::Unauthorized
  )]
  pub user_position: Account<'info, UserPosition>,

  #[account(
    mut,
    seeds=[VAULT_SEED, market.key().as_ref()],
    bump
  )]
  pub vault: UncheckedAccount<'info>,

  pub system_program: Program<'info, System>
}