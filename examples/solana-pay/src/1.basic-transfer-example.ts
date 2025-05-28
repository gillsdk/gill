/**
 * Basic Transfer Request Example
 * 
 * This example demonstrates how to create Solana Pay transfer request URLs
 * for both SOL and SPL token transfers using Gill.
 */

import { type Address, generateKeyPairSigner } from "gill";
import {
  createTransferRequestURL,
  parseSolanaPayURL,
  validateSolanaPayURL,
  toQRCodeURL,
  extractReferenceKeys,
} from "gill/node";
import qrcode from "qrcode-terminal";

async function main() {
  console.log("🚀 Gill Solana Pay - Basic Transfer Example\n");

  // Example addresses (replace with real addresses for actual use)
  const merchantWallet = "11111111111111111111111111111112" as Address;
  const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address; // USDC on mainnet

  // Generate a unique reference key for this payment
  const referenceKeypair = await generateKeyPairSigner();
  const referenceKey = referenceKeypair.address as Address;

  console.log("📝 Creating SOL Transfer Request...");

  // 1. Create a basic SOL transfer request
  const solTransferURL = await createTransferRequestURL({
    recipient: merchantWallet,
    amount: 1000000n, // 0.001 SOL in lamports
    reference: [referenceKey],
    label: "Gill Coffee Shop",
    message: "Payment for 1x Latte ☕",
    memo: "Order #12345"
  });

  console.log("✅ SOL Transfer URL created:");
  console.log(solTransferURL);
  console.log();

  // 2. Create an SPL token (USDC) transfer request
  console.log("📝 Creating USDC Transfer Request...");

  const usdcTransferURL = await createTransferRequestURL({
    recipient: merchantWallet,
    amount: 5000000n, // 5 USDC (6 decimals)
    splToken: usdcMint,
    reference: [referenceKey],
    label: "Gill Coffee Shop",
    message: "Payment for 1x Premium Coffee ☕",
    memo: "Order #12346"
  });

  console.log("✅ USDC Transfer URL created:");
  console.log(usdcTransferURL);
  console.log();

  // 3. Validate the URLs
  console.log("🔍 Validating URLs...");
  console.log(`SOL URL valid: ${await validateSolanaPayURL(solTransferURL)}`);
  console.log(`USDC URL valid: ${await validateSolanaPayURL(usdcTransferURL)}`);
  console.log();

  // 4. Parse the URLs to extract information
  console.log("📖 Parsing SOL Transfer URL...");
  const solParsed = await parseSolanaPayURL(solTransferURL);

  if (solParsed.type === "transfer") {
    console.log("- Type: Transfer Request");
    console.log(`- Recipient: ${solParsed.params.recipient}`);
    console.log(`- Amount: ${solParsed.params.amount} lamports`);
    console.log(`- Label: ${solParsed.params.label}`);
    console.log(`- Message: ${solParsed.params.message}`);
    console.log(`- Memo: ${solParsed.params.memo}`);
    console.log(`- References: ${solParsed.params.reference?.length || 0}`);
  }
  console.log();

  console.log("📖 Parsing USDC Transfer URL...");
  const usdcParsed = await parseSolanaPayURL(usdcTransferURL);

  if (usdcParsed.type === "transfer") {
    console.log("- Type: Transfer Request");
    console.log(`- Recipient: ${usdcParsed.params.recipient}`);
    console.log(`- Amount: ${usdcParsed.params.amount} tokens`);
    console.log(`- SPL Token: ${usdcParsed.params.splToken}`);
    console.log(`- Label: ${usdcParsed.params.label}`);
    console.log(`- Message: ${usdcParsed.params.message}`);
    console.log(`- Memo: ${usdcParsed.params.memo}`);
  }
  console.log();

  // 5. Extract reference keys
  console.log("🔑 Extracting reference keys...");
  const solReferences = await extractReferenceKeys(solTransferURL);
  const usdcReferences = await extractReferenceKeys(usdcTransferURL);

  console.log(`SOL Transfer references: ${solReferences.join(", ")}`);
  console.log(`USDC Transfer references: ${usdcReferences.join(", ")}`);
  console.log();

  // 6. Generate QR codes
  console.log("📱 Generating QR codes...");

  console.log("\n🔲 SOL Transfer QR Code:");
  qrcode.generate(await toQRCodeURL(solTransferURL), { small: true });

  console.log("\n🔲 USDC Transfer QR Code:");
  qrcode.generate(await toQRCodeURL(usdcTransferURL), { small: true });

  console.log("\n✨ Example completed!");
  console.log("\n💡 Next steps:");
  console.log("1. Scan the QR codes with a Solana wallet (Phantom, Solflare, etc.)");
  console.log("2. The wallet will show the payment details");
  console.log("3. Approve the transaction to complete the payment");
  console.log("4. Use the reference key to track the payment on-chain");

  console.log(`\n🔑 Reference Key for tracking: ${referenceKey}`);
  console.log("📚 Learn more: https://docs.solanapay.com/");
}

main().catch(console.error); 