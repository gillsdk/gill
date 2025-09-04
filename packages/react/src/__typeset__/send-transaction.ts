import { useSendTransaction } from "../hooks";
import { Base64EncodedWireTransaction, SendTransactionApi} from "gill";

// [DESCRIBE] useSendTransaction
{
  const transaction = null as unknown as Base64EncodedWireTransaction | string;
  {
    const signature = useSendTransaction({ transaction });
    signature.transaction satisfies ReturnType<SendTransactionApi["sendTransaction"]>;
    // @ts-expect-error - Should not allow no argument
    useSendTransaction();

    // @ts-expect-error - Should not allow empty argument object
    useSendTransaction({});
  }

  {
    // Should accept `config` input
    const signature = useSendTransaction({
      config: {
        encoding: "base64",
        preflightCommitment: "confirmed",
        skipPreflight: false,
      },
      transaction,
    });
    signature.transaction satisfies ReturnType<SendTransactionApi["sendTransaction"]>;
  }

  {
    // Should require `signature` input
    const signature = useSendTransaction({
      transaction: "5Pj5fCupXLUePYn18JkY8SrRaWFiUctuDTRwvUy2ML9yvkENLb1QMYbcBGcBXRrSVDjp7RjUwk9a3rLC6gpvtYpZ",
    });

    signature.transaction satisfies ReturnType<SendTransactionApi["sendTransaction"]>;
  }
}
