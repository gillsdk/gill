# Solana Pay Examples

This directory contains comprehensive examples demonstrating Gill's Solana Pay integration.

## Tech stack used

- TypeScript and NodeJS
- Package manger: `pnpm`
- Running the scripts: `esrun`

## Available Examples

### 1. Basic Transfer Request (`1.basic-transfer-example.ts`) - Start Here!
**Run:** `pnpm run example:1-basic-transfer` or `npx esrun src/1.basic-transfer-example.ts`

Demonstrates:
- Creating SOL and SPL token transfer requests
- URL validation and parsing
- Reference key generation and extraction
- QR code generation
- Complete transfer request workflow

### 2. Transaction Request (`2.transaction-request-example.ts`)
**Run:** `pnpm run example:2-transaction-request` or `npx esrun src/2.transaction-request-example.ts`

Demonstrates:
- Creating interactive transaction request URLs
- URL validation and parsing
- Error handling for invalid URLs
- QR code generation for transaction requests
- HTTPS requirement enforcement

### 3. Wallet Integration (`3.wallet-integration-example.ts`)
**Run:** `pnpm run example:3-wallet-integration` or `npx esrun src/3.wallet-integration-example.ts`

Demonstrates:
- Wallet-side URL processing
- Transfer vs transaction request handling
- Security validation checks
- User interaction simulation
- Error handling patterns

### 4. Merchant Integration (`4.merchant-integration-example.ts`)
**Run:** `pnpm run example:4-merchant-integration` or `npx esrun src/4.merchant-integration-example.ts`

Demonstrates:
- Complete e-commerce integration
- Order management with reference keys
- Payment monitoring simulation
- Transaction validation workflow
- Best practices for merchants

### 5. Full Payment Flow (`5.full-payment-flow-example.ts`)
**Run:** `pnpm run example:5-full-payment-flow` or `npx esrun src/5.full-payment-flow-example.ts`

Demonstrates:
- End-to-end payment scenarios
- Both transfer and transaction flows
- Error handling examples
- Complete merchant-to-customer journey

### Run All Examples in Order
**Run:** `pnpm run example:all`

Executes all examples in the recommended learning sequence.

## Key Features Demonstrated

✅ **Transfer Requests** - Non-interactive SOL and SPL token payments
✅ **Transaction Requests** - Interactive payments requiring server communication
✅ **URL Validation** - Proper validation before processing
✅ **QR Code Generation** - Visual payment codes for mobile wallets
✅ **Reference Tracking** - Unique payment identification and monitoring
✅ **Error Handling** - Robust error management patterns
✅ **Type Safety** - Full TypeScript support with Gill's Address types

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run examples in order (recommended):
   ```bash
   pnpm run example:1-basic-transfer    # Start here!
   pnpm run example:2-transaction-request
   pnpm run example:3-wallet-integration
   pnpm run example:4-merchant-integration
   pnpm run example:5-full-payment-flow
   ```

3. Or run all at once:
   ```bash
   pnpm run example:all
   ```

4. Scan the generated QR codes with a Solana wallet to test payments

## Integration Guide

These examples show how to integrate Solana Pay into your applications:

1. **For Merchants**: See `4.merchant-integration-example.ts` for complete e-commerce flows
2. **For Wallets**: See `3.wallet-integration-example.ts` for payment processing
3. **For Developers**: See `1.basic-transfer-example.ts` and `2.transaction-request-example.ts` for core functionality

## Resources

- [Solana Pay Documentation](https://docs.solanapay.com/)
- [Gill Documentation](https://github.com/solana-foundation/gill)
- [Solana Developer Resources](https://solana.com/developers) 