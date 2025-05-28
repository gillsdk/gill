import { type Address } from "gill";
import qrcode from "qrcode-terminal";

const MERCHANT = "11111111111111111111111111111112" as Address;
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const REFERENCE = "11111111111111111111111111111113" as Address;

async function main() {
  console.log("🚀 Transfer Examples\n");

  try {
    const {
      createTransferRequestURL,
      parseSolanaPayURL,
      validateSolanaPayURL,
      toQRCodeURL,
      extractReferenceKeys,
    } = await import("gill/node");

    // SOL transfer with decimal amount
    const solAmount = 0.001; // 0.001 SOL
    const solURL = createTransferRequestURL({
      recipient: MERCHANT,
      amount: solAmount,
      reference: [REFERENCE],
      label: "Coffee Shop",
      message: "Payment for 1x Latte",
      memo: "Order #12345"
    });

    console.log(`SOL Transfer URL (${solAmount} SOL):`, solURL);
    console.log("Valid:", validateSolanaPayURL(solURL));
    
    console.log("\n📱 SOL Transfer QR Code:");
    qrcode.generate(toQRCodeURL(solURL), { small: true });

    // USDC transfer with decimal amount
    const usdcAmount = 5; // 5 USDC
    const usdcURL = createTransferRequestURL({
      recipient: MERCHANT,
      amount: usdcAmount,
      splToken: USDC_MINT,
      reference: [REFERENCE],
      label: "Coffee Shop",
      message: "Payment for 1x Premium Coffee",
      memo: "Order #12346"
    });

    console.log(`\nUSDC Transfer URL (${usdcAmount} USDC):`, usdcURL);
    console.log("Valid:", validateSolanaPayURL(usdcURL));
    
    console.log("\n📱 USDC Transfer QR Code:");
    qrcode.generate(toQRCodeURL(usdcURL), { small: true });

    // Parse SOL transfer
    const solParsed = parseSolanaPayURL(solURL);
    if (solParsed.type === "transfer") {
      console.log("\nSOL Transfer Details:");
      console.log(`- Recipient: ${solParsed.params.recipient}`);
      if (solParsed.params.amount) {
        console.log(`- Amount: ${solParsed.params.amount} SOL`);
      }
      console.log(`- Label: ${solParsed.params.label}`);
      console.log(`- Message: ${solParsed.params.message}`);
    }

    // Parse USDC transfer
    const usdcParsed = parseSolanaPayURL(usdcURL);
    if (usdcParsed.type === "transfer") {
      console.log("\nUSDC Transfer Details:");
      console.log(`- Recipient: ${usdcParsed.params.recipient}`);
      if (usdcParsed.params.amount) {
        console.log(`- Amount: ${usdcParsed.params.amount} USDC`);
      }
      console.log(`- SPL Token: ${usdcParsed.params.splToken}`);
      console.log(`- Label: ${usdcParsed.params.label}`);
    }

    // Reference keys
    console.log("\nReference Keys:");
    console.log(`SOL: ${extractReferenceKeys(solURL)}`);
    console.log(`USDC: ${extractReferenceKeys(usdcURL)}`);

    // URL encoding options
    const encodedAmount = 0.001; // 0.001 SOL
    const encodedURL = createTransferRequestURL({
      recipient: MERCHANT,
      amount: encodedAmount,
      label: "Coffee and Pastry Shop",
      message: "Thank you"
    }, { encode: true });
    
    const unencodedURL = createTransferRequestURL({
      recipient: MERCHANT,
      amount: encodedAmount,
      label: "Coffee and Pastry Shop",
      message: "Thank you"
    }, { encode: false });
    
    console.log("\nEncoding Options:");
    console.log("Encoded URL (for transmission):", encodedURL);
    console.log("Unencoded URL (human readable):", unencodedURL);
    
    // Show how the encoded URL parses correctly
    const encodedParsed = parseSolanaPayURL(encodedURL);
    if (encodedParsed.type === "transfer") {
      console.log("Parsed message from encoded URL:", `"${encodedParsed.params.message}"`);
    }
    
    console.log("\n📱 Encoded URL QR Code:");
    qrcode.generate(toQRCodeURL(encodedURL), { small: true });

    console.log("\n✅ Transfer examples completed!");
    console.log("\n💡 Amounts in Solana Pay URLs use decimal values");
    console.log("💡 SOL: 0.001 = 0.001 SOL, USDC: 5 = 5 USDC");

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main(); 