import { useMutation } from '@tanstack/react-query'
import {
  createTransaction,
  getAddressEncoder,
  getBase58Decoder,
  getProgramDerivedAddress,
  signAndSendTransactionMessageWithSigners,
} from 'gill'
import { getRefundInstructionAsync } from '@/generated/instructions'
import type { Address } from 'gill'
import { toast } from 'sonner'
import { useSolana } from '@/components/solana/use-solana'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import { toastTx } from '@/components/toast-tx'
import {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  getAssociatedTokenAccountAddress,
  SYSTEM_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
} from 'gill/programs'
import { ESCROW_ANCHOR_PROGRAM_ADDRESS } from '@/generated'

interface RefundEscrowInput {
  mintA: Address
  escrow: Address
    seed: number | bigint

}

export function useEscrowRefund() {
  const { client } = useSolana()
  const signer = useWalletUiSigner()
  const addressEncoder = getAddressEncoder()

  return useMutation({
    mutationKey: ['escrow', 'refund'],
    mutationFn: async (input: RefundEscrowInput) => {
      try {
        const seedBytes = new Uint8Array(new BigUint64Array([BigInt(input.seed)]).buffer)


        const [escrowPDA] = await getProgramDerivedAddress({
          programAddress: ESCROW_ANCHOR_PROGRAM_ADDRESS,
          seeds: ['escrow', addressEncoder.encode(signer.address), seedBytes],
        })

        const makerAtaA = await getAssociatedTokenAccountAddress(input.mintA, signer, TOKEN_PROGRAM_ADDRESS)
        const vault = await getAssociatedTokenAccountAddress(input.mintA, escrowPDA, TOKEN_PROGRAM_ADDRESS)

        const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()

        const instruction = await getRefundInstructionAsync({
          maker: signer,
          mintA: input.mintA,
          escrow: input.escrow,
          vault,
          makerAtaA,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
          systemProgram: SYSTEM_PROGRAM_ADDRESS,
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
        console.log('error', `Refund escrow failed! ${error}`)
        throw error
      }
    },
    onSuccess: (signature) => {
      toastTx(signature)
    },
    onError: (error) => {
      toast.error(`Failed to refund escrow: ${error}`)
    },
  })
}
