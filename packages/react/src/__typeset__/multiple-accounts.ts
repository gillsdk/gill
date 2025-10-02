import { Account, Address } from "gill";
import { getMetadataDecoder, Metadata } from "gill/programs";

import { useMultipleAccounts } from "../hooks/multiple-accounts.js";

// [DESCRIBE] useMultipleAccounts
{
  const addresses = [null] as unknown as [Address<"12345">];

  // Should use default account data type
  {
    const { accounts } = useMultipleAccounts({ addresses });

    // Should be a Uint8Array for the data
    accounts satisfies Account<Uint8Array>[];

    // @ts-expect-error - Should not allow no argument
    useMultipleAccounts();

    // @ts-expect-error - Should not allow empty argument object
    useMultipleAccounts({});
  }

  // Should accept `config` input
  {
    const { accounts } = useMultipleAccounts({
      addresses,
      config: { commitment: "confirmed" },
    });
    accounts satisfies Account<Uint8Array>[];
  }

  // Should use the decoder type
  {
    const { accounts } = useMultipleAccounts({
      addresses,
      decoder: getMetadataDecoder(),
    });
    // Should be a `Metadata` type for the data
    accounts satisfies Account<Metadata>[];
  }
}
