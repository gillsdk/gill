/**
 * Merchant Integration Example
 * 
 * This example demonstrates a complete merchant integration with Solana Pay,
 * including payment creation, tracking, and validation.
 */

import { type Address, generateKeyPairSigner, createSolanaRpc, devnet } from "gill";
import {
  createTransferRequestURL,
  parseSolanaPayURL,
  extractReferenceKeys,
  findReference,
  validateTransfer,
} from "gill/node";
import qrcode from "qrcode-terminal";

console.log("🚀 Gill Solana Pay - Merchant Integration Example\n");

// Merchant configuration
const MERCHANT_WALLET = "11111111111111111111111111111112" as Address;
const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));

// Simulate a shopping cart
interface OrderItem {
  id: string;
  name: string;
  price: bigint; // in lamports
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: bigint;
  reference: Address;
  status: "pending" | "paid" | "confirmed" | "failed";
  createdAt: Date;
}

// Sample order
const orderItems: OrderItem[] = [
  { id: "coffee-001", name: "Latte", price: 2000000n, quantity: 1 }, // 0.002 SOL
  { id: "pastry-001", name: "Croissant", price: 1500000n, quantity: 1 }, // 0.0015 SOL
];

const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * BigInt(item.quantity)), 0n);

// Create order with unique reference
const createOrder = async () => {
  const referenceKeypair = await generateKeyPairSigner();
  return {
    id: `ORDER-${Date.now()}`,
    items: orderItems,
    total: orderTotal,
    reference: referenceKeypair.address as Address,
    status: "pending" as const,
    createdAt: new Date(),
  };
};

const order = await createOrder();

console.log("🛒 Order Created:");
console.log(`- Order ID: ${order.id}`);
console.log(`- Items: ${order.items.map(item => `${item.quantity}x ${item.name}`).join(", ")}`);
console.log(`- Total: ${order.total} lamports (${Number(order.total) / 1e9} SOL)`);
console.log(`- Reference: ${order.reference}`);
console.log();

// 1. Create payment request
console.log("💰 Creating Payment Request...");

const paymentURL = await createTransferRequestURL({
  recipient: MERCHANT_WALLET,
  amount: order.total,
  reference: [order.reference],
  label: "Gill Coffee Shop",
  message: `Order ${order.id}: ${order.items.map(item => `${item.quantity}x ${item.name}`).join(", ")}`,
  memo: `Order-${order.id}`,
});

console.log("✅ Payment URL created:");
console.log(paymentURL);
console.log();

// 2. Display QR code for customer
console.log("📱 Payment QR Code (scan with your wallet):");
qrcode.generate(paymentURL, { small: true });

// 3. Simulate payment monitoring
console.log("\n⏳ Monitoring for payment...");
console.log("(In a real application, this would run on your server)");

async function monitorPayment(order: Order): Promise<boolean> {
  console.log(`🔍 Looking for payment with reference: ${order.reference}`);
  
  // In a real application, you would:
  // 1. Store the order and reference in your database
  // 2. Set up a background job to monitor for payments
  // 3. Use webhooks or polling to check for transactions
  
  try {
    // This will throw an error if no transaction is found
    // In a real app, you'd implement retry logic with exponential backoff
    console.log("📡 Searching for transaction on Solana...");
    console.log("(This will timeout after a few seconds since no actual payment was made)");
    
    // Simulate a timeout for demo purposes
    await new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Demo timeout - no payment detected")), 3000);
    });
    
    // If a transaction was found, you would validate it:
    /*
    const signatureInfo = await findReference(connection, order.reference, {
      finality: "confirmed"
    });
    
    console.log(`✅ Transaction found: ${signatureInfo.signature}`);
    
    // Validate the transaction
    await validateTransfer(connection, signatureInfo.signature, {
      recipient: MERCHANT_WALLET,
      amount: order.total,
      reference: order.reference,
    });
    
    console.log("✅ Payment validated!");
    order.status = "confirmed";
    return true;
    */
    
  } catch (error) {
    console.log(`⚠️  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
  
  return false;
}

// 4. Demonstrate payment validation (simulated)
console.log("\n🔐 Payment Validation Process:");
console.log("1. Customer scans QR code with wallet");
console.log("2. Wallet shows payment details for approval");
console.log("3. Customer approves transaction");
console.log("4. Transaction is submitted to Solana");
console.log("5. Merchant monitors for transaction with reference key");
console.log("6. Merchant validates transaction details");
console.log("7. Order is marked as paid and fulfilled");

// 5. Show how to extract and use reference keys
console.log("\n🔑 Reference Key Management:");
const extractedReferences = await extractReferenceKeys(paymentURL);
console.log(`Extracted references: ${extractedReferences.join(", ")}`);

// 6. Best practices demonstration
console.log("\n📋 Best Practices Demonstrated:");
console.log("✅ Unique reference key per order");
console.log("✅ Server-side amount calculation");
console.log("✅ Proper error handling");
console.log("✅ Transaction validation");
console.log("✅ Order status tracking");

// 7. Security considerations
console.log("\n🔒 Security Considerations:");
console.log("- Never trust client-side amount calculations");
console.log("- Always validate transactions server-side");
console.log("- Store reference keys securely in your database");
console.log("- Use HTTPS for all API endpoints");
console.log("- Implement proper retry logic for transaction monitoring");
console.log("- Set appropriate timeouts for payment windows");

// Run the monitoring simulation
monitorPayment(order).then((success) => {
  if (success) {
    console.log("\n🎉 Payment completed successfully!");
    console.log("📦 Order ready for fulfillment");
  } else {
    console.log("\n⏰ Payment monitoring demo completed");
    console.log("💡 In a real application, continue monitoring until payment or timeout");
  }
  
  console.log("\n✨ Merchant Integration Example completed!");
  console.log("\n📚 Next steps:");
  console.log("1. Integrate this flow into your e-commerce platform");
  console.log("2. Set up proper database storage for orders and references");
  console.log("3. Implement background jobs for payment monitoring");
  console.log("4. Add webhook endpoints for real-time notifications");
  console.log("5. Test with real payments on devnet");
}); 