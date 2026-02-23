use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserPosition{
  pub user: Pubkey,
  pub market: Pubkey,

  pub bucket: u8,
  pub amount: u64,
  pub weighted_amount: u64,

  pub bet_timestamp: u64,
  pub day_index: u8,

  pub claimed: bool,

  pub bump: u8
}