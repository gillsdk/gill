/**
 * Wallet Integration Example
 * 
 * This example demonstrates how a wallet application would handle
 * Solana Pay URLs, including parsing, validation, and user interaction.
 */

import type {
  GillSolanaPayData,
  TransactionRequestGetResponse,
  TransactionRequestPostRequest,
  TransactionRequestPostResponse,
} from "gill";
import {
  parseSolanaPayURL,
  validateSolanaPayURL,
  extractReferenceKeys,
} from "gill/node";

console.log("🚀 Gill Solana Pay - Wallet Integration Example\n");

// Sample Solana Pay URLs that a wallet might encounter
const sampleURLs = [
  // SOL transfer
  "solana:11111111111111111111111111111112?amount=1000000&label=Coffee%20Shop&message=Thanks%20for%20your%20purchase!",
  
  // USDC transfer with reference
  "solana:11111111111111111111111111111112?amount=5000000&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&reference=22222222222222222222222222222223&label=Premium%20Coffee&message=Order%20%23123",
  
  // Transaction request
  "solana:https://merchant.example.com/api/solana-pay?session=abc123",
  
  // Invalid URL for error handling
  "bitcoin:invalid-url"
];

console.log("📱 Wallet Processing Solana Pay URLs...\n");

// Simulate wallet processing each URL
async function processURLs() {
  for (let i = 0; i < sampleURLs.length; i++) {
    const url = sampleURLs[i];
    console.log(`🔗 Processing URL ${i + 1}:`);
    console.log(url);
    console.log();
    
    // Step 1: Validate the URL
    const isValid = await validateSolanaPayURL(url);
    console.log(`✅ URL Valid: ${isValid}`);
    
    if (!isValid) {
      console.log("❌ Invalid Solana Pay URL - wallet would show error");
      console.log("---".repeat(20));
      console.log();
      continue;
    }
    
    try {
      // Step 2: Parse the URL
      const parsed = await parseSolanaPayURL(url);
      console.log(`📋 Request Type: ${parsed.type}`);
      
      if (parsed.type === "transfer") {
        await handleTransferRequest(parsed);
      } else {
        await handleTransactionRequest(parsed);
      }
      
    } catch (error) {
      console.log(`❌ Error processing URL: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log("---".repeat(20));
    console.log();
  }
}

/**
 * Handle transfer request (non-interactive)
 */
async function handleTransferRequest(data: Extract<GillSolanaPayData, { type: "transfer" }>) {
  console.log("💸 Transfer Request Details:");
  console.log(`- Recipient: ${data.params.recipient}`);
  console.log(`- Amount: ${data.params.amount || "User will specify"}`);
  console.log(`- Token: ${data.params.splToken || "SOL (native)"}`);
  console.log(`- Label: ${data.params.label || "N/A"}`);
  console.log(`- Message: ${data.params.message || "N/A"}`);
  console.log(`- Memo: ${data.params.memo || "N/A"}`);
  
  // Extract reference keys for tracking
  const references = data.params.reference || [];
  console.log(`- References: ${references.length > 0 ? references.join(", ") : "None"}`);
  
  // Simulate wallet UI flow
  console.log("\n🔄 Wallet Processing:");
  console.log("1. ✅ Display payment details to user");
  console.log("2. ✅ Show amount, recipient, and message");
  console.log("3. ✅ Request user confirmation");
  console.log("4. ⏳ User would approve/reject transaction");
  console.log("5. ⏳ Create and sign transaction");
  console.log("6. ⏳ Submit to Solana network");
  console.log("7. ⏳ Show transaction status to user");
  
  // Security checks a wallet should perform
  console.log("\n🔒 Security Checks:");
  console.log("✅ Verify recipient address format");
  console.log("✅ Check if amount is reasonable");
  console.log("✅ Validate SPL token mint (if applicable)");
  console.log("✅ Warn user about large amounts");
  console.log("✅ Show clear transaction summary");
}

/**
 * Handle transaction request (interactive)
 */
async function handleTransactionRequest(data: Extract<GillSolanaPayData, { type: "transaction" }>) {
  console.log("🔗 Transaction Request Details:");
  console.log(`- Endpoint: ${data.params.link}`);
  
  // Simulate wallet making GET request to merchant
  console.log("\n📡 Making GET request to merchant...");
  
  try {
    const getResponse = await simulateMerchantGetRequest(data.params.link);
    console.log("✅ GET Response received:");
    console.log(`- Label: ${getResponse.label}`);
    console.log(`- Icon: ${getResponse.icon}`);
    
    // Simulate wallet UI showing merchant info
    console.log("\n🔄 Wallet Processing:");
    console.log("1. ✅ Display merchant information to user");
    console.log("2. ✅ Show label and icon from merchant");
    console.log("3. ✅ Request user confirmation to proceed");
    console.log("4. ⏳ User would approve/reject request");
    
    // If user approves, make POST request
    console.log("\n📡 Making POST request to merchant...");
    const userWallet = "UserWalletAddressHere123456789"; // Would be actual user's wallet
    
    const postResponse = await simulateMerchantPostRequest(data.params.link, userWallet);
    console.log("✅ POST Response received:");
    console.log(`- Transaction: ${postResponse.transaction.substring(0, 50)}...`);
    console.log(`- Message: ${postResponse.message || "N/A"}`);
    
    console.log("\n🔄 Final Steps:");
    console.log("5. ✅ Decode base64 transaction");
    console.log("6. ✅ Display transaction details to user");
    console.log("7. ✅ Request final confirmation");
    console.log("8. ⏳ User would sign and submit transaction");
    
  } catch (error) {
    console.log(`❌ Error communicating with merchant: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Security checks for transaction requests
  console.log("\n🔒 Security Checks:");
  console.log("✅ Verify HTTPS endpoint");
  console.log("✅ Validate merchant response format");
  console.log("✅ Decode and inspect transaction before signing");
  console.log("✅ Show clear transaction summary");
  console.log("✅ Warn about unknown or suspicious transactions");
}

/**
 * Simulate merchant GET request response
 */
async function simulateMerchantGetRequest(url: string): Promise<TransactionRequestGetResponse> {
  // In a real wallet, this would be an actual HTTP GET request
  console.log(`GET ${url}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    label: "Gill Coffee Shop",
    icon: "https://example.com/icon.png"
  };
}

/**
 * Simulate merchant POST request response
 */
async function simulateMerchantPostRequest(url: string, account: string): Promise<TransactionRequestPostResponse> {
  // In a real wallet, this would be an actual HTTP POST request
  console.log(`POST ${url}`);
  console.log(`Body: { "account": "${account}" }`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    transaction: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDArczbMia1tLmq7zz4DinMNN0pJ1JtLdqIJPUw3YrGCzYAMHBsgN27lcgB6H2WQvFgyZuJYHa46puOQo9yQ8CVQbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCp20C7Wj2aiuk5TReAXo+VTVg8QTHjs0UjNMMKCvpzZ+ABAgEBARU=",
    message: "Payment for coffee order #123"
  };
}

async function main() {
  await processURLs();
  
  console.log("✨ Wallet Integration Example completed!");
  console.log("\n💡 Key Wallet Responsibilities:");
  console.log("1. Validate Solana Pay URLs before processing");
  console.log("2. Parse URLs and extract payment/transaction details");
  console.log("3. Display clear information to users");
  console.log("4. Handle both transfer and transaction requests");
  console.log("5. Implement proper security checks");
  console.log("6. Provide clear user confirmation flows");
  console.log("7. Handle errors gracefully");

  console.log("\n📚 Learn more: https://docs.solanapay.com/core/transfer-request/wallet-integration");
}

main().catch(console.error); 