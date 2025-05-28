# gill examples - solana pay

Gill is aimed at abstracting away many of the complexities and boilerplate
required to perform common interactions with the Solana blockchain, while still
offering the low level "escape hatches" when developers need (or want)
fine-grain control.

This example demonstrates how to use Gill's Solana Pay integration to create payment requests, handle transactions, and integrate Solana Pay into your applications with full TypeScript support.

## Tech stack used

- TypeScript and NodeJS
- Package manger: `pnpm`
- Running the scripts: `esrun`

## Features Demonstrated

- ✅ Creating transfer request URLs for SOL and SPL tokens
- ✅ Creating transaction request URLs for interactive payments
- ✅ Parsing and validating Solana Pay URLs
- ✅ Generating QR codes for payments
- ✅ Reference key tracking for payment verification
- ✅ Merchant integration patterns
- ✅ Wallet integration patterns

## Prerequisites

- Node.js 20.18.0 or higher
- A Solana wallet (Phantom, Solflare, etc.)
- Some SOL for testing (use devnet faucet)

## Setup locally

1. Clone this repo to your local system
2. Install the packages via `pnpm install`
3. Change into this directory: `cd examples/solana-pay`

### Running the included scripts with esrun

Once setup locally, you will be able to run the scripts included within this
repo using `esrun`:

```shell
npx esrun ./src/<script>
pnpx esrun ./src/<script>
```

> From the [esrun](https://www.npmjs.com/package/esrun) readme:
>
> esrun is a "work out of the box" library to execute Typescript (as well as
> modern Javascript with decorators and stuff) without having to use a bundler.
> This is useful for quick demonstrations or when launching your tests written
> in Typescript.

## Running the Examples

### 1. Basic Transfer Request Example
```bash
pnpm run example:1-basic-transfer
```

### 2. Transaction Request Example
```bash
pnpm run example:2-transaction-request
```

### 3. Wallet Integration Example
```bash
pnpm run example:3-wallet-integration
```

### 4. Merchant Integration Example
```bash
pnpm run example:4-merchant-integration
```

### 5. Full Payment Flow Example
```bash
pnpm run example:5-full-payment-flow
```

### Run All Examples in Order
```bash
pnpm run example:all
```

## Recommended flow to explore this repo

After getting setup locally, we recommend exploring the code of the following
files **in this specific order** for the best learning experience:

### 1. [`1.basic-transfer-example.ts`](./src/1.basic-transfer-example.ts) - Start Here!
**Concepts**: Basic Solana Pay URLs, SOL transfers, SPL tokens, QR codes

Demonstrates how to create Solana Pay transfer request URLs for both SOL and SPL token transfers. Shows URL validation, parsing, reference key extraction, and QR code generation. This is the perfect starting point to understand Solana Pay fundamentals.

### 2. [`2.transaction-request-example.ts`](./src/2.transaction-request-example.ts) - Interactive Payments
**Concepts**: Transaction requests, server communication, HTTPS endpoints

Shows how to create interactive transaction request URLs that require server communication. Includes error handling for invalid URLs and demonstrates the complete transaction request flow.

### 3. [`3.wallet-integration-example.ts`](./src/3.wallet-integration-example.ts) - Wallet Perspective
**Concepts**: URL parsing, validation, security checks, user interaction

Demonstrates how a wallet application would handle Solana Pay URLs, including parsing, validation, security checks, and user interaction simulation.

### 4. [`4.merchant-integration-example.ts`](./src/4.merchant-integration-example.ts) - E-commerce Integration
**Concepts**: Order management, payment tracking, reference keys, validation

A complete e-commerce integration example showing order management, payment creation, tracking with reference keys, and transaction validation workflow.

### 5. [`5.full-payment-flow-example.ts`](./src/5.full-payment-flow-example.ts) - Complete Scenarios
**Concepts**: End-to-end flows, error handling, real-world scenarios

End-to-end payment scenarios combining both merchant and wallet perspectives, including error handling examples and complete payment flows.

## Key Concepts

### Transfer Requests
Non-interactive requests for SOL or SPL token transfers. The wallet can directly create and sign the transaction.

### Transaction Requests
Interactive requests that require communication with a merchant's server to get the actual transaction to sign.

### Reference Keys
Unique identifiers used to track and validate specific payments on-chain.

### QR Codes
Visual representation of Solana Pay URLs that can be scanned by mobile wallets.

## Best Practices

1. **Always validate URLs** before processing
2. **Use reference keys** for payment tracking
3. **Validate payments server-side** for security
4. **Handle errors gracefully** with proper error types
5. **Use HTTPS** for transaction request endpoints 