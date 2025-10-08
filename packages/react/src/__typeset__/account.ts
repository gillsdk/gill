import { Account, Address } from "gill";
import { getMetadataDecoder, Metadata } from "gill/programs";

import { useAccount } from "../hooks/account.js";

// [DESCRIBE] useAccount
{
  const address = null as unknown as Address<"12345">;

  // Should use default account data type
  {
    const { account } = useAccount({ address });
    // Should have `exists=true` declared
    account satisfies { exists: true };
    // Should be a Uint8Array for the data
    account satisfies Account<Uint8Array>;
    // Should use the address type
    account.address satisfies Address<"12345">;

    // @ts-expect-error - Should not allow no argument
    useAccount();

    // @ts-expect-error - Should not allow empty argument object
    useAccount({});
  }

  // Should accept `config` input
  {
    const { account } = useAccount({
      address,
      config: { commitment: "confirmed" },
    });
    // Should have `exists=true` declared
    account satisfies { exists: true };
    // Should be a Uint8Array for the data
    account satisfies Account<Uint8Array>;
  }

  // Should use the decoder type
  {
    const { account } = useAccount({
      address,
      decoder: getMetadataDecoder(),
    });
    // Should be a `Metadata` type for the data
    account satisfies Account<Metadata>;
  }
}
