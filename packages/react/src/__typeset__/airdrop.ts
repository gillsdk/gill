import { Address, Signature, type Lamports } from "gill";
import { useAirdrop } from "../hooks/airdrop.js";

// [DESCRIBE] useAirdrop
{
  const address = null as unknown as Address;

  {
    const { mutate, mutateAsync, data } = useAirdrop();

    // Should allow calling mutate with address and lamports
    const oneSol = 1_000_000_000n as Lamports;
    mutate({ address, lamports: oneSol });
    // @ts-expect-error - number is not Lamports
    mutate({ address, lamports: 1000000000 });

    // Should return signature in data when successful
    data satisfies { signature: Signature } | undefined;

    // Should allow calling mutateAsync
    mutateAsync({ address, lamports: oneSol });
  }

  {
    const { mutate } = useAirdrop({
      config: { commitment: "confirmed" },
    });

    // Should work with config
    const oneSol = 1_000_000_000n as Lamports;
    mutate({ address, lamports: oneSol });
  }

  {
    const abortController = new AbortController();
    const { mutate } = useAirdrop({
      abortSignal: abortController.signal,
    });

    // Should work with abort signal
    const oneSol = 1_000_000_000n as Lamports;
    mutate({ address, lamports: oneSol });
  }

  {
    const { mutate } = useAirdrop();

    // @ts-expect-error - Should require address
    mutate({ lamports: 1_000_000_000n });

    // @ts-expect-error - Should require lamports
    mutate({ address });

    // @ts-expect-error - Should not allow empty object
    mutate({});
  }
}
