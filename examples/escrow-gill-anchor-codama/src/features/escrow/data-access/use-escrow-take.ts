import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createTransaction,
  getAddressEncoder,
  getBase58Decoder,
  getProgramDerivedAddress,
  signAndSendTransactionMessageWithSigners,
} from 'gill'
import { getTakeInstructionAsync } from '@/generated/instructions'
import type { Address } from 'gill'
import { toast } from 'sonner'
import { useSolana } from '@/components/solana/use-solana'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import { toastTx } from '@/components/toast-tx'
import { ESCROW_ANCHOR_PROGRAM_ADDRESS, fetchAllEscrow, getEscrowDiscriminatorBytes } from '@/generated'
import {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  getAssociatedTokenAccountAddress,
  SYSTEM_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
} from 'gill/programs'

interface TakeEscrowInput {
  maker: Address
  mintA: Address
  mintB: Address
  // escrow: Address
  seed: number | bigint
}

export function useEscrowTake() {
  const { client } = useSolana()
  const signer = useWalletUiSigner()
  const addressEncoder = getAddressEncoder()

  return useMutation({
    mutationKey: ['escrow', 'take'],
    mutationFn: async (input: TakeEscrowInput) => {
      try {
        console.log(input.seed, 'seed from taker')
        const seedBytes = new Uint8Array(new BigUint64Array([BigInt(input.seed)]).buffer)

        const [escrowPDA] = await getProgramDerivedAddress({
          programAddress: ESCROW_ANCHOR_PROGRAM_ADDRESS,
          seeds: ['escrow', addressEncoder.encode(signer.address), seedBytes],
        })

        const makerAtaB = await getAssociatedTokenAccountAddress(input.mintB, input.maker, TOKEN_PROGRAM_ADDRESS)
        const takerAtaB = await getAssociatedTokenAccountAddress(input.mintB, signer, TOKEN_PROGRAM_ADDRESS)
        const takerAtaA = await getAssociatedTokenAccountAddress(input.mintA, signer, TOKEN_PROGRAM_ADDRESS)
        const vault = await getAssociatedTokenAccountAddress(input.mintA, escrowPDA, TOKEN_PROGRAM_ADDRESS)

        const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()

        const instruction = await getTakeInstructionAsync({
          maker: input.maker,
          taker: signer,
          mintA: input.mintA,
          mintB: input.mintB,
          escrow: escrowPDA,
          vault,
          takerAtaA,
          makerAtaB,
          takerAtaB,
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




export function useGetEscrows() {
  const { cluster, client } = useSolana()
  const decoder = getBase58Decoder()

  return useQuery({
    queryKey: ['get-escrows', { cluster }],
    queryFn: async () => {
      try {
        const pairBytes = getEscrowDiscriminatorBytes()

        const rawAccounts = await client.rpc
          .getProgramAccounts(ESCROW_ANCHOR_PROGRAM_ADDRESS, {
            commitment: 'confirmed',
            dataSlice: { offset: 0, length: 0 },
            filters: [
              // Filter by the first 8 bytes (discriminator)
              // {
              //   memcmp: {
              //     offset: BigInt(0),
              //     bytes: decoder.decode(pairBytes) as Base58EncodedBytes,
              //     encoding: 'base58',
              //   },
              // },
            ],
          })
          .send()
          console.log(rawAccounts, "rawAccounts")

        const addresses = rawAccounts.map((account) => account.pubkey)

        const escrows = await fetchAllEscrow(client.rpc, addresses, { commitment: 'confirmed' })
        console.log(escrows, 'all escrow data')

        return escrows
      } catch (error) {
        throw error
      }
    },
  })
}