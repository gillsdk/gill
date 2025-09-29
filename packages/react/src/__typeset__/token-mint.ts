import type { Account, Address } from "gill";

import type { Mint } from "gill/programs";
import { useTokenMint } from "../hooks/token-mint.js";

// [DESCRIBE] useTokenMint
{
  const mint = null as unknown as Address<"mint1234">;

  // Should use default account data type
  {
    const { account } = useTokenMint({ mint });
    // Should have `exists=true` declared
    account satisfies { exists: true };
    // Should be a parsed `Mint` for the data
    account satisfies Account<Mint>;
    // Should use the address type
    account.address satisfies Address<"mint1234">;

    // @ts-expect-error - Should not allow no argument
    useTokenMint();

    // @ts-expect-error - Should not allow empty argument object
    useTokenMint({});
  }

  // Should accept `config` input
  {
    const { account } = useTokenMint({
      mint,
      config: { commitment: "confirmed" },
    });
    // Should have `exists=true` declared
    account satisfies { exists: true };
    // Should be a parsed `Mint` for the data
    account satisfies Account<Mint>;
  }
}
