/**
 * Transaction Request Example
 * 
 * This example demonstrates how to create Solana Pay transaction request URLs
 * for interactive payments that require server communication.
 */

import { type Address, SolanaPayError } from "gill";
import {
  createTransactionRequestURL,
  parseSolanaPayURL,
  validateSolanaPayURL,
  toQRCodeURL,
} from "gill/node";
import qrcode from "qrcode-terminal";

async function main() {
  console.log("🚀 Gill Solana Pay - Transaction Request Example\n");

  console.log("📝 Creating Transaction Request URLs...");

  // 1. Basic transaction request
  const basicTransactionURL = await createTransactionRequestURL({
    link: "https://merchant.example.com/api/solana-pay"
  });

  console.log("✅ Basic Transaction URL created:");
  console.log(basicTransactionURL);
  console.log();

  // 2. Transaction request with query parameters
  const parameterizedTransactionURL = await createTransactionRequestURL({
    link: "https://merchant.example.com/api/solana-pay?session=abc123&order=456"
  });

  console.log("✅ Parameterized Transaction URL created:");
  console.log(parameterizedTransactionURL);
  console.log();

  // 3. Validate the URLs
  console.log("🔍 Validating URLs...");
  console.log(`Basic URL valid: ${await validateSolanaPayURL(basicTransactionURL)}`);
  console.log(`Parameterized URL valid: ${await validateSolanaPayURL(parameterizedTransactionURL)}`);
  console.log();

  // 4. Parse the URLs
  console.log("📖 Parsing Transaction URLs...");

  const basicParsed = await parseSolanaPayURL(basicTransactionURL);
  if (basicParsed.type === "transaction") {
    console.log("Basic Transaction Request:");
    console.log(`- Type: ${basicParsed.type}`);
    console.log(`- Link: ${basicParsed.params.link}`);
  }
  console.log();

  const parameterizedParsed = await parseSolanaPayURL(parameterizedTransactionURL);
  if (parameterizedParsed.type === "transaction") {
    console.log("Parameterized Transaction Request:");
    console.log(`- Type: ${parameterizedParsed.type}`);
    console.log(`- Link: ${parameterizedParsed.params.link}`);
  }
  console.log();

  // 5. Generate QR codes
  console.log("📱 Generating QR codes...");

  console.log("\n🔲 Basic Transaction QR Code:");
  qrcode.generate(await toQRCodeURL(basicTransactionURL), { small: true });

  console.log("\n🔲 Parameterized Transaction QR Code:");
  qrcode.generate(await toQRCodeURL(parameterizedTransactionURL), { small: true });

  // 6. Error handling example
  console.log("\n🚨 Error Handling Example...");

  try {
    // This should fail because HTTP is not allowed
    await createTransactionRequestURL({
      link: "http://insecure.example.com/api/solana-pay"
    });
  } catch (error) {
    console.log("✅ Correctly caught error for HTTP URL:");
    console.log(`- Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log("\n✨ Example completed!");
  console.log("\n💡 Transaction Request Flow:");
  console.log("1. Wallet scans QR code or clicks link");
  console.log("2. Wallet makes GET request to the link for transaction details");
  console.log("3. Server responds with label and icon");
  console.log("4. Wallet makes POST request with user's account address");
  console.log("5. Server responds with base64-encoded transaction to sign");
  console.log("6. User reviews and signs the transaction");

  console.log("\n📚 Learn more: https://docs.solanapay.com/core/transaction-request/");
}

main().catch(console.error); 