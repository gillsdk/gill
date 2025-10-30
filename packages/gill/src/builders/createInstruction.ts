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
  /**
   * Adds a memo instruction to the transaction.
   *
   * @param {string} message - The memo message to include.
   * @param {Array<TransactionPartialSigner | TransactionSigner>} [signers] - Optional signers for the memo instruction. Defaults to the `feePayer`.
   * @returns {InstructionBuilder} The builder instance for chaining.
   */
  withMemo: (message: string, signers?: Array<TransactionPartialSigner | TransactionSigner>) => InstructionBuilder;

  /**
   * Sets a priority fee (in microLamports) to increase transaction confirmation speed.
   *
   * @param {number} microLamports - The fee per compute unit in microLamports.
   * @returns {InstructionBuilder} The builder instance for chaining.
   */
  withPriorityFee: (microLamports: number) => InstructionBuilder;

  /**
   * Sets a custom compute unit limit for the transaction.
   *
   * @param {number} units - The number of compute units to allocate.
   * @returns {InstructionBuilder} The builder instance for chaining.
   */
  withComputeLimit: (units: number) => InstructionBuilder;

  /**
   * Adds a native SOL transfer instruction.
   *
   * @param {Lamports} amount - The amount of SOL (in lamports) to transfer.
   * @param {Address} destination - The recipient's address.
   * @param {TransactionPartialSigner} [source] - Optional source account. Defaults to the `feePayer`.
   * @returns {InstructionBuilder} The builder instance for chaining.
   */
  transferSol: (amount: Lamports, destination: Address, source?: TransactionPartialSigner) => InstructionBuilder;

  /**
   * Adds one or more SPL token transfer instructions.
   *
   * @param {ITransferTokens} config - Configuration for the token transfer.
   * @param {Address} config.sourceAta - Associated Token Account (ATA) of the sender.
   * @param {Address} config.destinationAta - Associated Token Account (ATA) of the receiver.
   * @param {Address} config.mint - Token mint address.
   * @param {Address} config.destination - Recipient wallet address.
   * @param {bigint | number} config.amount - Amount of tokens to transfer (raw, not decimals-adjusted).
   * @param {TransactionSigner | Address} [config.authority] - Optional authority over the token account.
   * @param {Address} [config.tokenProgram] - SPL Token Program address (defaults to TOKEN_PROGRAM_ADDRESS).
   * @returns {InstructionBuilder} The builder instance for chaining.
   */
  transferTokens: (config: ITransferTokens) => InstructionBuilder;

  /**
   * Finalizes and creates a Solana transaction from all accumulated instructions.
   *
   * @param {Object} [options] - Optional build configuration.
   * @param {{ blockhash: Blockhash; lastValidBlockHeight: bigint }} [options.latestBlockhash] - Optional pre-fetched blockhash for transaction.
   * @param {TransactionVersion} [options.version] - Transaction version (`"legacy"`, `"v0"`).
   * @returns {ReturnType<typeof createTransaction>} The finalized transaction object.
   */
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
 * 
 * **Instruction Builder**
 *### A builder function that helps construct transactions by chaining multiple instructions and returns all instructions ready to be built with `.build()` 

 ---
 @param {TransactionSigner | TransactionPartialSigner} feePayer - The signer responsible for paying transaction fees.
 * @returns {InstructionBuilder} A builder instance with chainable methods for creating and assembling instructions.

 
 * @example 
 ```ts
  let new_ix = createInstructionBuilder(kp)
    .withMemo("Hello, this is an ix")
    .transferSol(lamports(lamportsToSend), destinationAddres)
    .transferTokens({
      amount: 5_000_000,
      destinationAta,
      sourceAta,
      mint: tokenMint,
      destination: destinationAddres,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    }).withPriorityFee(10_000) // Optional, improves confirmation speed
    .withComputeLimit(500_000) // optional
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
  ```
  ---
  Type Definition
  ---

  ```ts
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
  ```
 */
export const createInstructionBuilder = (
  feePayer: TransactionSigner | TransactionPartialSigner,
): InstructionBuilder => {
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
