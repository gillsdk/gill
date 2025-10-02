<h1 align="center">
  gill sdk
</h1>

<p align="center">
  javascript/typescript client library for interacting with the Solana blockchain
</p>

<p align="center">
  <a href="https://github.com/gillsdk/gill/actions/workflows/publish-packages.yml"><img src="https://img.shields.io/github/actions/workflow/status/gillsdk/gill/publish-packages.yml?logo=GitHub&label=tests" /></a>
  <a href="https://www.npmjs.com/package/gill"><img src="https://img.shields.io/npm/v/gill?logo=npm&color=377CC0" /></a>
  <a href="https://www.npmjs.com/package/gill"><img src="https://img.shields.io/npm/dm/gill?color=377CC0" /></a>
</p>

<p align="center">
  <img width="600" alt="gill" src="https://raw.githubusercontent.com/gillsdk/gill/refs/heads/master/docs/public/cover.png" />
</p>

## Overview

Welcome to the gill sdk, a JavaScript/TypeScript client library for interacting with the [Solana](http://solana.com/)
blockchain. You can use it to build Solana apps in Node, web, React Native, or just about any other JavaScript
environment.

Gill is built on top of the modern javascript libraries for Solana built by Anza called
[@solana/kit](https://github.com/anza-xyz/kit) (formerly known as "web3.js v2"). By utilizing the same types and
functions under the hood, `gill` is compatible with `kit`. See [Replacing Kit with gill](#replace-kit-with-gill).

> For a comparison of using gill vs `@solana/kit`, take a look at the
> [gill vs @solana/kit comparison docs](https://gillsdk.com/docs/compare/kit) and the
> [comparison examples](https://github.com/gillsdk/gill/tree/master/examples/get-started#comparison-of-gill-vs-solanakit-aka-web3js-v2).

## Documentation

You can find the gill library docs here:

- [gill docs site](https://gillsdk.com)
- [gill setup guide](https://gillsdk.com/docs#quick-start)
- [gill API references](https://gillsdk.com/api)

## Packages

The following packages are published from within this repo, collectively known as the "gill sdk":

| Package               | Description                                   | Version                                                                                                                                 | Source                                                                    |
| :-------------------- | :-------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `gill`                | SDK for building on the Solana blockchain     | [![npm](https://img.shields.io/npm/v/gill.svg?logo=npm&color=377CC0)](https://www.npmjs.com/package/gill)                               | [Source](https://github.com/gillsdk/gill/tree/master/packages/gill)       |
| `@gillsdk/react`      | React hooks library for the Solana blockchain | [![npm](https://img.shields.io/npm/v/@gillsdk/react.svg?logo=npm&color=377CC0)](https://www.npmjs.com/package/@gillsdk/react)           | [Source](https://github.com/gillsdk/gill/tree/master/packages/react)      |
| `@gillsdk/solana-pay` | Modern Solana Pay protocol client library     | [![npm](https://img.shields.io/npm/v/@gillsdk/solana-pay.svg?logo=npm&color=377CC0)](https://www.npmjs.com/package/@gillsdk/solana-pay) | [Source](https://github.com/gillsdk/gill/tree/master/packages/solana-pay) |

## Development

### Environment setup

1. Install [NodeJS](https://nodejs.org/en)
2. Install [pnpm](https://pnpm.io/installation)

Clone and prepare this repo locally:

```shell
git clone https://github.com/gillsdk/gill.git
cd gill
pnpm install
```

### Build

To build all the packages in parallel (via Turborepo):

```shell
pnpm build
```

> Note: You must run the build command the first time manually before running the test commands detailed below.

To build a specific package, use the `--filter` flag:

```shell
pnpm build --filter=gill
pnpm build --filter=@gillsdk/react
# or multiple specific packages
pnpm build --filter=gill --filter=@gillsdk/react
```

### Testing

All unit tests can be run at the same time (including rebuilding):

```shell
pnpm test
```

> Note: You must run the build command the first time manually before running the `test` command.

## Contributing

Contributions are welcome and loved! Please [open an issue](https://github.com/gillsdk/gill/issues/new) before working
on specific code changes to ensure it is within scope and desire for this library.

See the [CONTRIBUTING.md](./CONTRIBUTING.md) document for full details.

Seriously. Read (and follow) this document if you want to contribute.

## Maintainers

See the [MAINTAINERS.md](./MAINTAINERS.md) document for full details.
