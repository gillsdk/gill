// TODO createInstruction().withMemo().withPriorityFee().withComputeLimit().transferSol().transferTokens()

import {
  Address,
  Blockhash,
  Instruction,
  Lamports,
  TransactionPartialSigner,
  TransactionSigner,
  TransactionVersion,
} from "@solana/kit";
import { createTransaction } from "../core";
import {
  getAddMemoInstruction,
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
  getTransferSolInstruction,
  getTransferTokensInstructions,
  TOKEN_PROGRAM_ADDRESS,
} from "../programs";

interface InstructionBuilder {
  instructions: Instruction[];
  withMemo: (message: string, signers?: Array<TransactionPartialSigner | TransactionSigner>) => InstructionBuilder;
  withPriorityFee: (microLamports: number) => InstructionBuilder;
  withComputeLimit: (units: number) => InstructionBuilder;
  transferSol: (amount: Lamports, destination: Address, source?: TransactionPartialSigner) => InstructionBuilder;
  transferTokens: (config: ITransferTokens) => InstructionBuilder;
  build: (options?: {
    latestBlockhash?: { blockhash: Blockhash; lastValidBlockHeight: bigint };
    version?: TransactionVersion;
  }) => ReturnType<typeof createTransaction>;
}

interface ITransferTokens {
  source?: TransactionPartialSigner | TransactionSigner;
  destination: Address;
  sourceAta: Address;
  destinationAta: Address;
  amount: number | bigint;
  mint: Address;
  authority?: TransactionSigner | Address;
  tokenProgram?: Address;
}
/**
 *### A builder function that builds on top of the previous ix and returns both instructions ready to be built with `.build()` 

 @example typedef
  interface InstructionBuilder {
  instructions: Instruction[];
  withMemo: (message: string, signers?: Array<TransactionPartialSigner | TransactionSigner>) => InstructionBuilder;
  withPriorityFee: (microLamports: number) => InstructionBuilder;
  withComputeLimit: (units: number) => InstructionBuilder;
  transferSol: (amount: Lamports, destination: Address, source?: TransactionPartialSigner) => InstructionBuilder;
  transferTokens: (config: ITransferTokens) => InstructionBuilder;
  build: (options?: {
    latestBlockhash?: { blockhash: Blockhash; lastValidBlockHeight: bigint };
    version?: TransactionVersion;
  }) => ReturnType<typeof createTransaction>;
}
 
 * @example 
  let new_ix = createInstruction(kp)
    .withMemo("Hello, this is an ix")
    .transferSol(lamports(lamportsToSend), destinationAddres)
    .transferTokens({
      amount: 5_000_000,
      destinationAta,
      sourceAta,
      mint: tokenMint,
      destination: destinationAddres,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    })
    .build({
      version: "legacy",
    });
  const txSignature = await sendAndConfirmTransaction(new_ix);

  console.log(
    "Explorer airdrop:",
    getExplorerLink({
      cluster: "devnet",
      transaction: txSignature,
    })
  );
 */
export const createInstruction = (feePayer: TransactionSigner | TransactionPartialSigner): InstructionBuilder => {
  const builder = (instructions: Instruction[] = []): InstructionBuilder => ({
    instructions,

    withMemo: (message: string, signers?) => {
      const memoIx = getAddMemoInstruction({
        memo: message,
        signers: signers ?? [feePayer],
      });
      instructions.push(memoIx);
      return builder(instructions);
    },

    withPriorityFee: (microLamports: number) => {
      const priorityIx = getSetComputeUnitPriceInstruction({ microLamports });
      instructions.push(priorityIx);
      return builder(instructions);
    },

    withComputeLimit: (units: number) => {
      const computeIx = getSetComputeUnitLimitInstruction({ units });
      instructions.push(computeIx);
      return builder(instructions);
    },

    transferSol: (amount, destination, source) => {
      const transferIx = getTransferSolInstruction({
        amount,
        destination,
        source: source ?? feePayer,
      });

      instructions.push(transferIx);
      return builder(instructions);
    },

    transferTokens: (config: ITransferTokens) => {
      const tokenIx = getTransferTokensInstructions({
        feePayer: config.source ?? feePayer,
        mint: config.mint,
        amount: config.amount,
        authority: config.authority ?? config.source ?? feePayer,
        sourceAta: config.sourceAta,
        destination: config.destination,
        destinationAta: config.destinationAta,
        tokenProgram: config.tokenProgram ?? TOKEN_PROGRAM_ADDRESS,
      });
      instructions.push(...tokenIx);
      return builder(instructions);
    },

    build: (options?) => {
      return createTransaction({
        instructions,
        feePayer,
        latestBlockhash: options?.latestBlockhash,
        version: options?.version,
      });
    },
  });

  return builder();
};
