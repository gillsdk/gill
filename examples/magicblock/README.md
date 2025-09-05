# Gill + MagicBlock Example

This example demonstrates how to use [Gill](https://gillsdk.com) together with [MagicBlock Ephemeral Rollups](https://docs.magicblock.gg).  
It shows how to:

- Initialize a new Counter PDA
- Increment the counter on Solana
- Delegate the counter PDA to a MagicBlock ephemeral rollup
- Increment and commit the counter on MagicBlock
- Fetch the updated counter state
- Undelegate the counter PDA

---

## Tech stack used

- TypeScript and NodeJS
- Package manager: `pnpm`
- Running the scripts: `tsx`
- [Codama: For generating program client using idl](https://github.com/codama-idl/codama)

---

## Setup locally

1. Clone the Gill repo:

   ```bash
   git clone https://github.com/gillsdk/gill.git
   cd gill
   ```
2. Install the packages via `pnpm  install`
3. Change into this directory: `cd examples/magicblock`
4. Generate the program client with Codama: `pnpm codama run js`

### About Codama
If you are thinking about creating a project using Codama + Gill, here's what you need to know to get Codama setup from scratch. 
> If want to dive straight into the example, you can skip this section as most of it has already been done for you.

1. Install Codama using anyone of the following commands
```shell
npm install codama
pnpm install codama
```
2. Add your idl to the project e.g. in `idl/anchor_counter.idl`
3. Run: `pnpm codama init --gill`
4. Follow the prompts, and if a codama.js (for JavaScript clients) appears, you're good to go.
5. Finally run `pnpm codama run js`
> Again, if you're just here for the example this can be skipped as it has already been run in the previous section.

### Running the included scripts with tsx

Once setup locally, you will be able to run the scripts included within this repo using `tsx`:

```bash
npx tsx ./src/<script>
pnpx tsx ./src/<script>
```