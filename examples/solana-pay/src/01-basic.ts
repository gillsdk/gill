import { type Address } from "gill";
import qrcode from "qrcode-terminal";

const MERCHANT = "11111111111111111111111111111112" as Address;
const REFERENCE = "11111111111111111111111111111113" as Address;

async function main() {
  try {
    const {
      createTransferRequestURL,
      createTransactionRequestURL,
      parseSolanaPayURL,
      toQRCodeURL,
      extractReferenceKeys,
    } = await import("gill/node");

    // SOL transfer
    const solURL = createTransferRequestURL({
      recipient: MERCHANT,
      amount: 0.001,
      label: "Coffee Shop",
      message: "Thanks for your order!"
    });
    console.log("SOL Transfer URL:", solURL);
    qrcode.generate(toQRCodeURL(solURL), { small: true });

    // Transaction request
    const txURL = createTransactionRequestURL({
      link: "https://merchant.example.com/api/pay"
    });
    console.log("\nTransaction URL:", txURL);
    qrcode.generate(toQRCodeURL(txURL), { small: true });

    // Parse transfer URL
    const parsed = parseSolanaPayURL(solURL);
    if (parsed.type === "transfer") {
      console.log("\nTransfer details:");
      console.log(`Amount: ${parsed.params.amount} SOL`);
      console.log(`Recipient: ${parsed.params.recipient}`);
      console.log(`Label: ${parsed.params.label}`);
    }

    // Reference tracking
    const urlWithRef = createTransferRequestURL({
      recipient: MERCHANT,
      amount: 0.0005,
      reference: [REFERENCE]
    });
    console.log("\nReference keys:", extractReferenceKeys(urlWithRef));

  } catch (error) {
    console.error("Error:", error);
  }
}

main(); 