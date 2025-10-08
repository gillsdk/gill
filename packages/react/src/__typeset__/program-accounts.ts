import {
  AccountInfoWithBase64EncodedData,
  AccountInfoWithBase64EncodedZStdCompressedData,
  AccountInfoWithJsonData,
  Address,
  Base58EncodedBytes,
  SolanaRpcResponse,
} from "gill";

import { useProgramAccounts } from "../hooks/program-accounts.js";

// [DESCRIBE] useProgramAccounts
{
  const program = null as unknown as Address;

  // default encoded data as bytes
  {
    const { accounts: baseConfigAccounts } = useProgramAccounts({ program });
    baseConfigAccounts[0].account.data satisfies AccountInfoWithBase64EncodedData["data"];

    const { accounts: baseConfigAccounts2 } = useProgramAccounts({
      config: {
        commitment: "finalized",
      },
      program,
    });
    baseConfigAccounts2[0].account.data satisfies AccountInfoWithBase64EncodedData["data"];

    const { accounts: baseConfigContextAccounts } = useProgramAccounts({
      config: {
        withContext: true,
      },
      program,
    });

    // Should include context in response
    baseConfigContextAccounts satisfies SolanaRpcResponse<any>;
    baseConfigContextAccounts.value[0].account satisfies AccountInfoWithBase64EncodedData;
  }

  // base64 encoded `data`
  {
    const { accounts: base64Accounts } = useProgramAccounts({
      config: {
        commitment: "finalized",
        encoding: "base64",
      },
      program,
    });
    base64Accounts[0].account satisfies AccountInfoWithBase64EncodedData;
    // @ts-expect-error Should not be base58 encoded bytes
    base64Accounts[0].account.data satisfies Base58EncodedBytes;

    const { accounts: base64ContextAccounts } = useProgramAccounts({
      config: {
        commitment: "finalized",
        encoding: "base64",
        withContext: true,
      },
      program,
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
      config: {
        commitment: "finalized",
        encoding: "base64+zstd",
      },
      program,
    });
    base64ZstdAccounts[0].account satisfies AccountInfoWithBase64EncodedZStdCompressedData;
    // @ts-expect-error Should not be base58 encoded bytes
    base64ZstdAccounts[0].account.data satisfies Base58EncodedBytes;

    const { accounts: base64ZstdContextAccounts } = useProgramAccounts({
      config: {
        commitment: "finalized",
        encoding: "base64+zstd",
        withContext: true,
      },
      program,
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
      config: {
        commitment: "finalized",
        encoding: "jsonParsed",
      },
      program,
    });

    jsonParsedAccounts[0].account satisfies AccountInfoWithBase64EncodedData | AccountInfoWithJsonData;
    // @ts-expect-error Should not be base58 encoded bytes
    jsonParsedAccounts[0].account.data satisfies Base58EncodedBytes;

    const { accounts: jsonParsedContextAccounts } = useProgramAccounts({
      config: {
        commitment: "finalized",
        encoding: "jsonParsed",
        withContext: true,
      },
      program,
    });
    jsonParsedContextAccounts.value[0].account.data;

    // Should include context in response
    jsonParsedContextAccounts satisfies SolanaRpcResponse<any>;
    jsonParsedContextAccounts.value[0].account satisfies AccountInfoWithBase64EncodedData | AccountInfoWithJsonData;

    // @ts-expect-error Should not be base58 encoded bytes
    jsonParsedContextAccounts.value[0].account.data satisfies Base58EncodedBytes;
  }
}
