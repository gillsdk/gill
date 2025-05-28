/**
 * Full Payment Flow Example
 * 
 * This example demonstrates a complete end-to-end Solana Pay flow,
 * combining merchant and wallet perspectives in a single demonstration.
 */

import { type Address, generateKeyPairSigner } from "gill";
import {
  createTransferRequestURL,
  createTransactionRequestURL,
  parseSolanaPayURL,
  validateSolanaPayURL,
  extractReferenceKeys,
} from "gill/node";
import qrcode from "qrcode-terminal";

async function main() {
  console.log("🚀 Gill Solana Pay - Full Payment Flow Example\n");

  // Configuration
  const MERCHANT_WALLET = "11111111111111111111111111111112" as Address;
  const CUSTOMER_WALLET = "22222222222222222222222222222223" as Address;

  console.log("🏪 Setting up merchant and customer...");
  console.log(`Merchant wallet: ${MERCHANT_WALLET}`);
  console.log(`Customer wallet: ${CUSTOMER_WALLET}`);
  console.log();

  // Scenario 1: Simple SOL Transfer Payment
  console.log("=" .repeat(60));
  console.log("📱 SCENARIO 1: Simple SOL Transfer Payment");
  console.log("=" .repeat(60));

  await demonstrateTransferFlow();

  // Scenario 2: Interactive Transaction Request
  console.log("\n" + "=" .repeat(60));
  console.log("🔗 SCENARIO 2: Interactive Transaction Request");
  console.log("=" .repeat(60));

  await demonstrateTransactionFlow();

  // Scenario 3: Error Handling
  console.log("\n" + "=" .repeat(60));
  console.log("🚨 SCENARIO 3: Error Handling");
  console.log("=" .repeat(60));

  await demonstrateErrorHandling();

  console.log("\n✨ Full Payment Flow Example completed!");

  console.log("\n📋 Summary of demonstrated features:");
  console.log("✅ Transfer request creation and processing");
  console.log("✅ Transaction request creation and processing");
  console.log("✅ URL validation and parsing");
  console.log("✅ QR code generation");
  console.log("✅ Reference key extraction and tracking");
  console.log("✅ Error handling for various scenarios");
  console.log("✅ Complete merchant-to-customer flow");

  console.log("\n🎯 Key takeaways:");
  console.log("1. Always validate URLs before processing");
  console.log("2. Use reference keys for payment tracking");
  console.log("3. Implement proper error handling");
  console.log("4. Follow the complete request/response flow");
  console.log("5. Provide clear user interfaces");
  console.log("6. Validate all transactions server-side");

  console.log("\n📚 Next steps:");
  console.log("- Integrate into your application");
  console.log("- Test with real wallets on devnet");
  console.log("- Implement proper database storage");
  console.log("- Add webhook notifications");
  console.log("- Deploy to production with mainnet");

  console.log("\n🔗 Resources:");
  console.log("- Solana Pay Docs: https://docs.solanapay.com/");
  console.log("- Gill Documentation: https://github.com/solana-foundation/gill");
  console.log("- Solana Developer Resources: https://solana.com/developers");
}

/**
 * Demonstrate a complete transfer request flow
 */
async function demonstrateTransferFlow() {
  console.log("\n🏪 MERCHANT: Creating payment request...");
  
  // Generate unique reference for this payment
  const referenceKeypair = await generateKeyPairSigner();
  const reference = referenceKeypair.address as Address;
  
  // Merchant creates payment request
  const paymentURL = await createTransferRequestURL({
    recipient: "11111111111111111111111111111112" as Address,
    amount: 5000000n, // 0.005 SOL
    reference: [reference],
    label: "Gill Coffee Shop",
    message: "Premium Latte + Croissant",
    memo: `Order-${Date.now()}`
  });
  
  console.log("✅ Payment URL created:");
  console.log(paymentURL);
  
  // Show QR code
  console.log("\n📱 QR Code for customer:");
  qrcode.generate(paymentURL, { small: true });
  
  console.log("\n📱 CUSTOMER: Wallet processing payment...");
  
  // Customer's wallet validates and parses the URL
  const isValid = await validateSolanaPayURL(paymentURL);
  console.log(`✅ URL validation: ${isValid}`);
  
  if (isValid) {
    const parsed = await parseSolanaPayURL(paymentURL);
    
    if (parsed.type === "transfer") {
      console.log("\n💸 Payment details shown to customer:");
      console.log(`- To: ${parsed.params.recipient}`);
      console.log(`- Amount: ${parsed.params.amount} lamports (${Number(parsed.params.amount!) / 1e9} SOL)`);
      console.log(`- From: ${parsed.params.label}`);
      console.log(`- For: ${parsed.params.message}`);
      console.log(`- Memo: ${parsed.params.memo}`);
      
      // Extract reference for tracking
      const references = await extractReferenceKeys(paymentURL);
      console.log(`- Reference: ${references[0]}`);
      
      console.log("\n🔄 Customer approves payment...");
      console.log("✅ Transaction would be created and signed");
      console.log("✅ Transaction would be submitted to Solana");
      
      console.log("\n🏪 MERCHANT: Monitoring for payment...");
      console.log(`🔍 Watching for transactions with reference: ${references[0]}`);
      console.log("⏳ In a real app, this would poll the blockchain");
      console.log("✅ Payment detected and validated");
      console.log("📦 Order fulfilled");
    }
  }
}

