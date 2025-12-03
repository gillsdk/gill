# gill examples

Gill is aimed at abstracting away many of the complexities and boilerplate
required to perform common interactions with the Solana blockchain, while still
offering the low level "escape hatches" when developers need (or want)
fine-grain control.

Take a look through these examples to see how gill works and even
[how it compares](#comparison-of-gill-vs-solanakit-aka-web3js-v2) to using the
vanilla web3js v2 library.

## Tech stack used

- TypeScript and NodeJS
- Package manger: `pnpm`
- Running the scripts: `esrun`

## Setup locally

1. Clone this repo to your local system
2. Install the packages via `pnpm  install`
3. Change into this directory: `cd examples/get-started`

### Running the included scripts with esrun

Once setup locally, you will be able to run the scripts included within this
repo using `esrun`:

```shell
npx esrun ./scripts/<script>
pnpx esrun ./scripts/<script>
```

> From the [esrun](https://www.npmjs.com/package/esrun) readme:
>
> esrun is a "work out of the box" library to execute Typescript (as well as
> modern Javascript with decorators and stuff) without having to use a bundler.
> This is useful for quick demonstrations or when launching your tests written
> in Typescript.

## Recommended flow to explore this repo

After getting setup locally, we recommend exploring the code of the following
files (in order):

- [`intro.ts`](./src/intro.ts)
- [`airdrop.ts`](./src/airdrop.ts)
- [`tokens.ts`](./src/tokens.ts)
- [`reference-keys.ts`](./src/reference-keys.ts)

#### `intro.ts`

A brief introduction to the `gill` library. Demonstrating and explaining the
commonly used tasks involved to interact with the Solana blockchain, including:

- load a keypair signer from the local filesystem
- create an rpc connection to the blockchain
- creating basic instructions (like the memo instruction)
- getting the latest blockhash
- building a complete transaction
- signing the transaction with the loaded local keypair signer
- getting the signature of a transaction (even before it is sent)
- logging Solana Explorer links
- sending and confirming a transaction

These are all the most basic tasks required for any application sending
transaction to the Solana blockchain.

#### `airdrop.ts`

Demonstrates how to create a client connection to the Solana blockchain on a
test cluster (e.g. `devnet`, `testnet`, or `localnet`) and request airdrops of
testing SOL tokens to a wallet address.

#### `tokens.ts`

Demonstrates how to use gill's "transaction builders" to create a brand new
Solana token (with onchain metadata) and then mint tokens to another user's
wallet:

- load a keypair signer from the local filesystem
- create an rpc connection to the blockchain
- getting the latest blockhash
- build an optimized transaction to create a token
- sign, send, and confirm that "create token" transaction
- build an optimized transaction to mint
- sign, send, and confirm that "mint tokens" transaction

> For more examples interacting with Tokens on Solana, see the
> [token examples examples here](../tokens/README.md)

### `reference-keys.ts`

This script demonstrates the process to add a reference key into a transaction.

> See the gill docs for
> [Reference Keys](https://gillsdk.com/docs/guides/reference-keys) for more
> information.

Adding reference keys to transactions allows developers to be able track the
completion of transactions given to users, without knowing the signature ahead
of time. Then, perform any desired logic after detection of the reference keyed
transaction landing onchain.

Most notably utilized within SolanaPay and Blinks.

## Comparison of gill vs @solana/kit (aka web3js v2)

You can find comparison scripts that demonstrates some of the differences
between [gill](https://github.com/gillsdk/gill) and
[@solana/kit](https://github.com/anza-xyz/kit) (formerly known as "web3.js v2").

> Find a more comprehensive comparison in
> [gill vs @solana/kit comparison docs](https://gillsdk.com/docs/compare/kit)

Both scripts accomplish the same task: send an optimized transaction to the
Solana blockchain.

- Using gill - [`basic.ts`](./src/basic.ts)
- Using web3js v2 - [`basic-compare.ts`](./src/basic-compare.ts)

Both will load a keypair file from your local filesystem (the one used by the
Solana CLI).

Both are written with honest intentions, best practices, and attempt to be as
concise as possible in accomplishing the same task.

You decide which you prefer :)
