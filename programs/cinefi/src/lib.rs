use anchor_lang::prelude::*;

pub mod instructions;
pub mod states;
pub mod errors;
pub mod utils;

use instructions::*;

declare_id!("GomtSs5546sx4NQFsGaJtwFrDytfqRQPBADkiUr7PcyW");

#[program]
pub mod cinefi {
  use super::*;

  pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
    instructions::initialize_treasury::initialize_treasury(ctx)
  }

  pub fn create_market(
    ctx: Context<CreateMarket>,
    betting_starts_after: Option<i64>,
    media_id: u64,
    radius: u8,
    oracle_set: [Pubkey; 3],
    oracle_threshold: u8,
  ) -> Result<()> {
    instructions::create_market::create_market(ctx, betting_starts_after, media_id, radius, oracle_set, oracle_threshold)
  }

  pub fn place_bet(ctx: Context<PlaceBet>, bucket: u8, amount: u64) -> Result<()> {
    instructions::place_bet::place_bet(ctx, bucket, amount)
  }

  pub fn close_market(ctx: Context<CloseMarket>) -> Result<()> {
    instructions::close_market::close_market(ctx)
  }

  pub fn submit_score(ctx: Context<SubmitScore>, score: u8) -> Result<()> {
    instructions::submit_score::submit_score(ctx, score)
  }

  pub fn resolve_market(ctx: Context<ResolveMarket>) -> Result<()> {
    instructions::resolve_market::resolve_market(ctx)
  }

  pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
    instructions::claim_reward::claim_reward(ctx)
  }

  pub fn reclaim_pool(ctx: Context<ReclaimPool>) -> Result<()> {
    instructions::reclaim_pool::reclaim_pool(ctx)
  }
}
