import { Address, GetBalanceApi } from "gill";
import { useBalance } from "../hooks/balance.js";

// [DESCRIBE] useBalance
{
  const address = null as unknown as Address;

  {
    const { balance } = useBalance({ address });
    balance satisfies ReturnType<GetBalanceApi["getBalance"]>["value"];

    // @ts-expect-error - Should not allow no argument
    useBalance();

    // @ts-expect-error - Should not allow empty argument object
    useBalance({});
  }

  {
    const { balance } = useBalance({
      address,
      config: { commitment: "confirmed" },
    });
    balance satisfies ReturnType<GetBalanceApi["getBalance"]>["value"];
  }
}
