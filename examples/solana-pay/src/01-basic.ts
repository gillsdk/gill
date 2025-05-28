import { type Address } from "gill";
import qrcode from "qrcode-terminal";

const MERCHANT = "11111111111111111111111111111112" as Address;
const REFERENCE = "11111111111111111111111111111113" as Address;

async function main() {
  console.log("🚀 Basic Solana Pay Example\n");

  try {
    const {
      createTransferRequestURL,
      createTransactionRequestURL,
      parseSolanaPayURL,
      validateSolanaPayURL,
      toQRCodeURL,
      extractReferenceKeys,
    } = await import("gill/node");

    // Create SOL transfer URL with decimal amount
    const solAmount = 0.001; // 0.001 SOL
    const solURL = createTransferRequestURL({
      recipient: MERCHANT,
      amount: solAmount,
      label: "Coffee Shop",
      message: "Thanks for your order!"
    });
    console.log(`SOL Transfer URL (${solAmount} SOL):`, solURL);
    console.log("Valid:", validateSolanaPayURL(solURL));
    
    console.log("\n📱 SOL Transfer QR Code:");
    qrcode.generate(toQRCodeURL(solURL), { small: true });

    // Create transaction request URL
    const txURL = createTransactionRequestURL({
      link: "https://merchant.example.com/api/pay"
    });
    console.log("\nTransaction URL:", txURL);
    console.log("Valid:", validateSolanaPayURL(txURL));
    
    console.log("\n📱 Transaction Request QR Code:");
    qrcode.generate(toQRCodeURL(txURL), { small: true });

    // Parse URLs and show decimal amounts
    const solParsed = parseSolanaPayURL(solURL);
    if (solParsed.type === "transfer" && solParsed.params.amount) {
      console.log("\nParsed SOL Transfer:");
      console.log(`- Amount: ${solParsed.params.amount} SOL`);
      console.log(`- Recipient: ${solParsed.params.recipient}`);
      console.log(`- Label: ${solParsed.params.label}`);
      console.log(`- Message: ${solParsed.params.message}`);
    }

    // Reference tracking
    const refAmount = 0.0005; // 0.0005 SOL
    const urlWithRef = createTransferRequestURL({
      recipient: MERCHANT,
      amount: refAmount,
      reference: [REFERENCE]
    });
    console.log(`\nReference tracking (${refAmount} SOL):`, extractReferenceKeys(urlWithRef));

    console.log("\n✅ Basic example completed!");
    console.log("\n💡 Amounts in Solana Pay URLs use decimal values (e.g., 0.001 for 0.001 SOL)");

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main(); 