# gill-nextjs-codama-example

This is a Next.js based solana dapp example containing:

- Pinocchio solana program
- Tailwind CSS setup for styling
- Useful wallet UI elements setup using [Gill](https://www.gillsdk.com/)

## Getting Started

### Installation

### Generate IDL using shank cli

```shell
shank idl --out-dir ./target/idl --crate-root ./

```

### Generate codama typescript helpers

```shell
npm run generate:js
```

### Install Dependencies

```shell
npm install
```

### Start the web app

```shell
npm dev
```
