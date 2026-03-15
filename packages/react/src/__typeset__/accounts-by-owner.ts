import type { Address } from "gill";
import { getTokenDecoder, TOKEN_2022_PROGRAM_ADDRESS } from "gill/programs";

import { useAccountsByOwner } from "../hooks/accounts-by-owner.js";

// [DESCRIBE] useAccountsByOwner
{
  const owner = null as unknown as Address;
  const programId = TOKEN_2022_PROGRAM_ADDRESS;

  // Basic usage without decoder
  {
    const { accounts, isLoading, refetch } = useAccountsByOwner({
      filter: {
        ownerOffset: 32n,
        programId,
      },
      owner,
    });

    // Should have the standard React Query properties
    isLoading satisfies boolean;
    refetch satisfies () => void;

    // Without decoder, accounts should be Uint8Array[]
    accounts satisfies Uint8Array[];
  }

  // With decoder
  {
    const { accounts } = useAccountsByOwner({
      decoder: getTokenDecoder(),
      filter: {
        dataSize: 165n,
        ownerOffset: 32n,
        programId,
      },
      owner,
    });

    // With decoder, accounts should be properly typed - verify fields exist
    if (accounts[0]) {
      accounts[0].mint satisfies unknown;
      accounts[0].owner satisfies unknown;
      accounts[0].amount satisfies unknown;
    }
  }

  // With additional memcmp filter
  {
    const { accounts } = useAccountsByOwner({
      decoder: getTokenDecoder(),
      filter: {
        dataSize: 165n,
        memcmp: {
          bytes: "base64data",
          encoding: "base64",
          offset: 64n,
        },
        ownerOffset: 32n,
        programId,
      },
      owner,
    });

    accounts satisfies unknown[];
  }

  // With config options
  {
    const { accounts } = useAccountsByOwner({
      config: {
        commitment: "finalized",
        minContextSlot: 100n,
      },
      decoder: getTokenDecoder(),
      filter: {
        ownerOffset: 32n,
        programId,
      },
      owner,
    });

    accounts satisfies unknown[];
  }

  // With options (TanStack Query options)
  {
    const { accounts } = useAccountsByOwner({
      decoder: getTokenDecoder(),
      filter: {
        ownerOffset: 32n,
        programId,
      },
      options: {
        enabled: false,
        refetchInterval: 1000,
        staleTime: 5000,
      },
      owner,
    });

    accounts satisfies unknown[];
  }

  // Should require owner
  {
    // @ts-expect-error - owner is required
    useAccountsByOwner({
      filter: {
        ownerOffset: 32n,
        programId,
      },
    });
  }

  // Should require filter
  {
    // @ts-expect-error - filter is required
    useAccountsByOwner({
      owner,
    });
  }

  // Should require programId in filter
  {
    useAccountsByOwner({
      // @ts-expect-error - programId is required in filter
      filter: {
        ownerOffset: 32n,
      },
      owner,
    });
  }

  // Should require ownerOffset in filter
  {
    useAccountsByOwner({
      // @ts-expect-error - ownerOffset is required in filter
      filter: {
        programId,
      },
      owner,
    });
  }
}
