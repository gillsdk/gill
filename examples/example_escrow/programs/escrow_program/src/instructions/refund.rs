use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{ Mint, TokenAccount, TokenInterface,close_account,CloseAccount ,TransferChecked,transfer_checked},
};

use crate::{ errors::EscrowError, state::Escrow };
#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        mut,
        close=maker,
        seeds=[b"escrow",maker.key().as_ref(),escrow.seed.to_le_bytes().as_ref()],
        bump=escrow.bump,
        has_one=maker @ EscrowError::InvalidMaker,
        has_one=mint_a @EscrowError::InvalidMintA
    )]
    pub escrow: Account<'info, Escrow>,
    // Token accounts
    pub mint_a: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint=mint_a,
        associated_token::authority=escrow,
        associated_token::token_program=token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = maker,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,

    // Program
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Refund<'info> {
    fn withdraw_close_vault(&mut self) -> Result<()> {
        // [b"escrow",maker.key().as_ref(),escrow.seed.to_le_bytes().as_ref()]
        let signer_seeds: [&[&[u8]]; 1] = [
            &[
                b"escrow",
                self.maker.to_account_info().key.as_ref(),
                &self.escrow.seed.to_le_bytes(),
                &[self.escrow.bump],
            ],
        ];
        transfer_checked(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                TransferChecked {
                    from: self.vault.to_account_info(),
                    to: self.maker_ata_a.to_account_info(),
                    mint: self.mint_a.to_account_info(),
                    authority: self.escrow.to_account_info(),
                },
                &signer_seeds
            ),
            self.vault.amount,
            self.mint_a.decimals
        )?;

        // Close the Vault
        close_account(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                CloseAccount {
                    account: self.vault.to_account_info(),
                    authority: self.escrow.to_account_info(),
                    destination: self.maker.to_account_info(),
                },
                &signer_seeds
            )
        )?;

        Ok(())
    }
}

pub fn handler(ctx: Context<Refund>) -> Result<()> {
    // Withdraw and close the Vault (Vault -> Maker)
    ctx.accounts.withdraw_close_vault()?;
 
    Ok(())
}