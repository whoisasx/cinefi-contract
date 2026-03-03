use anchor_lang::prelude::*;
use anchor_lang::system_program::{Transfer, transfer};
use crate::states::*;
use crate::errors::ErrorCode;

pub fn reclaim_pool(ctx:Context<ReclaimPool>)->Result<()>{
  let clock=Clock::get()?;
  let now=clock.unix_timestamp;
  let market=&mut ctx.accounts.market;

  require!(!market.reclaimed,ErrorCode::MarketAlreadyClaimed);
  require!(now>=market.claim_deadline, ErrorCode::ClaimDeadlineNotPassed);

  let vault_balance= ctx.accounts.vault.lamports();
  if vault_balance>0 {
    let market_key=market.key();
    let market_key_seeds = market_key.as_array();
    let vault_bump     = ctx.bumps.vault;
    let vault_seeds: &[&[u8]] = &[VAULT_SEED, market_key_seeds, &[vault_bump]];
    let signer_seeds   = &[vault_seeds]; 

    transfer(
      CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
          from: ctx.accounts.vault.to_account_info(),
          to: ctx.accounts.treasury.to_account_info(),
      },
        signer_seeds,
      ),
      vault_balance,
    )?;
  }

  market.reclaimed=true;

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
  pub market: Box<Account<'info, Market>>,

  #[account(
    mut,
    seeds=[VAULT_SEED, market.key().as_ref()],
    bump
  )]
  /// CHECK: PDA vault account. Safety verified by seeds constraint.
  pub vault: UncheckedAccount<'info>,

  #[account(
    mut,
    seeds=[TREASURY_SEED],
    bump
  )]
  /// CHECK: PDA treasury account. Safety verified by seeds constraint.
  pub treasury: UncheckedAccount<'info>,

  pub system_program: Program<'info,System>
}