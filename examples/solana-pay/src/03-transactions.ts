import { type Address } from "gill";
import qrcode from "qrcode-terminal";

async function main() {
  try {
    const {
      createTransactionRequestURL,
      parseSolanaPayURL,
      toQRCodeURL,
    } = await import("gill/node");

    // Basic transaction request
    const basicURL = createTransactionRequestURL({
      link: "https://merchant.example.com/api/pay"
    });

    console.log("Transaction URL:", basicURL);
    qrcode.generate(toQRCodeURL(basicURL), { small: true });

    // Transaction with parameters
    const paramURL = createTransactionRequestURL({
      link: "https://merchant.example.com/api/pay?session=abc123&order=456"
    });

    console.log("\nParameterized URL:", paramURL);
    qrcode.generate(toQRCodeURL(paramURL), { small: true });

    // Parse transactions
    const basicParsed = parseSolanaPayURL(basicURL);
    if (basicParsed.type === "transaction") {
      console.log("\nTransaction details:");
      console.log(`Endpoint: ${basicParsed.params.link}`);
    }

    // Error handling demo
    try {
      createTransactionRequestURL({
        link: "http://insecure.example.com/api/pay"
      });
    } catch (error) {
      console.log("\nHTTPS required:", error instanceof Error ? error.message : String(error));
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

main(); 