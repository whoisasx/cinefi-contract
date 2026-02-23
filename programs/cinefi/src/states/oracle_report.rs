use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct OracleReport{
  pub market: Pubkey,

  pub submissions: [(Pubkey,u8);3],
  pub submission_count: u8,

  pub agreed_score: u8,
  pub finalized: bool,
  pub disputed: bool,

  pub bump: u8,
}