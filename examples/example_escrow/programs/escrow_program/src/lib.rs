use anchor_lang::prelude::*;

mod state;
mod errors;
mod instructions;

use instructions::*;
declare_id!("HJ3Lezks1xLUWtAhKx4Skp7USyLgCFuLwe1d4uzs8CMq");

#[program]
pub mod escrow_program {
    use super::*;
    #[instruction(discriminator = 0)]
    pub fn make(ctx: Context<Make>, seed: u64, receive: u64, amount: u64) -> Result<()> {
        make::handler(ctx, seed, receive, amount)?;
        Ok(())
    }
    #[instruction(discriminator = 1)]
    pub fn take(ctx: Context<Take>) -> Result<()> {
        take::handler(ctx)?;
        Ok(())
    }

    #[instruction(discriminator = 2)]
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        refund::handler(ctx)?;
        Ok(())
    }
}
