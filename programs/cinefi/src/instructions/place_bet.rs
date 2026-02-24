use anchor_lang::prelude::*;
use crate::{errors::ErrorCode, states::*};
use anchor_lang::system_program::{transfer, Transfer};
use crate::utils::*;

pub fn place_bet(ctx:Context<PlaceBet>, bucket: u8, amount: u64)->Result<()>{
  let clock=Clock::get()?;
  let now=clock.unix_timestamp;

  let market=&mut ctx.accounts.market;
  let user_position=&mut ctx.accounts.user_position;

  require!(amount > MINIMUM_STAKE_AMOUNT , ErrorCode::InvalidAmount);
  require!(!market.closed, ErrorCode::MarketAlreadyClosed);
  require!(!market.resolved, ErrorCode::MarketAlreadyResolved);
  require!(now <= market.betting_closes_at, ErrorCode::BettingClosed);
  require!(bucket>0 && bucket<=100, ErrorCode::InvalidBucket);

  let day_index=get_day_index(now,market.betting_starts_at);
  let new_weighted_amount=calc_weigthed_amount(amount,day_index)?;

  let cpi_context=CpiContext::new(
    ctx.accounts.system_program.to_account_info(),
    Transfer{
      from:ctx.accounts.user.to_account_info(),
      to:ctx.accounts.vault.to_account_info()
    }
  );
  transfer(cpi_context, amount)?;

  let idx= bucket as usize;
  market.pool[idx]=market.pool[idx].checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
  market.weighted_pool[idx]=market.weighted_pool[idx].checked_add(new_weighted_amount).ok_or(ErrorCode::MathOverflow)?;
  market.total_pool=market.total_pool.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;

  if user_position.amount==0 {
    user_position.user=ctx.accounts.user.key();
    user_position.market=market.key();
    user_position.bucket=bucket;
    user_position.claimed=false;
    user_position.bump=ctx.bumps.user_position;
  }
  user_position.amount=user_position.amount.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
  user_position.weighted_amount=user_position.weighted_amount.checked_add(new_weighted_amount).ok_or(ErrorCode::MathOverflow)?;

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