/**
 * Demonstrate a complete transaction request flow
 */
async function demonstrateTransactionFlow() {
  console.log("\n🏪 MERCHANT: Setting up interactive payment...");
  
  // Merchant creates transaction request URL
  const transactionURL = await createTransactionRequestURL({
    link: "https://merchant.example.com/api/solana-pay?order=12345"
  });
  
  console.log("✅ Transaction URL created:");
  console.log(transactionURL);
  
  // Show QR code
  console.log("\n📱 QR Code for customer:");
  qrcode.generate(transactionURL, { small: true });
  
  console.log("\n📱 CUSTOMER: Wallet processing transaction request...");
  
  // Customer's wallet validates and parses
  const isValid = await validateSolanaPayURL(transactionURL);
  console.log(`✅ URL validation: ${isValid}`);
  
  if (isValid) {
    const parsed = await parseSolanaPayURL(transactionURL);
    
    if (parsed.type === "transaction") {
      console.log(`\n🔗 Transaction request endpoint: ${parsed.params.link}`);
      
      // Simulate wallet making GET request
      console.log("\n📡 WALLET: Making GET request to merchant...");
      const getResponse = await simulateGetRequest(parsed.params.link);
      console.log("✅ Merchant info received:");
      console.log(`- Label: ${getResponse.label}`);
      console.log(`- Icon: ${getResponse.icon}`);
      
      console.log("\n🔄 Customer reviews merchant info and approves...");
      
      // Simulate wallet making POST request
      console.log("\n📡 WALLET: Making POST request with customer wallet...");
      const postResponse = await simulatePostRequest(parsed.params.link, "22222222222222222222222222222223" as Address);
      console.log("✅ Transaction received from merchant:");
      console.log(`- Transaction: ${postResponse.transaction.substring(0, 50)}...`);
      console.log(`- Message: ${postResponse.message}`);
      
      console.log("\n🔄 Customer reviews transaction details...");
      console.log("✅ Transaction would be decoded and displayed");
      console.log("✅ Customer would approve and sign");
      console.log("✅ Transaction would be submitted to Solana");
      
      console.log("\n🏪 MERCHANT: Transaction completed");
      console.log("📦 Order fulfilled");
    }
  }
}

/**
 * Demonstrate error handling scenarios
 */
async function demonstrateErrorHandling() {
  console.log("\n🚨 Testing various error scenarios...");
  
  // Test 1: Invalid URL scheme
  console.log("\n1. Invalid URL scheme:");
  const invalidScheme = "bitcoin:invalid-scheme";
  console.log(`URL: ${invalidScheme}`);
  console.log(`Valid: ${await validateSolanaPayURL(invalidScheme)}`);
  
  // Test 2: HTTP instead of HTTPS for transaction request
  console.log("\n2. HTTP instead of HTTPS:");
  try {
    await createTransactionRequestURL({
      link: "http://insecure.example.com/api"
    });
  } catch (error) {
    console.log(`✅ Correctly caught error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Test 3: Malformed Solana Pay URL
  console.log("\n3. Malformed URL:");
  const malformedURL = "solana:invalid-address?amount=not-a-number";
  console.log(`URL: ${malformedURL}`);
  try {
    await parseSolanaPayURL(malformedURL);
  } catch (error) {
    console.log(`✅ Correctly caught parsing error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Test 4: Missing required parameters
  console.log("\n4. URL with missing recipient:");
  const missingRecipient = "solana:?amount=1000000";
  console.log(`URL: ${missingRecipient}`);
  console.log(`Valid: ${await validateSolanaPayURL(missingRecipient)}`);
  
  console.log("\n✅ Error handling demonstration completed");
}

/**
 * Simulate merchant GET request response
 */
async function simulateGetRequest(url: string) {
  console.log(`GET ${url}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    label: "Gill Coffee Shop",
    icon: "https://gill-coffee.example.com/icon.png"
  };
}

/**
 * Simulate merchant POST request response
 */
async function simulatePostRequest(url: string, account: string) {
  console.log(`POST ${url}`);
  console.log(`Body: { "account": "${account}" }`);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    transaction: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDArczbMia1tLmq7zz4DinMNN0pJ1JtLdqIJPUw3YrGCzYAMHBsgN27lcgB6H2WQvFgyZuJYHa46puOQo9yQ8CVQbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCp20C7Wj2aiuk5TReAXo+VTVg8QTHjs0UjNMMKCvpzZ+ABAgEBARU=",
    message: "Payment for premium coffee order"
  };
}

main().catch(console.error); 