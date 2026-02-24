use anchor_lang::prelude::*;
use anchor_lang::system_program::{Transfer, transfer};
use crate::states::*;
use crate::errors::ErrorCode;
use crate::utils::*;

pub fn resolve_market(ctx:Context<ResolveMarket>)->Result<()>{
  let market=&mut ctx.accounts.market;
  let oracle_report=&ctx.accounts.oracle_report;

  require!(market.closed, ErrorCode::MarketNotClosed);
  require!(!market.resolved, ErrorCode::MarketAlreadyResolved);
  require!(oracle_report.finalized, ErrorCode::OracleNotFinalized);
  require!(!oracle_report.disputed, ErrorCode::OracleDisputed);

  let final_outcome=oracle_report.agreed_score;

  let fee=(market.total_pool as u128).checked_mul(DEFAULT_PROTOCOL_FEE_BPS as u128).ok_or(ErrorCode::MathOverflow)?/10_000u128;
  let fee= fee as u64;

  let total_prize_pool=market.total_pool.checked_sub(fee).ok_or(ErrorCode::MathOverflow)?;

  if fee > 0 {
    let vault_bump = ctx.bumps.vault;
    let market_key = market.key();

    let market_key_bytes = market_key.as_ref();
    let bump_seed = &[vault_bump];
    let vault_seeds: &[&[u8]] = &[VAULT_SEED, market_key_bytes, bump_seed];

    let signer_seeds: &[&[&[u8]]] = &[vault_seeds];

    transfer(
      CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        Transfer{
          from:ctx.accounts.vault.to_account_info(),
          to:ctx.accounts.treasury.to_account_info()
        },
        signer_seeds
      ),
      fee
    )?;
  }

  let (bucket_prizes, fallback_used)=compute_bucket_prizes(&market.weighted_pool,final_outcome,market.radius,total_prize_pool);

  market.bucket_prize=bucket_prizes;
  market.final_outcome=final_outcome;
  market.total_prize_pool=total_prize_pool;
  market.fallback_used=fallback_used;
  market.resolved=true;

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