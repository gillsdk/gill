# Anchor Escrow Example (Codama + Gill + Next.js)

This project demonstrates how to build and interact with an **Anchor-based Escrow program** using:

- **Anchor** → Solana smart contract framework IDL  
- **Codama** → IDL + client SDK code generation  
- **Next.js** → Frontend dApp (bootstrapped with `create-solana-dapp`)  

It serves as a **reference project** for developers who want to combine Anchor, Codama, and SPL tokens in a full-stack workflow.  


## Getting Started

### Installation

#### Install Dependencies

```shell
pnpm install
```
#### IDL setup

Update the IDL at
```shell
/scripts/idl/anchor_escrow_idl.json
```


#### Run the generation script:

```shell
pnpm generate
```
Generated code >>> src/generated

#### Start the web app

```shell
pnpm dev
```

---

Notes

If the IDL changes, always update scripts/idl/anchor_escrow_idl.json and re-run pnpm generate.