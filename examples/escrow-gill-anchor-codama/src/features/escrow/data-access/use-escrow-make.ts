import { useMutation } from '@tanstack/react-query'
import { createTransaction, getBase58Decoder, signAndSendTransactionMessageWithSigners } from 'gill'
import { getMakeInstructionAsync } from '@/generated/instructions'
import type { Address } from 'gill'
import { toast } from 'sonner'
import { useSolana } from '@/components/solana/use-solana'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import { toastTx } from '@/components/toast-tx'

interface MakeEscrowInput {
  mintA: Address
  mintB: Address
  seed: number | bigint
  depositAmt: number | bigint
  receiveAmt: number | bigint
}

export function useEscrowMake() {
  const { client, cluster } = useSolana()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationKey: ['escrow', 'make'],
    mutationFn: async (input: MakeEscrowInput) => {
      try {
        console.log('=== ESCROW TRANSACTION DEBUG ===')
        console.log('Cluster:', cluster)
        console.log('Signer Address:', signer.address)
        console.log('Starting escrow creation with:', input)

        const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()
        console.log('Latest blockhash obtained:', latestBlockhash)

        // Check if the escrow program exists
        try {
          const { ESCROW_ANCHOR_PROGRAM_ADDRESS } = await import('@/generated/programs')
          const programInfo = await client.rpc.getAccountInfo(ESCROW_ANCHOR_PROGRAM_ADDRESS).send()
          if (!programInfo.value) {
            throw new Error(
              `Escrow program not found at ${ESCROW_ANCHOR_PROGRAM_ADDRESS}. Make sure you're on the correct network and the program is deployed.`,
            )
          }
          console.log('Escrow program found at:', ESCROW_ANCHOR_PROGRAM_ADDRESS)
        } catch (error) {
          console.error('Program check failed:', error)
          if (error instanceof Error && error.message.includes('program not found')) {
            throw error
          }
          // Continue anyway - the error might be network related
        }

        console.log('Creating instruction with signer:', signer.address)
        const instruction = await getMakeInstructionAsync({
          maker: signer,
          mintA: input.mintA,
          mintB: input.mintB,
          seed: input.seed,
          depositAmt: input.depositAmt,
          receiveAmt: input.receiveAmt,
        })
        console.log('Instruction created successfully')

        const transaction = createTransaction({
          feePayer: signer,
          version: 0,
          latestBlockhash,
          instructions: [instruction],
        })
        console.log('Transaction created, signing and sending...')
        const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction)
        const signature = getBase58Decoder().decode(signatureBytes)
        console.log('Transaction successful:', signature)

        return signature
      } catch (error: unknown) {
        console.error('Make escrow failed:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))

        // Log the full error object for debugging
        if (error && typeof error === 'object') {
          console.error('Error keys:', Object.keys(error))
          console.error('Error prototype:', Object.getPrototypeOf(error))
        }

        // Try to extract more details from Solana errors
        let errorMessage = 'Unknown error occurred'

        if (error instanceof Error) {
          errorMessage = error.message
          console.error('Error stack:', error.stack)

          // Check for common Solana error patterns
          if (error.message.includes('insufficient')) {
            throw new Error('Insufficient funds. Make sure you have enough tokens and SOL for fees.')
          }
          if (error.message.includes('InvalidAccountData')) {
            throw new Error('Invalid account data. The token mint addresses may be incorrect.')
          }
          if (error.message.includes('TokenAccountNotFoundError')) {
            throw new Error('Token account not found. You may need to create an associated token account first.')
          }
          if (error.message.includes('AccountNotFound')) {
            throw new Error('Account not found. Please verify your token mint addresses are correct.')
          }
          if (error.message.includes('custom program error: 0x1')) {
            throw new Error('Insufficient funds in token account.')
          }
          if (error.message.includes('custom program error')) {
            throw new Error('Program error. This might be due to invalid parameters or program state.')
          }
        }

        throw new Error(`Transaction failed: ${errorMessage}`)
      }
    },
    onSuccess: (signature) => {
      toastTx(signature)
    },
    onError: (error) => {
      toast.error(`Failed to create escrow: ${error}`)
    },
  })
}
