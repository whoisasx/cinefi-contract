use anchor_lang::prelude::*;
use crate::states::*;

pub fn create_market(
  ctx: Context<CreateMarket>,
  media_id: u64,
  radius: u8,
  oracle_set: [Pubkey; 3],
  oracle_threshold: u8,
)->Result<()>{
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