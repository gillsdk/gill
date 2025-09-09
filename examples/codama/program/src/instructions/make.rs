use bytemuck::{Pod, Zeroable};
use core::f64::consts::E;
use shank::ShankAccount;

use crate::state::Escrow;
use pinocchio::{
    account_info::AccountInfo,
    instruction::Seed,
    instruction::Signer,
    program_error::ProgramError,
    pubkey, seeds,
    sysvars::{rent::Rent, Sysvar},
    ProgramResult,
};

#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable, ShankAccount)]
pub struct MakeArgs {
    amount: [u8; 8],
    receive: [u8; 8],
    seed: [u8; 8],
    bump: u8,
}

impl MakeArgs {
    fn seed(&self) -> u64 {
        u64::from_le_bytes(self.seed)
    }

    fn amount(&self) -> u64 {
        u64::from_le_bytes(self.amount)
    }

    fn receive(&self) -> u64 {
        u64::from_le_bytes(self.receive)
    }
}

impl TryFrom<&[u8]> for MakeArgs {
    type Error = pinocchio::program_error::ProgramError;

    fn try_from(bytes: &[u8]) -> Result<Self, Self::Error> {
        bytemuck::try_from_bytes::<Self>(bytes)
            .map(|reference| *reference)
            .map_err(|_| ProgramError::InvalidInstructionData)
    }
}

pub trait MakeContext<'a> {
    fn make(&self, args: &MakeArgs) -> ProgramResult;
}

impl<'a> MakeContext<'a> for &[AccountInfo] {
    fn make(&self, args: &MakeArgs) -> ProgramResult {
        let [maker, mint_a, maker_ata_a, mint_b, vault, escrow, _system_program, _token_program] =
            self
        else {
            return Err(ProgramError::NotEnoughAccountKeys);
        };

        assert!(maker.is_signer());

        let escrow_seeds_with_bump = &[b"escrow", maker.key().as_ref(), &args.seed, &[args.bump]];
        let escrow_derived = pubkey::create_program_address(escrow_seeds_with_bump, &crate::ID)?;

        assert!(escrow_derived == escrow.key().as_ref());

        let bump_ref = &[args.bump];

        let signer_seeds = seeds!(b"escrow", maker.key().as_ref(), &args.seed, bump_ref);

        let signer = Signer::from(&signer_seeds);

        pinocchio_system::instructions::CreateAccount {
            from: maker,
            to: escrow,
            space: Escrow::LEN as u64,
            owner: &crate::ID,
            lamports: Rent::get()?.minimum_balance(Escrow::LEN),
        }
        .invoke_signed(&[signer])?;

        let mut escrow_data =
            *bytemuck::try_from_bytes_mut::<Escrow>(&mut escrow.try_borrow_mut_data()?)
                .map_err(|_| ProgramError::InvalidAccountData)?;

        escrow_data.set_inner(Escrow {
            seed: args.seed,
            maker: *maker.key(),
            mint_a: *mint_a.key(),
            mint_b: *mint_b.key(),
            amount: args.amount,
            receive: args.receive,
            bump: args.bump,
        });

        pinocchio_token::instructions::Transfer {
            from: maker_ata_a,
            to: vault,
            authority: maker,
            amount: args.amount(),
        }
        .invoke()?;
        Ok(())
    }
}
