use anchor_lang::prelude::*;
use anchor_lang::system_program::{Transfer, transfer};
use crate::{errors::ErrorCode, states::*};
use crate::utils::*;

pub fn claim_reward(ctx:Context<ClaimReward>)->Result<()>{
  let market=&mut ctx.accounts.market;
  let user_position=&mut ctx.accounts.user_position;

  require!(market.resolved, ErrorCode::MarketNotResolved);
  require!(!user_position.claimed, ErrorCode::AlreadyClaimed);

  require!(
    is_winner(user_position.bucket, market.final_outcome, market.radius, market.fallback_used, &market.pool),
    ErrorCode::NotAWinner
  );

  let payout=calc_user_payout(user_position.weighted_amount, user_position.bucket, &market.bucket_prize, &market.weighted_pool)?;

  require!(payout>0,ErrorCode::InsufficientClaimAmount);

  user_position.claimed=true;

  let market_key=market.key();
  let vault_bump=ctx.bumps.vault;
  let market_key_seeds=market_key.as_array();
  let bump_seeds=&[vault_bump];
  let vault_seeds: &[&[u8]]=&[VAULT_SEED,market_key_seeds,bump_seeds];
  let signer_seeds: &[&[&[u8]]] = &[vault_seeds];

  transfer(
    CpiContext::new_with_signer(
      ctx.accounts.system_program.to_account_info(),
      Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.user.to_account_info(),
      },
      signer_seeds,
    ),
    payout,
  )?;

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