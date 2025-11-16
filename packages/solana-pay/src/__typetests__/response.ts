/* eslint-disable @typescript-eslint/ban-ts-comment */
import type {
  SolanaPayTransactionRequestGetResponse,
  SolanaPayTransactionRequestGetResponseParsed,
  SolanaPayTransactionRequestPostResponse,
  SolanaPayTransactionRequestPostResponseParsed,
} from "../response.js";

// [DESCRIBE] Wire and Parsed types have matching keys
{
  // GET response: wire and parsed types must have the same keys
  type _GetWireKeys = keyof SolanaPayTransactionRequestGetResponse;
  type _GetParsedKeys = keyof SolanaPayTransactionRequestGetResponseParsed;

  // Assert bidirectional key compatibility
  null as unknown as _GetWireKeys satisfies _GetParsedKeys;
  null as unknown as _GetParsedKeys satisfies _GetWireKeys;

  // POST response: wire and parsed types must have the same keys
  type _PostWireKeys = keyof SolanaPayTransactionRequestPostResponse;
  type _PostParsedKeys = keyof SolanaPayTransactionRequestPostResponseParsed;

  // Assert bidirectional key compatibility
  null as unknown as _PostWireKeys satisfies _PostParsedKeys;
  null as unknown as _PostParsedKeys satisfies _PostWireKeys;
}
