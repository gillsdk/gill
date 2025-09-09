#[cfg(test)]
mod tests {
    use mollusk_svm::Mollusk;
    use solana_sdk::pubkey::Pubkey;

    const ID: Pubkey = solana_sdk::pubkey!("4ibrEMW5F6hKnkW4jVedswYv6H6VtwPN6ar6dvXDN1nT");
    const USER: Pubkey = Pubkey::new_from_array([0x01; 32]);

    #[test]
    fn test_make() {
        // mollusk instance
        let mollusk = Mollusk::new(&ID, "../../target/deploy/escrow");

        // PDA Pubkeys
        let mint_a;
        let mint_b;
        let maker_ata_a;
        let vault;
        let escrow;

        // Build the accoutns
        // inject data to accounts

        // Get the accounts metadata

        // Data

        // build Istruction (IX)

        // Get tx accounts

        // Process & validate instruction
    }
}
