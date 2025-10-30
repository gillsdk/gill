import { type Address, getAddressEncoder, getProgramDerivedAddress,type KeyPairSigner } from "@solana/kit";

import { checkedAddress } from "../../core/utils";
import { TOKEN_METADATA_PROGRAM_ADDRESS } from "./generated";

/**
 * Derive the Token Metadata address from a token's mint address
 *
 * @param `mint` - `Address` or `KeyPairSigner` of the token mint
 */
export async function getTokenMetadataAddress(mint: Address | KeyPairSigner): Promise<Address> {
  return (
    await getProgramDerivedAddress({
      programAddress: TOKEN_METADATA_PROGRAM_ADDRESS,
      seeds: [
        Buffer.from("metadata"),
        getAddressEncoder().encode(TOKEN_METADATA_PROGRAM_ADDRESS),
        getAddressEncoder().encode(checkedAddress(mint)),
      ],
    })
  )[0];
}
