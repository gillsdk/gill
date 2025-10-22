import { useSendTransaction } from "../hooks";
import { Base64EncodedWireTransaction, SendTransactionApi} from "gill";

// [DESCRIBE] useSendTransaction
{
  {
    const { sendTransaction } = useSendTransaction({
      config: {
        encoding: "base64",
        preflightCommitment: "confirmed",
        skipPreflight: false,
      },
    });
    sendTransaction satisfies (tx: Base64EncodedWireTransaction | string) => Promise<ReturnType<SendTransactionApi["sendTransaction"]>>;
    // @ts-expect-error - Should not allow no argument
    useSendTransaction();
  }

  // Should accept `config` input
  {
    const { sendTransaction } = useSendTransaction({
      config: {
        encoding: "base64",
        preflightCommitment: "confirmed",
        skipPreflight: false,
      },
    });
    sendTransaction satisfies (tx: Base64EncodedWireTransaction | string) => Promise<ReturnType<SendTransactionApi["sendTransaction"]>>;
  }
}
