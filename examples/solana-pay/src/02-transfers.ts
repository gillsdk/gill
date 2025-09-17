import { type Address } from "gill";
import qrcode from "qrcode-terminal";

const MERCHANT = "11111111111111111111111111111112" as Address;
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const REFERENCE = "11111111111111111111111111111113" as Address;

async function main() {
  try {
    const {
      createTransferRequestURL,
      parseSolanaPayURL,
      toQRCodeURL,
    } = await import("gill/node");

    // SOL transfer
    const solURL = createTransferRequestURL({
      recipient: MERCHANT,
      amount: 0.001,
      reference: [REFERENCE],
      label: "Coffee Shop",
      message: "Payment for Latte",
      memo: "Order #12345"
    });

    console.log("SOL Transfer URL:", solURL);
    qrcode.generate(toQRCodeURL(solURL), { small: true });

    // USDC transfer
    const usdcURL = createTransferRequestURL({
      recipient: MERCHANT,
      amount: 5,
      splToken: USDC_MINT,
      reference: [REFERENCE],
      label: "Coffee Shop",
      message: "Payment for Premium Coffee",
      memo: "Order #12346"
    });

    console.log("\nUSDC Transfer URL:", usdcURL);
    qrcode.generate(toQRCodeURL(usdcURL), { small: true });

    // Parse transfers
    const solParsed = parseSolanaPayURL(solURL);
    if (solParsed.type === "transfer") {
      console.log("\nSOL Transfer:");
      console.log(`Amount: ${solParsed.params.amount} SOL`);
      console.log(`Message: ${solParsed.params.message}`);
    }

    const usdcParsed = parseSolanaPayURL(usdcURL);
    if (usdcParsed.type === "transfer") {
      console.log("\nUSDC Transfer:");
      console.log(`Amount: ${usdcParsed.params.amount} USDC`);
      console.log(`Token: ${usdcParsed.params.splToken}`);
    }

    // URL encoding
    const encodedURL = createTransferRequestURL({
      recipient: MERCHANT,
      amount: 0.001,
      label: "Coffee and Pastry Shop",
      message: "Thank you"
    }, { encode: true });
    
    const unencodedURL = createTransferRequestURL({
      recipient: MERCHANT,
      amount: 0.001,
      label: "Coffee and Pastry Shop", 
      message: "Thank you"
    }, { encode: false });
    
    console.log("\nURL Encoding:");
    console.log("Encoded:", encodedURL);
    console.log("Unencoded:", unencodedURL);

  } catch (error) {
    console.error("Error:", error);
  }
}

main(); 