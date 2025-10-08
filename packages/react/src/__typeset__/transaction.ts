import { GetTransactionApi, Signature } from "gill";

import { useTransaction } from "../hooks/transaction.js";

// [DESCRIBE] useTransaction
{
  const signature = null as unknown as Signature;

  {
    const { transaction } = useTransaction({ signature });
    transaction satisfies ReturnType<GetTransactionApi["getTransaction"]>;

    // @ts-expect-error - Should not allow no argument
    useTransaction();

    // @ts-expect-error - Should not allow empty argument object
    useTransaction({});
  }

  {
    // Should accept `config` input
    const { transaction } = useTransaction({
      config: {
        commitment: "confirmed",
        encoding: "json",
        maxSupportedTransactionVersion: 0,
      },
      signature,
    });
    transaction satisfies ReturnType<GetTransactionApi["getTransaction"]>;
  }

  {
    // Should accept a plain `string` as the `signature`
    const { transaction } = useTransaction({
      signature: "5Pj5fCupXLUePYn18JkY8SrRaWFiUctuDTRwvUy2ML9yvkENLb1QMYbcBGcBXRrSVDjp7RjUwk9a3rLC6gpvtYpZ",
    });
    transaction satisfies ReturnType<GetTransactionApi["getTransaction"]>;
  }
}
