use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, InitSpace)]
pub struct OracleSubmission {
  pub signer: Pubkey,
  pub score: u8,
}

#[account]
#[derive(InitSpace)]
pub struct OracleReport{
  pub market: Pubkey,

  pub submissions: [OracleSubmission; 3],
  pub submission_count: u8,

  pub agreed_score: u8,
  pub finalized: bool,
  pub disputed: bool,

  pub bump: u8,
}