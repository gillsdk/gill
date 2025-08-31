import {
  AccountInfoWithBase64EncodedData,
  AccountInfoWithBase64EncodedZStdCompressedData,
  AccountInfoWithJsonData,
  Address,
  Base58EncodedBytes,
  Base64EncodedBytes,
  SolanaRpcResponse,
} from "gill";
import { useProgramAccounts } from "../hooks/program-accounts";

// [DESCRIBE] useProgramAccounts
{
  const program = null as unknown as Address;

  // default encoded data as bytes
  {
    const { accounts: baseConfigAccounts } = useProgramAccounts({ program });
    baseConfigAccounts[0].account.data satisfies Base64EncodedBytes;

    const { accounts: baseConfigAccounts2 } = useProgramAccounts({
      program,
      config: {
        commitment: "finalized",
      },
    });
    baseConfigAccounts2[0].account.data satisfies Base64EncodedBytes;

    const { accounts: baseConfigContextAccounts } = useProgramAccounts({
      program,
      config: {
        withContext: true,
      },
    });

    // Should include context in response
    baseConfigContextAccounts satisfies SolanaRpcResponse<any>;
    baseConfigContextAccounts.value[0].account.data satisfies Base64EncodedBytes;
  }

  // base64 encoded `data`
  {
    const { accounts: base64Accounts } = useProgramAccounts({
      program,
      config: {
        commitment: "finalized",
        encoding: "base64",
      },
    });
    base64Accounts[0].account satisfies AccountInfoWithBase64EncodedData;
    // @ts-expect-error Should not be base58 encoded bytes
    base64Accounts[0].account.data satisfies Base58EncodedBytes;

    const { accounts: base64ContextAccounts } = useProgramAccounts({
      program,
      config: {
        commitment: "finalized",
        encoding: "base64",
        withContext: true,
      },
    });

    // Should include context in response
    base64ContextAccounts satisfies SolanaRpcResponse<any>;
    base64ContextAccounts.value[0].account satisfies AccountInfoWithBase64EncodedData;

    // @ts-expect-error Should not be base58 encoded bytes
    base64ContextAccounts.value[0].account.data satisfies Base58EncodedBytes;
  }

  // base64+zstd encoded `data`
  {
    const { accounts: base64ZstdAccounts } = useProgramAccounts({
      program,
      config: {
        commitment: "finalized",
        encoding: "base64+zstd",
      },
    });
    base64ZstdAccounts[0].account satisfies AccountInfoWithBase64EncodedZStdCompressedData;
    // @ts-expect-error Should not be base58 encoded bytes
    base64ZstdAccounts[0].account.data satisfies Base58EncodedBytes;

    const { accounts: base64ZstdContextAccounts } = useProgramAccounts({
      program,
      config: {
        commitment: "finalized",
        encoding: "base64+zstd",
        withContext: true,
      },
    });

    // Should include context in response
    base64ZstdContextAccounts satisfies SolanaRpcResponse<any>;
    base64ZstdContextAccounts.value[0].account satisfies AccountInfoWithBase64EncodedZStdCompressedData;

    // @ts-expect-error Should not be base58 encoded bytes
    base64ZstdContextAccounts.value[0].account.data satisfies Base58EncodedBytes;
  }

  // json parsed encoded `data`
  {
    const { accounts: jsonParsedAccounts } = useProgramAccounts({
      program,
      config: {
        commitment: "finalized",
        encoding: "jsonParsed",
      },
    });

    jsonParsedAccounts[0].account satisfies AccountInfoWithBase64EncodedData | AccountInfoWithJsonData;
    // @ts-expect-error Should not be base58 encoded bytes
    jsonParsedAccounts[0].account.data satisfies Base58EncodedBytes;

    const { accounts: jsonParsedContextAccounts } = useProgramAccounts({
      program,
      config: {
        commitment: "finalized",
        encoding: "jsonParsed",
        withContext: true,
      },
    });
    jsonParsedContextAccounts.value[0].account.data;

    // Should include context in response
    jsonParsedContextAccounts satisfies SolanaRpcResponse<any>;
    jsonParsedContextAccounts.value[0].account satisfies AccountInfoWithBase64EncodedData | AccountInfoWithJsonData;

    // @ts-expect-error Should not be base58 encoded bytes
    jsonParsedContextAccounts.value[0].account.data satisfies Base58EncodedBytes;
  }
}
