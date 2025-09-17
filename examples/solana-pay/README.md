# Solana Pay Examples

Solana Pay implementation for Gill.

## Setup

```bash
pnpm install
```

## Examples

Run examples in order:

```bash
pnpm run 01-basic        # Basic usage
pnpm run 02-transfers    # SOL and SPL transfers  
pnpm run 03-transactions # Transaction requests
pnpm run 04-wallet       # Wallet integration
```

## Quick Start

```typescript
import { createTransferRequestURL, parseSolanaPayURL } from "gill/node";

// Create payment URL
const url = createTransferRequestURL({
  recipient: "11111111111111111111111111111112" as Address,
  amount: 0.001,
  label: "Coffee Shop"
});

// Parse payment URL
const data = parseSolanaPayURL(url);
```

## API

### Transfer Requests

```typescript
createTransferRequestURL({
  recipient: Address,
  amount?: number,        // Decimal amount (0.001 = 0.001 SOL)
  splToken?: Address,     // For SPL tokens
  reference?: Address[],  // Payment tracking
  label?: string,
  message?: string,
  memo?: string
}, options?)
```

### Transaction Requests

```typescript
createTransactionRequestURL({
  link: string  // HTTPS endpoint
}, options?)
```

### Utilities

- `parseSolanaPayURL(url)` - Parse URL into structured data
- `validateSolanaPayURL(url)` - Validate URL format
- `extractReferenceKeys(url)` - Get reference keys for tracking
- `toQRCodeURL(url)` - Prepare URL for QR codes

## Types

```typescript
interface TransferRequestParams {
  recipient: Address;
  amount?: number;
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

## Examples

### Merchant Integration

```typescript
const paymentURL = createTransferRequestURL({
  recipient: merchantWallet,
  amount: 0.005,
  reference: [orderReference],
  label: "Coffee Shop",
  memo: "Order 123"
});
```

### Wallet Integration

```typescript
function handlePaymentURL(url: string) {
  if (!validateSolanaPayURL(url)) return;
  
  const parsed = parseSolanaPayURL(url);
  if (parsed.type === "transfer") {
    // Handle transfer
  } else {
    // Handle transaction request
  }
}
```

QR codes are generated in terminal for testing with mobile wallets.
