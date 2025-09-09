use pinocchio::program_error::ProgramError;
use shank::ShankInstruction;

#[repr(u8)]
#[derive(ShankInstruction)]
pub enum EscrowInstruction {
    Make,
    Take,
    Refund,
}

impl TryFrom<&u8> for EscrowInstruction {
    type Error = ProgramError;

    fn try_from(value: &u8) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(Self::Make),
            1 => Ok(Self::Take),
            2 => Ok(Self::Refund),
            _ => Err(ProgramError::InvalidInstructionData),
        }
    }
}
