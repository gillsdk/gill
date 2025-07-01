<h1 align="center">
  gill
</h1>

<p align="center">
  javascript/typescript client library for interacting with the Solana blockchain
</p>

<p align="center">
  <a href="https://github.com/DecalLabs/gill/actions/workflows/publish-packages.yml"><img src="https://img.shields.io/github/actions/workflow/status/DecalLabs/gill/publish-packages.yml?logo=GitHub&label=tests" /></a>
  <a href="https://www.npmjs.com/package/gill"><img src="https://img.shields.io/npm/v/gill?logo=npm&color=377CC0" /></a>
  <a href="https://www.npmjs.com/package/gill"><img src="https://img.shields.io/npm/dm/gill?color=377CC0" /></a>
</p>

<p align="center">
  <img width="600" alt="gill" src="https://raw.githubusercontent.com/DecalLabs/gill/refs/heads/master/docs/public/cover.png" />
</p>

## Overview

Welcome to `gill`, a JavaScript/TypeScript client library for interacting with the [Solana](http://solana.com/)
blockchain. You can use it to build Solana apps in Node, web, React Native, or just about any other JavaScript
environment.

Gill is built on top of the modern javascript libraries for Solana built by Anza called
[@solana/kit](https://github.com/anza-xyz/kit) (formerly known as "web3.js v2"). By utilizing the same types and
functions under the hood, `gill` is compatible with `kit`. See [Replacing Kit with gill](#replace-kit-with-gill).

> For a comparison of using gill vs web3js v2, take a look at the
> [comparison examples](https://github.com/DecalLabs/gill/tree/master/examples/get-started#comparison-of-gill-vs-solanakit-aka-web3js-v2).

## Installation

Install `gill` with your package manager of choice:

```shell
npm install gill
```

```shell
pnpm add gill
```

```shell
yarn add gill
```

### Replace Kit with gill

All imports from the `@solana/kit` library can be directly replaces with `gill` to achieve the exact same functionality.
Plus unlock the additional functionality only included in Gill, like `createSolanaTransaction`.

Simply [install gill](#installation) and replace your imports

## Quick start

> Find a collection of example code snippets using `gill` inside the
> [`/examples` directory](https://github.com/DecalLabs/gill/tree/master/examples), including
> [basic operations](https://github.com/DecalLabs/gill/tree/master/examples/get-started) and common
> [token operations](https://github.com/DecalLabs/gill/tree/master/examples/tokens).

- [Create a Solana RPC connection](#create-a-solana-rpc-connection)
- [Making Solana RPC calls](#making-solana-rpc-calls)
- [Create a transaction](#create-a-transaction)
- [Signing transactions](#signing-transactions)
- [Simulating transactions](#simulating-transactions)
- [Sending and confirming transaction](#sending-and-confirming-transactions)
- [Get a transaction signature](#get-the-signature-from-a-signed-transaction)
- [Get a Solana Explorer link](#get-a-solana-explorer-link-for-transactions-accounts-or-blocks)
- [Calculate minimum rent balance for an account](#calculate-minimum-rent-for-an-account)
- [Generating keypairs and signers](#generating-keypairs-and-signers)
- [Generating extractable keypairs and signers](#generating-extractable-keypairs-and-signers)

You can also find some [NodeJS specific helpers](#node-specific-imports) like:

- [Loading a keypair from a file](#loading-a-keypair-from-a-file)
- [Saving a keypair to a file](#saving-a-keypair-to-a-file)
- [Loading a keypair from an environment variable](#loading-a-keypair-from-an-environment-variable)
- [Saving a keypair to an environment variable file](#saving-a-keypair-to-an-environment-file)
- [Loading a base58 keypair from an environment variable](#loading-a-base58-keypair-from-an-environment-variable)

You can find [transaction builders](#transaction-builders) for common tasks, including:

- [Creating a token with metadata](#create-a-token-with-metadata)
- [Minting tokens to a destination wallet](#mint-tokens-to-a-destination-wallet)
- [Transfer tokens to a destination wallet](#transfer-tokens-to-a-destination-wallet)

For troubleshooting and debugging your Solana transactions, see [Debug mode](#debug-mode) below.

> You can also consult the documentation for Anza's [JavaScript client](https://github.com/anza-xyz/solana-web3.js)
> library for more information and helpful resources.

### Generating keypairs and signers

For most "signing" operations, you will need a `KeyPairSigner` instance, which can be used to sign transactions and
messages.

To generate a random `KeyPairSigner`:

```typescript
import { generateKeyPairSigner } from "gill";

const signer: KeyPairSigner = await generateKeyPairSigner();
```

> Note: These Signers are non-extractable, meaning there is no way to get the secret key material out of the instance.
> This is a more secure practice and highly recommended to be used over extractable keypairs, unless you REALLY need to
> be able to save the keypair for some reason.

### Generating extractable keypairs and signers

Extractable keypairs are less secure and should not be used unless you REALLY need to save the key for some reason.
Since there are a few useful cases for saving these keypairs, gill contains a separate explicit function to generate
these extractable keypairs.

To generate a random, **extractable** `KeyPairSigner`:

```typescript
import { generateExtractableKeyPairSigner } from "gill";

const signer: KeyPairSigner = await generateExtractableKeyPairSigner();
```

> WARNING: Using **extractable** keypairs are inherently less-secure, since they allow the secret key material to be
> extracted. Obviously. As such, they should only be used sparingly and ONLY when you have an explicit reason you need
> extract the key material (like if you are going to save the key to a file).

### Create a Solana RPC connection

Create a Solana `rpc` and `rpcSubscriptions` client for any RPC URL or standard Solana network moniker (i.e. `devnet`,
`localnet`, `mainnet` etc).

```typescript
import { createSolanaClient } from "gill";

const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "mainnet",
});
```

> Using the Solana moniker will connect to the public RPC endpoints. These are subject to rate limits and should not be
> used in production applications. Applications should find their own RPC provider and the URL provided from them.

To create an RPC client for your local test validator:

```typescript
import { createSolanaClient } from "gill";

const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "localnet",
});
```

To create an RPC client for an custom RPC provider or service:

```typescript
import { createSolanaClient } from "gill";

const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "https://private-solana-rpc-provider.com",
});
```

### Making Solana RPC calls

After you have a Solana `rpc` connection, you can make all the [JSON RPC method](https://solana.com/docs/rpc) calls
directly off of it.

```typescript
import { createSolanaClient } from "gill";

const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });

// get slot
const slot = await rpc.getSlot().send();

// get the latest blockhash
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
```

> The `rpc` client requires you to call `.send()` on the RPC method in order to actually send the request to your RPC
> provider and get a response.

You can also include custom configuration settings on your RPC calls, like using a JavaScript
[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController), by passing it into `send()`:

```typescript
import { createSolanaClient } from "gill";

const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });

// Create a new AbortController.
const abortController = new AbortController();

// Abort the request when the user navigates away from the current page.
function onUserNavigateAway() {
  abortController.abort();
}

// The request will be aborted if and only if the user navigates away from the page.
const slot = await rpc.getSlot().send({ abortSignal: abortController.signal });
```

### Create a transaction

Quickly create a Solana transaction:

> Note: The `feePayer` can be either an `Address` or `TransactionSigner`.

```typescript
import { createTransaction } from "gill";

const transaction = createTransaction({
  version,
  feePayer,
  instructions,
  // the compute budget values are HIGHLY recommend to be set in order to maximize your transaction landing rate
  // computeUnitLimit: number,
  // computeUnitPrice: number,
});
```

To create a transaction while setting the latest blockhash:

```typescript
import { createTransaction } from "gill";

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const transaction = createTransaction({
  version,
  feePayer,
  instructions,
  latestBlockhash,
  // the compute budget values are HIGHLY recommend to be set in order to maximize your transaction landing rate
  // computeUnitLimit: number,
  // computeUnitPrice: number,
});
```

### Signing transactions

If your transaction already has the latest blockhash lifetime set via `createTransaction`:

```typescript
import { createTransaction, signTransactionMessageWithSigners } from "gill";

const transaction = createTransaction(...);

const signedTransaction = await signTransactionMessageWithSigners(transaction);
```

If your transaction does NOT have the latest blockhash lifetime set via `createTransaction`, you must set the latest
blockhash lifetime before (or during) the signing operation:

```typescript
import {
  createTransaction,
  createSolanaClient,
  signTransactionMessageWithSigners,
  setTransactionMessageLifetimeUsingBlockhash,
} from "gill";

const { rpc } = createSolanaClient(...);
const transaction = createTransaction(...);

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const signedTransaction = await signTransactionMessageWithSigners(
  setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, transaction),
);
```

### Simulating transactions

To simulate a transaction on the blockchain, you can use the `simulateTransaction()` function initialized from
`createSolanaClient()`.

```typescript
import { ... } from "gill";

const { simulateTransaction } = createSolanaClient({
  urlOrMoniker: "mainnet",
});

const transaction = createTransaction(...);

const simulation = await simulateTransaction(transaction)
```

The transaction provided to `simulateTransaction()` can either be signed or not.

### Sending and confirming transactions

To send and confirm a transaction to the blockchain, you can use the `sendAndConfirmTransaction` function initialized
from `createSolanaClient()`.

```typescript
import { ... } from "gill";

const { sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "mainnet",
});

const transaction = createTransaction(...);

const signedTransaction = await signTransactionMessageWithSigners(transaction);
const signature: string = getSignatureFromTransaction(signedTransaction);

console.log(getExplorerLink({ transaction: signature }));

// default commitment level of `confirmed`
await sendAndConfirmTransaction(signedTransaction)
```

If you would like more fine grain control over the configuration of the `sendAndConfirmTransaction` functionality, you
can include configuration settings:

```typescript
await sendAndConfirmTransaction(signedTransaction, {
  commitment: "confirmed",
  skipPreflight: true,
  maxRetries: 10n,
  ...
});
```

### Get the signature from a signed transaction

After you have a transaction signed by the `feePayer` (either a partially or fully signed transaction), you can get the
transaction signature as follows:

```typescript
import { getSignatureFromTransaction } from "gill";

const signature: string = getSignatureFromTransaction(signedTransaction);
console.log(signature);
// Example output: 4nzNU7YxPtPsVzeg16oaZvLz4jMPtbAzavDfEFmemHNv93iYXKKYAaqBJzFCwEVxiULqTYYrbjPwQnA1d9ZCTELg
```

> Note: After a transaction has been signed by the fee payer, it will have a transaction signature (aka transaction id).
> This is due to Solana transaction ids are the first item in the transaction's `signatures` array. Therefore, client
> applications can potentially know the signature before it is even sent to the network for confirmation.

### Get a Solana Explorer link for transactions, accounts, or blocks

Craft a Solana Explorer link for transactions, accounts, or blocks on any cluster.

> When no `cluster` is provided in the `getExplorerLink` function, it defaults to `mainnet`.

#### Get a Solana Explorer link for a transaction

To get an explorer link for a transaction's signature (aka transaction id):

```typescript
import { getExplorerLink } from "gill";

const link: string = getExplorerLink({
  transaction: "4nzNU7YxPtPsVzeg16oaZvLz4jMPtbAzavDfEFmemHNv93iYXKKYAaqBJzFCwEVxiULqTYYrbjPwQnA1d9ZCTELg",
});
```

If you have a partially or fully signed transaction, you can get the Explorer link before even sending the transaction
to the network:

```typescript
import {
  getExplorerLink,
  getSignatureFromTransaction
  signTransactionMessageWithSigners,
} from "gill";

const signedTransaction = await signTransactionMessageWithSigners(...);
const link: string = getExplorerLink({
  transaction: getSignatureFromTransaction(signedTransaction),
});
```

#### Get a Solana Explorer link for an account

To get an explorer link for an account on Solana's devnet:

```typescript
import { getExplorerLink } from "gill";

const link: string = getExplorerLink({
  cluster: "devnet",
  account: "nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5",
});
```

To get an explorer link for an account on your local test validator:

```typescript
import { getExplorerLink } from "gill";

const link: string = getExplorerLink({
  cluster: "localnet",
  account: "11111111111111111111111111111111",
});
```

#### Get a Solana Explorer link for a block

To get an explorer link for a block:

```typescript
import { getExplorerLink } from "gill";

const link: string = getExplorerLink({
  cluster: "mainnet",
  block: "242233124",
});
```

### Calculate minimum rent for an account

To calculate the minimum rent balance for an account (aka data storage deposit fee):

```typescript
import { getMinimumBalanceForRentExemption } from "gill";

// when not `space` argument is provided: defaults to `0`
const rent: bigint = getMinimumBalanceForRentExemption();
// Expected value: 890_880n

// same as
// getMinimumBalanceForRentExemption(0);

// same as, but this requires a network call
// const rent = await rpc.getMinimumBalanceForRentExemption(0n).send();
```

```typescript
import { getMinimumBalanceForRentExemption } from "gill";

const rent: bigint = getMinimumBalanceForRentExemption(50 /* 50 bytes */);
// Expected value: 1_238_880n

// same as, but this requires a network call
// const rent = await rpc.getMinimumBalanceForRentExemption(50n).send();
```

> Note: At this time, the minimum rent amount for an account is calculated based on static values in the Solana runtime.
> While you can use the `getMinimumBalanceForRentExemption` RPC call on your
> [connection](#create-a-solana-rpc-connection) to fetch this value, it will result in a network call and subject to
> latency.

## Node specific imports

The `gill` package has specific imports for use in NodeJS server backends and/or serverless environments which have
access to Node specific APIs (like the file system via `node:fs`).

```typescript
import { ... } from "gill/node"
```

### Loading a keypair from a file

```typescript
import { loadKeypairSignerFromFile } from "gill/node";

// default file path: ~/.config/solana/id.json
const signer = await loadKeypairSignerFromFile();
console.log("address:", signer.address);
```

Load a `KeyPairSigner` from a filesystem wallet json file, like those output from the
[Solana CLI](https://solana.com/docs/intro/installation#install-the-solana-cli) (i.e. a JSON array of numbers).

By default, the keypair file loaded is the Solana CLI's default keypair: `~/.config/solana/id.json`

To load a Signer from a specific filepath:

```typescript
import { loadKeypairSignerFromFile } from "gill/node";

const signer = await loadKeypairSignerFromFile("/path/to/your/keypair.json");
console.log("address:", signer.address);
```

### Saving a keypair to a file

> See [`saveKeypairSignerToEnvFile`](#saving-a-keypair-to-an-environment-file) for saving to an env file.

Save an **extractable** `KeyPairSigner` to a local json file (e.g. `keypair.json`).

```typescript
import { ... } from "gill/node";
const extractableSigner = generateExtractableKeyPairSigner();
await saveKeypairSignerToFile(extractableSigner, filePath);
```

See [`loadKeypairSignerFromFile`](#loading-a-keypair-from-a-file) for how to load keypairs from the local filesystem.

### Loading a keypair from an environment variable

Load a `KeyPairSigner` from the bytes stored in the environment process (e.g. `process.env[variableName]`)

```typescript
import { loadKeypairSignerFromEnvironment } from "gill/node";

// loads signer from bytes stored at `process.env[variableName]`
const signer = await loadKeypairSignerFromEnvironment(variableName);
console.log("address:", signer.address);
```

### Saving a keypair to an environment file

Save an **extractable** `KeyPairSigner` to a local environment variable file (e.g. `.env`).

```typescript
import { ... } from "gill/node";
const extractableSigner = generateExtractableKeyPairSigner();
// default: envPath = `.env` (in your current working directory)
await saveKeypairSignerToEnvFile(extractableSigner, variableName, envPath);
```

See [`loadKeypairSignerFromEnvironment`](#loading-a-keypair-from-an-environment-variable) for how to load keypairs from
environment variables.

### Loading a base58 keypair from an environment variable

Load a `KeyPairSigner` from the bytes stored in the environment process (e.g. `process.env[variableName]`)

```typescript
import { loadKeypairSignerFromEnvironmentBase58 } from "gill/node";

// loads signer from base58 keypair stored at `process.env[variableName]`
const signer = await loadKeypairSignerFromEnvironmentBase58(variableName);
console.log("address:", signer.address);
```

## Transaction builders

To simplify the creation of common transactions, gill includes various "transaction builders" to help easily assemble
ready-to-sign transactions for these tasks, which often interact with multiple programs at once.

Since each transaction builder is scoped to a single task, they can easily abstract away various pieces of boilerplate
while also helping to create an optimized transaction, including:

- sets/recommends a default compute unit limit (easily overridable of course) to optimize the transaction and improve
  landing rates
- auto derive required address where needed
- generally recommend safe defaults and fallback settings

All of the auto-filled information can also be manually overriden to ensure you always have escape hatches to achieve
your desired functionality.

As these transaction builders may not be for everyone, gill exposes a related "instruction builder" function for each
which is used under the hood to craft the respective transactions. Developers can also completely forgo these builder
abstractions and manually craft the same functionality.

### Create a token with metadata

Build a transaction that can create a token with metadata, either using the
[original token](https://github.com/solana-program/token) or
[token extensions (token22)](https://github.com/solana-program/token-2022) program.

- Tokens created with the original token program (`TOKEN_PROGRAM_ADDRESS`, default) will use Metaplex's Token Metadata
  program for onchain metadata
- Tokens created with the token extensions program (`TOKEN_2022_PROGRAM_ADDRESS`) will use the metadata pointer
  extensions

Related instruction builder: `getCreateTokenInstructions`

```typescript
import { buildCreateTokenTransaction } from "gill/programs/token";

const createTokenTx = await buildCreateTokenTransaction({
  feePayer: signer,
  latestBlockhash,
  mint,
  // mintAuthority, // default=same as the `feePayer`
  metadata: {
    isMutable: true, // if the `updateAuthority` can change this metadata in the future
    name: "Only Possible On Solana",
    symbol: "OPOS",
    uri: "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/Climate/metadata.json",
  },
  // updateAuthority, // default=same as the `feePayer`
  decimals: 2, // default=9,
  tokenProgram, // default=TOKEN_PROGRAM_ADDRESS, token22 also supported
  // default cu limit set to be optimized, but can be overriden here
  // computeUnitLimit?: number,
  // obtain from your favorite priority fee api
  // computeUnitPrice?: number, // no default set
});
```

### Mint tokens to a destination wallet

Build a transaction that mints new tokens to the `destination` wallet address (raising the token's overall supply).

- ensure you set the correct `tokenProgram` used by the `mint` itself
- if the `destination` owner does not have an associated token account (ata) created for the `mint`, one will be
  auto-created for them
- ensure you take into account the `decimals` for the `mint` when setting the `amount` in this transaction

Related instruction builder: `getMintTokensInstructions`

```typescript
import { buildMintTokensTransaction } from "gill/programs/token";

const mintTokensTx = await buildMintTokensTransaction({
  feePayer: signer,
  latestBlockhash,
  mint,
  mintAuthority: signer,
  amount: 1000, // note: be sure to consider the mint's `decimals` value
  // if decimals=2 => this will mint 10.00 tokens
  // if decimals=4 => this will mint 0.100 tokens
  destination,
  // use the correct token program for the `mint`
  tokenProgram, // default=TOKEN_PROGRAM_ADDRESS
  // default cu limit set to be optimized, but can be overriden here
  // computeUnitLimit?: number,
  // obtain from your favorite priority fee api
  // computeUnitPrice?: number, // no default set
});
```

### Transfer tokens to a destination wallet

Build a transaction that transfers tokens to the `destination` wallet address from the `source` (aka from `sourceAta` to
`destinationAta`).

- ensure you set the correct `tokenProgram` used by the `mint` itself
- if the `destination` owner does not have an associated token account (ata) created for the `mint`, one will be
  auto-created for them
- ensure you take into account the `decimals` for the `mint` when setting the `amount` in this transaction

Related instruction builder: `getTransferTokensInstructions`

```typescript
import { buildTransferTokensTransaction } from "gill/programs/token";

const transferTokensTx = await buildTransferTokensTransaction({
  feePayer: signer,
  latestBlockhash,
  mint,
  authority: signer,
  // sourceAta, // default=derived from the `authority`.
  /**
   * if the `sourceAta` is not derived from the `authority` (like for multi-sig wallets),
   * manually derive with `getAssociatedTokenAccountAddress()`
  */
  amount: 900, // note: be sure to consider the mint's `decimals` value
  // if decimals=2 => this will transfer 9.00 tokens
  // if decimals=4 => this will transfer 0.090 tokens
  destination: address(...),
  // use the correct token program for the `mint`
  tokenProgram, // default=TOKEN_PROGRAM_ADDRESS
  // default cu limit set to be optimized, but can be overriden here
  // computeUnitLimit?: number,
  // obtain from your favorite priority fee api
  // computeUnitPrice?: number, // no default set
});
```

## Debug mode

Within `gill`, you can enable "debug mode" to automatically log additional information that will be helpful in
troubleshooting your transactions.

Debug mode is disabled by default to minimize additional logs for your application. But with its flexible debug
controller, you can enable it from the most common places your code will be run. Including your code itself, NodeJS
backends, serverless functions, and even the in web browser console itself.

Some examples of the existing debug logs that `gill` has sprinkled in:

- log the Solana Explorer link for transactions as you are sending them
- log the base64 transaction string to troubleshoot via
  [`mucho inspect`](https://github.com/solana-developers/mucho?tab=readme-ov-file#inspect) or Solana Explorer's
  [Transaction Inspector](https://explorer.solana.com/tx/inspector)

### How to enable debug mode

To enable debug mode, set any of the following to `true` or `1`:

- `process.env.GILL_DEBUG`
- `global.__GILL_DEBUG__`
- `window.__GILL_DEBUG__` (i.e. in your web browser's console)
- or manually set any debug log level (see below)

To set a desired level of logs to be output in your application, set the value of one of the following (default:
`info`):

- `process.env.GILL_DEBUG_LEVEL`
- `global.__GILL_DEBUG_LEVEL__`
- `window.__GILL_DEBUG_LEVEL__` (i.e. in your web browser's console)

The log levels supported (in order of priority):

- `debug` (lowest)
- `info` (default)
- `warn`
- `error`

### Custom debug logs

Gill also exports the same debug functions it uses internally, allowing you to implement your own debug logic related to
your Solana transactions and use the same controller for it as `gill` does.

- `isDebugEnabled()` - check if debug mode is enabled or not
- `debug()` - print debug message if the set log level is reached

```typescript
import { debug, isDebugEnabled } from "gill";

if (isDebugEnabled()) {
  // your custom logic
}

// log this message if the "info" or above log level is enabled
debug("custom message");

// log this message if the "debug" or above log level is enabled
debug("custom message", "debug");

// log this message if the "warn" or above log level is enabled
debug("custom message", "warn");

// log this message if the "warn" or above log level is enabled
debug("custom message", "warn");
```

## Program clients

With `gill` you can also import some of the most commonly used clients for popular programs. These are also fully
tree-shakable, so if you do not import them inside your project they will be removed by your JavaScript bundler at build
time (i.e. Webpack).

To import any of these program clients:

```typescript
import { ... } from "gill/programs";
import { ... } from "gill/programs/token";
```

> Note: Some client re-exported client program clients have a naming collision. As a result, they may be re-exported
> under a subpath of `gill/programs`. For example, `gill/programs/token`.

The program clients included inside `gill` are:

- System program - re-exported from [`@solana-program/system`](https://github.com/solana-program/system)
- Compute Budget program- re-exported from
  [`@solana-program/compute-budget`](https://github.com/solana-program/compute-budget)
- Memo program - re-exported from [`@solana-program/memo`](https://github.com/solana-program/memo)
- Token Program and Token Extensions program (aka Token22) - re-exported from
  [`@solana-program/token-2022`](https://github.com/solana-program/token-2022), which is a fully backwards compatible
  client with the original Token Program
- Address Lookup Table program - re-exported from
  [`@solana-program/address-lookup-table`](https://github.com/solana-program/address-lookup-table)
- Token Metadata program from Metaplex (only the v3 functionality) - generated via Codama their IDL
  ([source](https://github.com/metaplex-foundation/mpl-token-metadata))

If one of the existing clients are not being exported from `gill/programs` or a subpath therein, you can of course
manually add their compatible client to your repo.

> Note: Since the Token Extensions program client is fully compatible with the original Token Program client, `gill`
> only ships the `@solana-program/token-2022` client and the `TOKEN_PROGRAM_ADDRESS` in order to remove all that
> redundant code from the library.
>
> To use the original Token Program, simply pass the `TOKEN_PROGRAM_ADDRESS` as the the program address for any
> instructions

### Other compatible program clients

From the [solana-program](https://github.com/solana-program/token) GitHub organization, formerly known as the Solana
Program Library (SPL), you can find various other client libraries for specific programs. Install their respective
package to use in conjunction with gill:

- [Stake program](https://github.com/solana-program/stake) - `@solana-program/stake`
- [Vote program](https://github.com/solana-program/vote) - `@solana-program/vote`

### Generate a program client from an IDL

If you want to easily interact with any custom program with this library, you can use
[Codama](https://github.com/codama-idl/codama) to generate a compatible JavaScript/TypeScript client using its IDL. You
can either store the generated client inside your repo or publish it as a NPM package for others to easily consume.
