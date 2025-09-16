import { useMutation } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import type { Address } from 'gill'

interface ValidateEscrowInput {
  mintA: Address
  mintB: Address
  depositAmt: number
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function useValidateEscrow() {
  const { client } = useSolana()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationKey: ['escrow', 'validate'],
    mutationFn: async (input: ValidateEscrowInput): Promise<ValidationResult> => {
      const errors: string[] = []
      const warnings: string[] = []

      try {
        console.log('Validating escrow setup...')

        // Check SOL balance for fees
        try {
          const balance = await client.rpc.getBalance(signer.address).send()
          const solBalance = Number(balance.value) / 1e9 // Convert lamports to SOL
          console.log('SOL balance:', solBalance)

          if (solBalance < 0.01) {
            errors.push('Insufficient SOL for transaction fees. You need at least 0.01 SOL.')
          } else if (solBalance < 0.1) {
            warnings.push('Low SOL balance. Consider getting more SOL for multiple transactions.')
          }
        } catch (error) {
          console.error('SOL balance check failed:', error)
          errors.push('Could not check SOL balance. Please ensure you are connected to the correct network.')
        }

        // Check if mint A exists
        try {
          const mintAInfo = await client.rpc.getAccountInfo(input.mintA).send()
          if (!mintAInfo.value) {
            errors.push('Token A mint address does not exist or is invalid.')
          } else {
            console.log('Mint A exists:', input.mintA)
          }
        } catch (error) {
          console.error('Mint A verification failed:', error)
          errors.push('Could not verify Token A mint address.')
        }

        // Check if mint B exists
        try {
          const mintBInfo = await client.rpc.getAccountInfo(input.mintB).send()
          if (!mintBInfo.value) {
            errors.push('Token B mint address does not exist or is invalid.')
          } else {
            console.log('Mint B exists:', input.mintB)
          }
        } catch (error) {
          console.error('Mint B verification failed:', error)
          errors.push('Could not verify Token B mint address.')
        }

        // Check if user has associated token account for mint A and sufficient balance
        try {
          // For now, we'll just add a warning since we can't easily derive ATA addresses here
          warnings.push('Make sure you have an associated token account for Token A and sufficient balance.')
        } catch (error) {
          console.error('Token A account verification failed:', error)
          warnings.push('Could not verify token account for Token A.')
        }

        return {
          valid: errors.length === 0,
          errors,
          warnings,
        }
      } catch (error) {
        console.error('Validation failed:', error)
        return {
          valid: false,
          errors: ['Validation failed due to network error.'],
          warnings: [],
        }
      }
    },
  })
}
