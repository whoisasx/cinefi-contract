use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;

pub fn create_market(
  ctx: Context<CreateMarket>,
  betting_starts_after: Option<i64>, 
  media_id: u64,
  radius: u8,
  oracle_set: [Pubkey; 3],
  oracle_threshold: u8,
)->Result<()>{
  let clock=Clock::get()?;
  let now=clock.unix_timestamp;

  require!(oracle_threshold > 1 && oracle_threshold <= 3, ErrorCode::InvalidOracleThreshold);

  let buffer_time= match betting_starts_after{
    Some(t)=>t,
    None=>0
  };

  let market=&mut ctx.accounts.market;
  market.media_id=media_id;
  market.creator= ctx.accounts.creator.key();

  market.created_at=now;
  market.betting_starts_at= now+buffer_time;
  market.betting_closes_at= market.betting_starts_at + (BETTING_DURATION_DAYS*SECONDS_PER_DAY);
  market.settle_at= market.betting_closes_at + ((SETTLEMENT_DAY-BETTING_DURATION_DAYS)*SECONDS_PER_DAY);
  market.claim_deadline= market.settle_at +(CLAIM_WINDOW_DAYS*SECONDS_PER_DAY);

  market.radius=radius;
  market.protocol_fee_bps=DEFAULT_PROTOCOL_FEE_BPS;
  market.creator_fee_bps=0;

  market.oracle_set=oracle_set;
  market.oracle_threshold=oracle_threshold;

  market.total_pool=0;
  market.total_prize_pool=0;

  market.final_outcome=0;
  market.fallback_used=false;

  market.resolved=false;
  market.closed=false;
  market.reclaimed=false;

  market.bump=ctx.bumps.market;


  let oracle_report=&mut ctx.accounts.oracle_report;
  oracle_report.market=market.key();
  oracle_report.submission_count=0;
  oracle_report.agreed_score=0;
  oracle_report.finalized=false;
  oracle_report.disputed=false;
  oracle_report.bump=ctx.bumps.oracle_report;

  Ok(())
}


#[derive(Accounts)]
#[instruction(media_id: u64)]
pub struct CreateMarket<'info>{
  #[account(mut)]
  pub creator: Signer<'info>,

  #[account(
    init,
    payer=creator,
    space=8+Market::INIT_SPACE,
    seeds=[MARKET_SEED, &media_id.to_le_bytes()],
    bump
  )]
  pub market: Account<'info, Market>,

  #[account(
    init,
    payer=creator,
    space=8,
    seeds=[VAULT_SEED, market.key().as_ref()],
    bump
  )]
  pub vault: UncheckedAccount<'info>,

  #[account(
    init,
    payer=creator,
    space=8+OracleReport::INIT_SPACE,
    seeds=[ORACLE_REPORT_SEED, market.key().as_ref()],
    bump
  )]
  pub oracle_report: Account<'info, OracleReport>,

  pub system_program: Program<'info, System>
}