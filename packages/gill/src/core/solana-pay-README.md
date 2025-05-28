# Solana Pay Integration for Gill

This module provides a seamless integration between [Gill](https://github.com/solana-foundation/gill) and [Solana Pay](https://docs.solanapay.com/), allowing developers to easily create and handle Solana Pay URLs with Gill's type-safe Address system.

## Features

- ✅ **Type-safe**: Full TypeScript support with Gill's Address types
- ✅ **Official Solana Pay**: Built on top of the official `@solana/pay` package
- ✅ **Transfer Requests**: Create non-interactive SOL and SPL token transfer URLs
- ✅ **Transaction Requests**: Create interactive transaction request URLs
- ✅ **URL Parsing**: Parse and validate Solana Pay URLs
- ✅ **QR Code Ready**: Generate QR code-friendly URLs
- ✅ **Reference Keys**: Extract and handle reference keys for transaction tracking

## Installation

Solana Pay support is included with Gill. No additional installation required.

```bash
npm install gill
# or
pnpm add gill
```

## Quick Start

### Creating Transfer Request URLs

```typescript
import { createTransferRequestURL } from "gill";
import type { Address } from "gill";

// Basic SOL transfer
const solTransferURL = createTransferRequestURL({
  recipient: "11111111111111111111111111111112" as Address,
  amount: 1000000n, // 0.001 SOL in lamports
  label: "Coffee Shop",
  message: "Thanks for your purchase!"
});

console.log(solTransferURL);
// Output: solana:11111111111111111111111111111112?amount=1000000&label=Coffee%20Shop&message=Thanks%20for%20your%20purchase!

// SPL Token transfer (USDC example)
const usdcTransferURL = createTransferRequestURL({
  recipient: "11111111111111111111111111111112" as Address,
  amount: 1000000n, // 1 USDC (6 decimals)
  splToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address, // USDC mint
  label: "Coffee Shop",
  message: "Payment for coffee",
  memo: "Order #123"
});
```

### Creating Transaction Request URLs

```typescript
import { createTransactionRequestURL } from "gill";

const transactionURL = createTransactionRequestURL({
  link: "https://merchant.com/api/solana-pay"
});

console.log(transactionURL);
// Output: solana:https://merchant.com/api/solana-pay
```

### Parsing Solana Pay URLs

```typescript
import { parseSolanaPayURL } from "gill";

const url = "solana:11111111111111111111111111111112?amount=1000000&label=Coffee%20Shop";
const parsed = parseSolanaPayURL(url);

if (parsed.type === "transfer") {
  console.log("Recipient:", parsed.params.recipient);
  console.log("Amount:", parsed.params.amount);
  console.log("Label:", parsed.params.label);
} else {
  console.log("Transaction URL:", parsed.params.link);
}
```

### Validating URLs

```typescript
import { validateSolanaPayURL } from "gill";

const isValid = validateSolanaPayURL("solana:11111111111111111111111111111112");
console.log(isValid); // true

const isInvalid = validateSolanaPayURL("bitcoin:invalid");
console.log(isInvalid); // false
```

### QR Code Generation

```typescript
import { toQRCodeURL } from "gill";

const url = createTransferRequestURL({
  recipient: "11111111111111111111111111111112" as Address,
  amount: 1000000n,
  label: "Coffee Shop"
});

const qrUrl = toQRCodeURL(url);
// Use qrUrl with your preferred QR code library (qrcode, react-qr-code, etc.)
```

### Reference Keys for Transaction Tracking

```typescript
import { createTransferRequestURL, extractReferenceKeys } from "gill";

// Create URL with reference keys
const urlWithReferences = createTransferRequestURL({
  recipient: "11111111111111111111111111111112" as Address,
  amount: 1000000n,
  reference: [
    "22222222222222222222222222222223" as Address,
    "33333333333333333333333333333334" as Address
  ]
});

// Extract reference keys from URL
const references = extractReferenceKeys(urlWithReferences);
console.log(references); // ["22222222222222222222222222222223", "33333333333333333333333333333334"]
```

## API Reference

### Types

#### `GillTransferRequestParams`

```typescript
interface GillTransferRequestParams {
  recipient: Address;           // Required: The recipient's wallet address
  amount?: bigint;             // Optional: Amount in lamports (SOL) or token units (SPL)
  splToken?: Address;          // Optional: SPL token mint address
  reference?: Address[];       // Optional: Reference keys for tracking
  label?: string;              // Optional: Human-readable description
  message?: string;            // Optional: Human-readable message
  memo?: string;               // Optional: Memo to include in transaction
}
```

#### `GillTransactionRequestParams`

```typescript
interface GillTransactionRequestParams {
  link: string;                // Required: HTTPS URL for the transaction endpoint
}
```

#### `GillSolanaPayData`

```typescript
type GillSolanaPayData = 
  | { type: "transfer"; params: GillTransferRequestParams }
  | { type: "transaction"; params: GillTransactionRequestParams };
```

### Functions

#### `createTransferRequestURL(params, options?)`

Creates a Solana Pay transfer request URL.

**Parameters:**
- `params: GillTransferRequestParams` - Transfer parameters
- `options?: CreateSolanaPayURLOptions` - URL creation options

**Returns:** `string` - The Solana Pay URL

#### `createTransactionRequestURL(params, options?)`

Creates a Solana Pay transaction request URL.

**Parameters:**
- `params: GillTransactionRequestParams` - Transaction parameters
- `options?: CreateSolanaPayURLOptions` - URL creation options

**Returns:** `string` - The Solana Pay URL

#### `parseSolanaPayURL(url)`

Parses a Solana Pay URL and returns structured data.

**Parameters:**
- `url: string` - The Solana Pay URL to parse

**Returns:** `GillSolanaPayData` - Parsed URL data

#### `validateSolanaPayURL(url)`

Validates a Solana Pay URL.

**Parameters:**
- `url: string` - The URL to validate

**Returns:** `boolean` - True if valid, false otherwise

#### `toQRCodeURL(url)`

Converts a Solana Pay URL to a QR code-friendly format.

**Parameters:**
- `url: string` - The Solana Pay URL

**Returns:** `string` - URL-encoded string suitable for QR codes

#### `extractReferenceKeys(url)`

Extracts reference keys from a Solana Pay transfer request.

**Parameters:**
- `url: string` - The Solana Pay URL

**Returns:** `Address[]` - Array of reference addresses

## Advanced Usage

### Merchant Integration Example

```typescript
import { 
  createTransferRequestURL, 
  parseSolanaPayURL,
  extractReferenceKeys,
  validateTransfer 
} from "gill";
import type { Address } from "gill";

// 1. Create a payment request
const merchantWallet = "YourMerchantWalletAddress" as Address;
const referenceKey = "UniqueReferenceKeyForThisOrder" as Address;

const paymentURL = createTransferRequestURL({
  recipient: merchantWallet,
  amount: 5000000n, // 0.005 SOL
  reference: [referenceKey],
  label: "Acme Coffee Shop",
  message: "Payment for 1x Latte",
  memo: "Order #12345"
});

// 2. Display as QR code or link
console.log("Payment URL:", paymentURL);

// 3. Monitor for payment (in your backend)
async function checkPayment() {
  try {
    // Use the official @solana/pay validateTransfer function
    // (re-exported from gill for convenience)
    const response = await validateTransfer(
      connection, // Your Solana RPC connection
      signature,  // Transaction signature to validate
      {
        recipient: merchantWallet,
        amount: 5000000n,
        reference: referenceKey
      }
    );
    
    if (response) {
      console.log("Payment confirmed!");
      // Process the order
    }
  } catch (error) {
    console.error("Payment validation failed:", error);
  }
}
```

### Wallet Integration Example

```typescript
import { parseSolanaPayURL, validateSolanaPayURL } from "gill";

// Parse a scanned QR code or clicked link
function handleSolanaPayURL(url: string) {
  // First validate the URL
  if (!validateSolanaPayURL(url)) {
    throw new Error("Invalid Solana Pay URL");
  }
  
  // Parse the URL
  const parsed = parseSolanaPayURL(url);
  
  if (parsed.type === "transfer") {
    // Handle transfer request
    const { recipient, amount, splToken, label, message } = parsed.params;
    
    // Show confirmation dialog to user
    console.log(`Send ${amount} ${splToken ? 'tokens' : 'SOL'} to ${recipient}`);
    console.log(`Label: ${label}`);
    console.log(`Message: ${message}`);
    
    // Create and send transaction
    // ... your transaction logic here
    
  } else {
    // Handle transaction request
    const { link } = parsed.params;
    
    // Make GET request to the link for transaction details
    // Then POST with user's wallet address to get the transaction
    // ... your transaction request logic here
  }
}
```

## Error Handling

The module provides specific error types for different scenarios:

```typescript
import { 
  SolanaPayError, 
  InvalidSolanaPayURLError 
} from "gill";

try {
  const parsed = parseSolanaPayURL("invalid-url");
} catch (error) {
  if (error instanceof InvalidSolanaPayURLError) {
    console.error("Invalid Solana Pay URL:", error.message);
  } else if (error instanceof SolanaPayError) {
    console.error("Solana Pay error:", error.message, error.code);
  }
}
```

## Best Practices

1. **Always validate URLs** before processing them
2. **Use reference keys** for order tracking and payment verification
3. **Validate payments server-side** using the `validateTransfer` function
4. **Handle errors gracefully** with proper error types
5. **Use HTTPS** for transaction request endpoints
6. **Store reference keys** in your database for payment reconciliation

## Integration with Official @solana/pay

This module is built on top of the official `@solana/pay` package and re-exports useful functions:

```typescript
import { 
  findReference,      // Find transactions by reference key
  validateTransfer,   // Validate a transfer transaction
  // ... other @solana/pay functions
} from "gill";
```

For advanced use cases, you can also import directly from `@solana/pay`:

```typescript
import { findReference } from "@solana/pay";
```

## Links

- [Solana Pay Documentation](https://docs.solanapay.com/)
- [Official @solana/pay Package](https://www.npmjs.com/package/@solana/pay)