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
  pub market: Account<'info ,Market>,

  /// CHECK: This is a PDA vault derived from VAULT_SEED and the market key. It holds lamports and is validated by its seeds and bump.
  #[account(
    mut,
    seeds=[VAULT_SEED, market.key().as_ref()],
    bump
  )]
  pub vault: UncheckedAccount<'info>,

  /// CHECK: This is a PDA vault derived from TREASURY_SEED. It holds lamports and is validated by its seeds and bump.
  #[account(
    mut,
    seeds=[TREASURY_SEED],
    bump
  )]
  pub treasury: UncheckedAccount<'info>,

  pub system_program: Program<'info,System>
}