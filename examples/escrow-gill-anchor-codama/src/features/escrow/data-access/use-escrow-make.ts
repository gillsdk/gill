import { useSolana } from '@/components/solana/use-solana'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import { toastTx } from '@/components/toast-tx'
import { ESCROW_ANCHOR_PROGRAM_ADDRESS, fetchAllEscrow, getEscrowDiscriminatorBytes } from '@/generated'
import { getMakeInstructionAsync } from '@/generated/instructions'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { Address, Base58EncodedBytes } from 'gill'
import {
  createTransaction,
  getAddressEncoder,
  getBase58Decoder,
  getProgramDerivedAddress,
  signAndSendTransactionMessageWithSigners,
} from 'gill'
import {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  getAssociatedTokenAccountAddress,
  SYSTEM_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
} from 'gill/programs'
import { toast } from 'sonner'

interface MakeEscrowInput {
  mintA: Address
  mintB: Address
  seed: number | bigint
  depositAmt: number | bigint
  receiveAmt: number | bigint
}

export function useEscrowMake() {
  const { client, cluster } = useSolana()
  const addressEncoder = getAddressEncoder()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationKey: ['escrow', 'make', { cluster, signer }],
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

        console.log(input.seed, 'seed from maker')
        const seedBytes = new Uint8Array(new BigUint64Array([BigInt(input.seed)]).buffer)

        const [escrowPDA] = await getProgramDerivedAddress({
          programAddress: ESCROW_ANCHOR_PROGRAM_ADDRESS,
          seeds: ['escrow', addressEncoder.encode(signer.address), seedBytes],
        })

        const makerAtaA = await getAssociatedTokenAccountAddress(input.mintA, signer, TOKEN_PROGRAM_ADDRESS)
        const vault = await getAssociatedTokenAccountAddress(input.mintA, escrowPDA, TOKEN_PROGRAM_ADDRESS)
        console.log(escrowPDA, makerAtaA, vault, 'derived')

        console.log('Creating instruction with signer:', signer.address)

        const instruction = await getMakeInstructionAsync({
          maker: signer,
          mintA: input.mintA,
          mintB: input.mintB,
          seed: BigInt(input.seed),
          vault,
          makerAtaA,
          depositAmt: BigInt(input.depositAmt),
          receiveAmt: BigInt(input.receiveAmt),
          escrow: escrowPDA,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
          systemProgram: SYSTEM_PROGRAM_ADDRESS,
        })

        console.log('Instruction created successfully')

        const transaction = await createTransaction({
          feePayer: signer,
          version: 'legacy',
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
      console.log(error, 'error creating escrow')
      toast.error(`Failed to create escrow: ${error}`)
    },
  })
}

