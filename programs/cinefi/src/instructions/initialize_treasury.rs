use anchor_lang::prelude::*;
use crate::states::*;

#[derive(Accounts)]
pub struct InitializeTreasury<'info>{
  #[account(mut)]
  pub authority: Signer<'info>,

  #[account(
    init,
    payer=authority,
    space=0,
    seeds=[TREASURY_SEED],
    bump
  )]
  pub treasury: UncheckedAccount<'info>,

  pub system_program: Program<'info, System>,
}