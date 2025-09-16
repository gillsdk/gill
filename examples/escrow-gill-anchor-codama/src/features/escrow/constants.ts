import type { Address } from 'gill'

// Common devnet test tokens
export const DEVNET_TOKENS = {
  // USDC Devnet
  USDC: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr' as Address,
  // USDT Devnet
  USDT: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' as Address,
  // SOL (wrapped)
  WSOL: 'So11111111111111111111111111111111111111112' as Address,
} as const

export const EXAMPLE_ESCROW = {
  seed: Math.floor(Math.random() * 1000000),
  depositAmount: 1000000, // 0.001 tokens (assuming 9 decimals)
  receiveAmount: 2000000, // 0.002 tokens (assuming 9 decimals)
} as const
