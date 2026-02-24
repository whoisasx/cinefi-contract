use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Market{
  pub media_id: u64,
  pub creator: Pubkey,

  pub created_at: i64,
  pub betting_starts_at: i64,
  pub betting_closes_at: i64,
  pub settle_at: i64,
  pub claim_deadline: i64,

  pub radius: u8,
  pub protocol_fee_bps: u16,
  pub creator_fee_bps: u16,   //protocol_fee_basis_points: (1%->100, 2%->200)

  pub oracle_set: [Pubkey; 3],
  pub oracle_threshold: u8,

  pub pool: [u64; 101],
  pub weighted_pool: [u64; 101],
  pub total_pool: u64,
  pub total_prize_pool: u64,

  pub final_outcome: u8,
  pub bucket_price: [u64; 101],
  pub fallback_used: bool,

  pub resolved: bool,
  pub closed: bool,
  pub reclaimed: bool,

  pub bump: u8,
}


// pool: u64 or u128,
// protocol_fee_bps, bps? 
