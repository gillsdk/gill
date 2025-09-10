use pinocchio::{
    account_info::AccountInfo, instruction::Signer, program_error::ProgramError, pubkey, seeds,
    ProgramResult,
};

use crate::state::Escrow;

pub trait RefundContext<'a> {
    fn refund(&self) -> ProgramResult;
}

impl<'a> RefundContext<'a> for &[AccountInfo] {
    fn refund(&self) -> ProgramResult {
        let [maker, mint_a, mint_b, maker_ata_a, vault, escrow, _system_program, _token_program] =
            self
        else {
            return Err(ProgramError::NotEnoughAccountKeys);
        };

        let escrow_data = *bytemuck::try_from_bytes::<Escrow>(&escrow.try_borrow_data()?)
            .map_err(|_| ProgramError::InvalidAccountData)?;

        assert!(maker.is_signer());
        assert!(escrow.is_owned_by(&crate::ID));
        assert!(&escrow_data.maker == maker.key());
        assert!(&escrow_data.mint_a == mint_a.key());
        assert!(&escrow_data.mint_b == mint_b.key());

        let escrow_seeds = &[b"escrow", maker.key().as_ref(), &escrow_data.seed];
        let (esrow_derived, escrow_bump) =
            pubkey::try_find_program_address(escrow_seeds, &crate::ID)
            .ok_or(ProgramError::InvalidSeeds)?;


        assert!(esrow_derived == escrow.key().as_ref());

        let bump_ref = &[escrow_bump];

        let signer_seeds = seeds!(b"escrow", maker.key().as_ref(), &escrow_data.seed, bump_ref);
        let signer = Signer::from(&signer_seeds);
        let signer1 = Signer::from(&signer_seeds);

        pinocchio_token::instructions::Transfer {
            from: vault,
            to: maker_ata_a,
            authority: escrow,
            amount: u64::from_be_bytes(escrow_data.amount),
        }
        .invoke_signed(&[signer])?;

        pinocchio_token::instructions::CloseAccount {
            account: vault,
            destination: maker,
            authority: escrow,
        }
        .invoke_signed(&[signer1]);

        *maker.try_borrow_mut_lamports()? = maker
            .lamports()
            .checked_add(escrow.lamports())
            .ok_or(ProgramError::ArithmeticOverflow)?;
        *escrow.try_borrow_mut_lamports()? = 0;
        Ok(())
    }
}
