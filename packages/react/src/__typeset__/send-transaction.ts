import { useSendTransaction } from "../hooks/send-transaction";
import { Base64EncodedWireTransaction, SendTransactionApi} from "gill";

// [DESCRIBE] useSendTransaction
{
  const signature = null as unknown as Base64EncodedWireTransaction | string;
  {
    const transaction = useSendTransaction({ signature });
    transaction.signature satisfies ReturnType<SendTransactionApi["sendTransaction"]>;
    // @ts-expect-error - Should not allow no argument
    useSendTransaction();

    // @ts-expect-error - Should not allow empty argument object
    useSendTransaction({});
  }

  {
    // Should accept `config` input
    const transaction = useSendTransaction({
      config: {
        encoding: "base64",
        preflightCommitment: "confirmed",
        skipPreflight: false,
      },
      signature,
    });
    transaction.signature satisfies ReturnType<SendTransactionApi["sendTransaction"]>;
  }

  {
    // Should require `signature` input
    const transaction = useSendTransaction({
      signature: "5Pj5fCupXLUePYn18JkY8SrRaWFiUctuDTRwvUy2ML9yvkENLb1QMYbcBGcBXRrSVDjp7RjUwk9a3rLC6gpvtYpZ",
    });

    transaction.signature satisfies ReturnType<SendTransactionApi["sendTransaction"]>;
  }
}
