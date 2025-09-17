import { type Address } from "gill";
import qrcode from "qrcode-terminal";

const sampleURLs = [
  "solana:11111111111111111111111111111112?amount=0.001&label=Coffee%20Shop",
  "solana:11111111111111111111111111111112?amount=5&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "solana:https://merchant.example.com/api/pay",
  "invalid:url"
];

async function main() {
  try {
    const {
      parseSolanaPayURL,
      validateSolanaPayURL,
      extractReferenceKeys,
      toQRCodeURL,
    } = await import("gill/node");

    for (const [index, url] of sampleURLs.entries()) {
      console.log(`\nURL ${index + 1}: ${url}`);
      
      const isValid = validateSolanaPayURL(url);
      console.log(`Valid: ${isValid}`);
      
      if (!isValid) {
        console.log("Invalid - wallet would reject");
        continue;
      }
      
      qrcode.generate(toQRCodeURL(url), { small: true });
      
      try {
        const parsed = parseSolanaPayURL(url);
        
        if (parsed.type === "transfer") {
          console.log(`Transfer to: ${parsed.params.recipient}`);
          console.log(`Amount: ${parsed.params.amount || "User specified"}`);
          console.log(`Token: ${parsed.params.splToken || "SOL"}`);
          console.log(`References: ${extractReferenceKeys(url).length}`);
        } else {
          console.log(`Transaction endpoint: ${parsed.params.link}`);
        }
        
      } catch (error) {
        console.log(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

main(); 