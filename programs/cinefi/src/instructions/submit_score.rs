use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;
use crate::utils::*;

pub fn submit_score(ctx:Context<SubmitScore>, score: u8)->Result<()>{
  let clock=Clock::get()?;
  let now=clock.unix_timestamp;

  let market=&ctx.accounts.market;
  let oracle_report=&mut ctx.accounts.oracle_report;

  require!(market.closed,ErrorCode::MarketNotClosed);
  require!(!market.resolved,ErrorCode::MarketAlreadyResolved);
  require!(market.settle_at+ORACLE_WINDOWS_START_SECONDS<=now && now<=market.settle_at+ORACLE_WINDOWS_CLOSE_SECONDS, ErrorCode::SettlementTimeInvalid);
  require!(0<score && score<=100, ErrorCode::InvalidBucket);

  require!(
    is_valid_oracle(market,&ctx.accounts.oracle_signer.key()),
    ErrorCode::UnauthorizedOracle
  );
  require!(
    !has_already_submitted(oracle_report,&ctx.accounts.oracle_signer.key()),
    ErrorCode::OracleAlreadySubmitted
  );

  let idx=oracle_report.submission_count as usize;
  oracle_report.submissions[idx]=(ctx.accounts.oracle_signer.key(), score);
  oracle_report.submission_count+=1;

  let(finalized,disputed,agreed_score)=evaluate_report(oracle_report,market.oracle_threshold);

  oracle_report.finalized=finalized;
  oracle_report.disputed=disputed;

  if finalized {
    oracle_report.agreed_score=agreed_score;
  }

  Ok(())
}

#[derive(Accounts)]
pub struct SubmitScore<'info>{
  #[account(mut)]
  pub oracle_signer:Signer<'info>,

  #[account(
    seeds=[MARKET_SEED, &market.media_id.to_le_bytes()],
    bump=market.bump,
    constraint= market.closed
      @ErrorCode::MarketNotClosed,
    constraint= !market.resolved
      @ErrorCode::MarketAlreadyResolved,
    constraint= market.oracle_set.contains(oracle_signer.key)
      @ErrorCode::UnauthorizedOracle
  )]
  pub market:Account<'info,Market>,

  #[account(
    mut,
    seeds=[ORACLE_REPORT_SEED, market.key().as_ref()],
    bump=oracle_report.bump,
    constraint= !oracle_report.finalized
      @ErrorCode::OracleAlreadyFinalized,
    constraint= !oracle_report.disputed
      @ErrorCode::OracleDisputed
  )]
  pub oracle_report: Account<'info, OracleReport>,

  pub system_program: Program<'info, System>
}