import { type Address } from "gill";
import qrcode from "qrcode-terminal";

async function main() {
  console.log("🚀 Transaction Request Examples\n");

  try {
    const {
      createTransactionRequestURL,
      parseSolanaPayURL,
      validateSolanaPayURL,
      toQRCodeURL,
    } = await import("gill/node");

    // Basic transaction request
    const basicURL = createTransactionRequestURL({
      link: "https://merchant.example.com/api/pay"
    });

    console.log("Basic Transaction URL:", basicURL);
    console.log("Valid:", validateSolanaPayURL(basicURL));
    
    console.log("\n📱 Basic Transaction QR Code:");
    qrcode.generate(toQRCodeURL(basicURL), { small: true });

    // Transaction request with parameters
    const paramURL = createTransactionRequestURL({
      link: "https://merchant.example.com/api/pay?session=abc123&order=456"
    });

    console.log("\nParameterized URL:", paramURL);
    console.log("Valid:", validateSolanaPayURL(paramURL));
    
    console.log("\n📱 Parameterized Transaction QR Code:");
    qrcode.generate(toQRCodeURL(paramURL), { small: true });

    // Parse URLs
    const basicParsed = parseSolanaPayURL(basicURL);
    if (basicParsed.type === "transaction") {
      console.log("\nBasic Transaction:");
      console.log(`- Type: ${basicParsed.type}`);
      console.log(`- Link: ${basicParsed.params.link}`);
    }

    const paramParsed = parseSolanaPayURL(paramURL);
    if (paramParsed.type === "transaction") {
      console.log("\nParameterized Transaction:");
      console.log(`- Type: ${paramParsed.type}`);
      console.log(`- Link: ${paramParsed.params.link}`);
    }

    // Error handling
    try {
      createTransactionRequestURL({
        link: "http://insecure.example.com/api/pay"
      });
    } catch (error) {
      console.log("\nError handling works:");
      console.log(`- ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log("\n✅ Transaction examples completed!");

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main(); 