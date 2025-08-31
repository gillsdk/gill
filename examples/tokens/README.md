# gill examples - tokens

Gill is aimed at abstracting away many of the complexities and boilerplate required to perform
common interactions with the Solana blockchain, while still offering the low level "escape hatches"
when developers need (or want) fine-grain control.

Take a look through these examples to see how gill works and even
[how it compares](../get-started/README.md#comparison-of-gill-vs-solanakit-aka-web3js-v2) to using
the vanilla web3js v2 library.

## Tech stack used

- TypeScript and NodeJS
- Package manger: `pnpm`
- Running the scripts: `esrun`

## Setup locally

1. Clone this repo to your local system
2. Install the packages via `pnpm  install`
3. Change into this directory: `cd examples/tokens`

### Running the included scripts with esrun

Once setup locally, you will be able to run the scripts included within this repo using `esrun`:

```shell
npx esrun ./src/<script>
pnpx esrun ./src/<script>
```

> From the [esrun](https://www.npmjs.com/package/esrun) readme:
>
> esrun is a "work out of the box" library to execute Typescript (as well as modern Javascript with
> decorators and stuff) without having to use a bundler. This is useful for quick demonstrations or
> when launching your tests written in Typescript.

## Recommended flow to explore this repo

After getting setup locally, we recommend exploring the code of the following files (in order):

- [`1.intro.ts`](./src/1.intro.ts)
- [`2.create-token-mint.ts`](./src/2.create-token-mint.ts)
- [`3.create-token-mint-builder.ts`](./src/3.create-token-mint-builder.ts)
- [`4.mint-tokens.ts`](./src/4.mint-tokens.ts)
- [`5.mint-tokens-builder.ts`](./src/5.mint-tokens-builder.ts)
- [`6.transfer-tokens.ts`](./src/6.transfer-tokens.ts)
- [`7.transfer-tokens-builder.ts`](./src/7.transfer-tokens-builder.ts)
