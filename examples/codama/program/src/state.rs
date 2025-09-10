use bytemuck::{Pod, Zeroable};
use pinocchio::pubkey::Pubkey;

#[repr(C)] // C ABI compatibile memory mapping
#[derive(Copy, Clone, Pod, Zeroable)] //
pub struct Escrow {
    pub maker: Pubkey, // creator which initializes the deal

    // escrow is conditional transfer,
    // so we consider we will have two types of tokens (ie SOL/USDC)
    pub mint_a: Pubkey, // mint for token 1
    pub mint_b: Pubkey, // mint for token 2

    // [u8;8] - is another way to represent u64 + ensuring fixed size
    pub amount: [u8; 8],  // amount to deposit
    pub receive: [u8; 8], // amount to receive

    pub seed: [u8; 8], // we need predictable generation of PDA, seeds help with it
    pub bump: u8,      // bump
}

impl Escrow {
    pub const LEN: usize = core::mem::size_of::<Escrow>();

    pub fn set_inner(&mut self, new_self: Self) {
        self.maker = new_self.maker;
        self.mint_a = new_self.mint_a;
        self.mint_b = new_self.mint_b;

        self.amount = new_self.amount;
        self.receive = new_self.receive;

        self.seed = new_self.seed;
        self.bump = new_self.bump
    }
}
