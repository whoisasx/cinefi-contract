use anchor_lang::prelude::*;
use crate::{errors::ErrorCode, states::*};

pub fn claim_reward(ctx:Context<ClaimReward>)->Result<()>{
  Ok(())
}

#[derive(Accounts)]
pub struct ClaimReward<'info>{
  #[account(mut)]
  pub user: Signer<'info>,

  #[account(
    seeds=[MARKET_SEED, &market.media_id.to_le_bytes()],
    bump=market.bump,
    constraint= market.resolved
      @ErrorCode::MarketNotResolved,
    constraint= Clock::get()?.unix_timestamp <= market.claim_deadline
      @ErrorCode::ClaimDeadlinePassed
  )]
  pub market: Account<'info,Market>,

  #[account(
    mut,
    seeds=[POSITION_SEED, user.key().as_ref(),market.key().as_ref(), &[user_position.bucket]],
    bump=user_position.bump,
    constraint= user_position.user==user.key()
      @ErrorCode::Unauthorized,
    constraint= !user_position.claimed
      @ErrorCode::AlreadyClaimed,
    close=user
  )]
  pub user_position: Account<'info, UserPosition>,

  #[account(
    mut,
    seeds=[VAULT_SEED, market.key().as_ref()],
    bump
  )]
  pub vault: UncheckedAccount<'info>,

  pub system_program: Program<'info,System>
}