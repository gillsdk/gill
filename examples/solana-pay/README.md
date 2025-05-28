# Gill Solana Pay Examples

A clean, dependency-free Solana Pay implementation built from scratch for Gill.

## Features

- ✅ Complete Solana Pay specification support
- ✅ Transfer requests (SOL and SPL tokens)
- ✅ Transaction requests (interactive payments)
- ✅ URL validation and parsing
- ✅ QR code helpers with terminal display
- ✅ Reference key tracking
- ✅ Decimal amount support (follows Solana Pay spec)
- ✅ Full TypeScript support with Gill's Address types
- ✅ Zero external dependencies

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run examples in order (recommended):
   ```bash
   pnpm run 01-basic        # Start here!
   pnpm run 02-transfers    # SOL and SPL transfers
   pnpm run 03-transactions # Transaction requests
   pnpm run 04-wallet       # Wallet integration
   ```

Each example displays QR codes in the terminal that you can scan with any Solana wallet!

## Examples Overview

### 1. Basic (`01-basic.ts`) - Start Here!
**Run:** `pnpm run 01-basic`

Demonstrates:
- Creating SOL transfer URLs with decimal amounts
- Creating transaction request URLs
- URL validation and parsing
- QR code generation and terminal display
- Reference key extraction

### 2. Transfers (`02-transfers.ts`)
**Run:** `pnpm run 02-transfers`

Demonstrates:
- SOL and SPL token transfer requests with decimal amounts
- All transfer parameters (amount, label, message, memo)
- Reference key generation and tracking
- URL encoding options
- Complete transfer request workflow
- QR codes for each payment type

### 3. Transactions (`03-transactions.ts`)
**Run:** `pnpm run 03-transactions`

Demonstrates:
- Interactive transaction request URLs
- HTTPS requirement enforcement
- URL validation and parsing
- Error handling for invalid URLs
- QR code generation for transaction requests

### 4. Wallet Integration (`04-wallet.ts`)
**Run:** `pnpm run 04-wallet`

Demonstrates:
- Wallet-side URL processing
- Transfer vs transaction request handling
- Security validation checks
- User interaction simulation
- Error handling patterns
- QR code display for valid URLs

## Quick Start

```typescript
import { createTransferRequestURL, parseSolanaPayURL } from "gill/node";

// Create a payment URL with decimal amount
const url = createTransferRequestURL({
  recipient: "11111111111111111111111111111112" as Address,
  amount: 0.001, // 0.001 SOL (decimal amount)
  label: "Coffee Shop",
  message: "Thanks for your order"
});

// Parse a payment URL
const data = parseSolanaPayURL(url);
console.log(data.params.recipient);
console.log(data.params.amount); // 0.001
```

## Amount Handling

Solana Pay URLs use decimal amounts as specified in the [official documentation](https://docs.solanapay.com/core/transfer-request/merchant-integration):

- **SOL**: Use decimal values (e.g., `0.001` for 0.001 SOL)
- **SPL Tokens**: Use decimal values (e.g., `5` for 5 USDC, `1.5` for 1.5 tokens)

```typescript
// SOL transfer
const solURL = createTransferRequestURL({
  recipient: merchantAddress,
  amount: 0.001, // 0.001 SOL
  label: "Coffee Shop"
});

// USDC transfer  
const usdcURL = createTransferRequestURL({
  recipient: merchantAddress,
  amount: 5, // 5 USDC
  splToken: usdcMint,
  label: "Coffee Shop"
});
```

## API Reference

### `createTransferRequestURL(params, options?)`

Creates a Solana Pay transfer request URL.

```typescript
const url = createTransferRequestURL({
  recipient: merchantAddress,
  amount: 0.001, // Decimal amount
  splToken: usdcMint, // Optional: for SPL tokens
  reference: [referenceKey], // Optional: for tracking
  label: "Coffee Shop",
  message: "Thanks",
  memo: "Order 123"
});
```

### `createTransactionRequestURL(params, options?)`

Creates a transaction request URL for interactive payments.

```typescript
const url = createTransactionRequestURL({
  link: "https://merchant.com/api/pay"
});
```

### `parseSolanaPayURL(url)`

Parses a Solana Pay URL into structured data.

```typescript
const data = parseSolanaPayURL(url);
if (data.type === "transfer" && data.params.amount) {
  console.log(`Amount: ${data.params.amount} SOL`);
}
```

### Other Functions

- `validateSolanaPayURL(url)` - Validates a URL
- `extractReferenceKeys(url)` - Gets reference keys
- `toQRCodeURL(url)` - Prepares URL for QR codes

## Types

```typescript
interface TransferRequestParams {
  recipient: Address;
  amount?: number; // Decimal amount (e.g., 0.001 for 0.001 SOL)
  splToken?: Address;
  reference?: Address[];
  label?: string;
  message?: string;
  memo?: string;
}

interface TransactionRequestParams {
  link: string;
}

type SolanaPayData =
  | { type: "transfer"; params: TransferRequestParams }
  | { type: "transaction"; params: TransactionRequestParams };
```

## Integration Examples

### Merchant Integration

```typescript
import { createTransferRequestURL, extractReferenceKeys } from "gill/node";

// Create payment request with tracking
const merchantWallet = "YourMerchantWalletAddress" as Address;
const referenceKey = "UniqueOrderReference" as Address;

const paymentURL = createTransferRequestURL({
  recipient: merchantWallet,
  amount: 0.005, // 0.005 SOL
  reference: [referenceKey],
  label: "Acme Coffee Shop",
  message: "Payment for 1x Latte",
  memo: "Order 12345"
});

// Monitor payments using reference key
const references = extractReferenceKeys(paymentURL);
```

### Wallet Integration

```typescript
import { parseSolanaPayURL, validateSolanaPayURL } from "gill/node";

function handleSolanaPayURL(url: string) {
  if (!validateSolanaPayURL(url)) {
    throw new Error("Invalid Solana Pay URL");
  }
  
  const parsed = parseSolanaPayURL(url);
  
  if (parsed.type === "transfer") {
    const { recipient, amount, label, message } = parsed.params;
    if (amount) {
      console.log(`Send ${amount} SOL to ${recipient}`);
    }
    console.log(`${label}: ${message}`);
  } else {
    console.log(`Transaction endpoint: ${parsed.params.link}`);
  }
}
```

## QR Code Testing

All examples generate QR codes that you can scan with any Solana wallet:

1. **Phantom** - Scan QR codes directly from the app
2. **Solflare** - Use the scan feature to test payments
3. **Backpack** - Scan codes to initiate transfers
4. **Any Solana Pay compatible wallet**

The QR codes are displayed directly in your terminal for easy testing!

## Best Practices

1. **Always validate URLs** before processing them
2. **Use reference keys** for order tracking and payment verification
3. **Handle errors gracefully** with proper error types
4. **Use HTTPS** for transaction request endpoints
5. **Store reference keys** in your database for payment reconciliation
6. **Use decimal amounts** as specified in the Solana Pay documentation
7. **Test with real wallets** using the generated QR codes
8. **Avoid special characters** in URL parameters (use alphanumeric, spaces, and basic punctuation only)

## Specification Compliance

This implementation follows the [Solana Pay specification](https://docs.solanapay.com/core/transfer-request/merchant-integration) and is compatible with all Solana wallets. Amounts are handled as decimal values exactly as specified in the official documentation.

## Resources

- [Solana Pay Documentation](https://docs.solanapay.com/)
- [Gill Documentation](https://github.com/solana-foundation/gill)
- [Solana Developer Resources](https://solana.com/developers)
