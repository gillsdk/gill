import { Account, Address } from "gill";

import { Token } from "gill/programs";
import { useTokenAccount } from "../hooks/token-account.js";

// [DESCRIBE] useTokenAccount
{
  const mint = null as unknown as Address<"mint">;
  const owner = null as unknown as Address<"owner">;
  const ata = null as unknown as Address<"ata">;

  // Should accept `mint` and `owner`
  {
    const { account } = useTokenAccount({ mint, owner });
    // Should have `exists=true` declared
    account satisfies { exists: true };
    // Should be a Token for the data
    account satisfies Account<Token>;

    // @ts-expect-error - Should not allow no argument
    useTokenAccount();

    // @ts-expect-error - Should not allow empty argument object
    useTokenAccount({});
  }

  // Should accept `ata` input
  {
    const { account } = useTokenAccount({ ata });
    // Should have `exists=true` declared
    account satisfies { exists: true };
    // Should be a Token for the data
    account satisfies Account<Token>;
    // Should use the address type
    account.address satisfies Address<"ata">;
  }

  // Should accept `config` input with `ata`
  {
    const { account } = useTokenAccount({
      ata,
      config: { commitment: "confirmed" },
    });
    // Should have `exists=true` declared
    account satisfies { exists: true };
    // Should be a parsed `Token` for the data
    account satisfies Account<Token>;
  }

  // Should accept `config` input with `mint` and `owner`
  {
    const { account } = useTokenAccount({
      mint,
      owner,
      config: { commitment: "confirmed" },
    });
    // Should have `exists=true` declared
    account satisfies { exists: true };
    // Should be a parsed `Token` for the data
    account satisfies Account<Token>;
  }
}
