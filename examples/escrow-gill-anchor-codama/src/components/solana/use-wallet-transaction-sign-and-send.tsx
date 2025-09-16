import type { Instruction, TransactionSendingSigner } from 'gill'
import { createTransaction, getBase58Decoder, signAndSendTransactionMessageWithSigners } from 'gill'
import { useSolana } from './use-solana'

export function useWalletTransactionSignAndSend() {
  const { client } = useSolana()

  return async (ix: Instruction | Instruction[], signer: TransactionSendingSigner) => {
    const { value: latestBlockhash } = await client.rpc.getLatestBlockhash().send()

    const transaction = createTransaction({
      feePayer: signer,
      version: 0,
      latestBlockhash,
      instructions: Array.isArray(ix) ? ix : [ix],
    })

    const signature = await signAndSendTransactionMessageWithSigners(transaction)

    return getBase58Decoder().decode(signature)
  }
}
