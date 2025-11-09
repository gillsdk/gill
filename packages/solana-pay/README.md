<h1 align="center">
  @gillsdk/solana-pay
</h1>

<p align="center">
  modern and type-safe Solana Pay protocol client library, built on top of gill
</p>

<p align="center">
  <a href="https://github.com/gillsdk/gill/actions/workflows/publish-packages.yml"><img src="https://img.shields.io/github/actions/workflow/status/gillsdk/gill/publish-packages.yml?logo=GitHub&label=tests" /></a>
  <a href="https://www.npmjs.com/package/@gillsdk/solana-pay"><img src="https://img.shields.io/npm/v/@gillsdk/solana-pay?logo=npm&color=377CC0" /></a>
  <a href="https://www.npmjs.com/package/@gillsdk/solana-pay"><img src="https://img.shields.io/npm/dm/@gillsdk/solana-pay?color=377CC0" /></a>
</p>

## Overview

`@gillsdk/solana-pay` is a complete, type-safe implementation of the
[Solana Pay specification](https://github.com/solana-foundation/solana-pay/blob/master/SPEC.md). Solana Pay is a
standardized protocol for encoding transaction requests within URLs, enabling seamless payments and blockchain
interactions across the Solana ecosystem.

**Key Features:**

- **Transfer Requests**: Create payment URLs for SOL and SPL tokens with optional reference tracking
- **Transaction Requests**: Build interactive checkout flows with HTTPS endpoints
- **URL Parsing**: Parse and validate any Solana Pay URL with full type safety
- **Response Handling**: Fetch and validate merchant information and transactions
- **Comprehensive Validation**: Built-in security checks including HTTPS enforcement, URL length validation, and input
  validation

## Installation

Install `@gillsdk/solana-pay` with your package manager of choice:

```shell
npm install gill @gillsdk/solana-pay
```

```shell
pnpm add gill @gillsdk/solana-pay
```

```shell
yarn add gill @gillsdk/solana-pay
```

## Documentation

For comprehensive documentation, examples, and best practices, see the
[Solana Pay guide](https://gillsdk.com/docs/guides/solana-pay).

Additional resources:

- [gill docs site](https://gillsdk.com)
- [gill setup guide](https://gillsdk.com/docs#quick-start)
- [gill API references](https://gillsdk.com/api)

## Request Types

Solana Pay supports two distinct request types:

**Transfer Requests** - Non-interactive payment URLs with all details encoded directly:

- Best for: Simple payments, invoices, QR codes
- No server required
- Example: `solana:recipient?amount=1.5&label=Coffee+Shop`

**Transaction Requests** - Interactive URLs pointing to HTTPS endpoints:

- Best for: Complex transactions, merchant checkouts, dynamic pricing
- Requires server-side implementation
- Example: `solana:https://merchant.example.com/api`

See the [Request Types documentation](https://gillsdk.com/docs/guides/solana-pay#request-types) for detailed comparison.

## API Reference

| Function                           | Purpose                                     | Documentation                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `encodeSolanaPayURL`               | Create transfer or transaction request URLs | [Transfer Requests](https://gillsdk.com/docs/guides/solana-pay#transfer-requests), [Transaction Requests](https://gillsdk.com/docs/guides/solana-pay#transaction-requests) |
| `parseSolanaPayURL`                | Parse and validate any Solana Pay URL       | [Parsing URLs](https://gillsdk.com/docs/guides/solana-pay#parsing-solana-pay-urls)                                                                                         |
| `solanaPayTransactionRequest.get`  | Fetch merchant info (GET request)           | [Fetching Merchant Information](https://gillsdk.com/docs/guides/solana-pay#fetching-merchant-information-get-request)                                                      |
| `solanaPayTransactionRequest.post` | Request transaction (POST request)          | [Requesting a Transaction](https://gillsdk.com/docs/guides/solana-pay#requesting-a-transaction-post-request)                                                               |
| `parseSolanaPayGetResponse`        | Validate GET response data                  | [Validating GET Responses](https://gillsdk.com/docs/guides/solana-pay#validating-get-responses)                                                                            |
| `parseSolanaPayPostResponse`       | Validate POST response data                 | [Validating POST Responses](https://gillsdk.com/docs/guides/solana-pay#validating-post-responses)                                                                          |

## Quick Start

### Transfer Request (Simple Payment)

```ts
import { encodeSolanaPayURL } from "@gillsdk/solana-pay";
import { address } from "gill";

// Create a payment request for 1.5 SOL
const url = encodeSolanaPayURL({
  recipient: address("nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5"),
  amount: 1.5,
  label: "Coffee Shop",
  message: "Payment for espresso",
});
// → "solana:nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5?amount=1.5&label=Coffee+Shop&message=Payment+for+espresso"
```

### Transaction Request (Interactive Checkout)

```ts
import { encodeSolanaPayURL, solanaPayTransactionRequest } from "@gillsdk/solana-pay";
import { address } from "gill";

// Create a transaction request URL
const url = encodeSolanaPayURL({
  link: new URL("https://merchant.example.com/api"),
  label: "Example Merchant",
  message: "Purchase item #42",
});

// Fetch merchant information (GET request)
const { label, icon } = await solanaPayTransactionRequest.get(new URL("https://merchant.example.com/api"));

// Request transaction (POST request)
const { transaction, message } = await solanaPayTransactionRequest.post(new URL("https://merchant.example.com/api"), {
  account: address("nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5"),
});
```
