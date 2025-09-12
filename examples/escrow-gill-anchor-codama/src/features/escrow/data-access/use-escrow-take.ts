import { useMutation } from '@tanstack/react-query'
import { createTransaction, getBase58Decoder, signAndSendTransactionMessageWithSigners } from 'gill'
import { getTakeInstructionAsync } from '@/generated/instructions'
import type { Address } from 'gill'
import { toast } from 'sonner'
import { useSolana } from '@/components/solana/use-solana'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import { toastTx } from '@/components/toast-tx'

interface TakeEscrowInput {
  maker: Address
  mintA: Address
  mintB: Address
  escrow: Address
}

export function useEscrowTake() {
  const { client } = useSolana()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationKey: ['escrow', 'take'],
    mutationFn: async (input: TakeEscrowInput) => {
      try {
        const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()

        const instruction = await getTakeInstructionAsync({
          maker: input.maker,
          taker: signer,
          mintA: input.mintA,
          mintB: input.mintB,
          escrow: input.escrow,
        })

        const transaction = createTransaction({
          feePayer: signer,
          version: 0,
          latestBlockhash,
          instructions: [instruction],
        })

        const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction)
        const signature = getBase58Decoder().decode(signatureBytes)

        return signature
      } catch (error: unknown) {
        console.log('error', `Take escrow failed! ${error}`)
        throw error
      }
    },
    onSuccess: (signature) => {
      toastTx(signature)
    },
    onError: (error) => {
      toast.error(`Failed to take escrow: ${error}`)
    },
  })
}
