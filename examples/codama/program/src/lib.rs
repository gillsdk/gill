#![allow(unexpected_cfgs)]
#![no_std] // exclude std lib to shrink the *.so size
use pinocchio::{
    account_info::AccountInfo, entrypoint, program_error::ProgramError, pubkey::Pubkey,
    ProgramResult,
};

mod instructions;
mod state;

use instructions::{
    instructions::EscrowInstruction, make::MakeContext, refund::RefundContext, take::TakeContext,
};

entrypoint!(app);

// #[cfg(target_os = "solana")]
// pinocchio::nostd_panic_handler!(); // because no_std

// we generate on deployment and update it later manually?
pinocchio_pubkey::declare_id!("4ibrEMW5F6hKnkW4jVedswYv6H6VtwPN6ar6dvXDN1nT");

pub fn app(_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
    let (instruction, data) = instruction_data
        .split_first()
        .ok_or(ProgramError::InvalidInstructionData)?;

    match EscrowInstruction::try_from(instruction)? {
        EscrowInstruction::Make => accounts.make(&data.try_into()?),
        EscrowInstruction::Take => accounts.take(),
        EscrowInstruction::Refund => accounts.refund(),
        //_ => Err(ProgramError::InvalidInstructionData),
    }
}
