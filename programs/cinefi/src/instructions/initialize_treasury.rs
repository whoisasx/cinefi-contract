use anchor_lang::prelude::*;
use crate::states::*;

pub fn initialize_treasury(_ctx:Context<InitializeTreasury>)->Result<()>{
  Ok(())
}
#[derive(Accounts)]
pub struct InitializeTreasury<'info>{
  #[account(mut)]
  pub authority: Signer<'info>,

  /// CHECK: This is a PDA vault derived from TREASURY_SEED. It holds lamports and is validated by its seeds and bump.
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