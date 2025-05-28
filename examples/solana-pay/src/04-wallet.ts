import { type Address } from "gill";
import qrcode from "qrcode-terminal";

const sampleURLs = [
  "solana:11111111111111111111111111111112?amount=0.001&label=Coffee%20Shop",
  "solana:11111111111111111111111111111112?amount=5&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "solana:https://merchant.example.com/api/pay",
  "invalid:url"
];

async function main() {
  console.log("🚀 Wallet Integration Examples\n");

  try {
    const {
      parseSolanaPayURL,
      validateSolanaPayURL,
      extractReferenceKeys,
      toQRCodeURL,
    } = await import("gill/node");

    for (let i = 0; i < sampleURLs.length; i++) {
      const url = sampleURLs[i];
      console.log(`🔗 Processing URL ${i + 1}:`);
      console.log(url.substring(0, 80) + "...");
      
      const isValid = validateSolanaPayURL(url);
      console.log(`Valid: ${isValid}`);
      
      if (!isValid) {
        console.log("❌ Invalid URL - wallet would show error\n");
        continue;
      }
      
      console.log(`\n📱 QR Code for URL ${i + 1}:`);
      qrcode.generate(toQRCodeURL(url), { small: true });
      
      try {
        const parsed = parseSolanaPayURL(url);
        console.log(`Type: ${parsed.type}`);
        
        if (parsed.type === "transfer") {
          console.log(`- Recipient: ${parsed.params.recipient}`);
          console.log(`- Amount: ${parsed.params.amount || "User specified"}`);
          console.log(`- Token: ${parsed.params.splToken || "SOL"}`);
          console.log(`- Label: ${parsed.params.label || "N/A"}`);
          
          const refs = extractReferenceKeys(url);
          console.log(`- References: ${refs.length}`);
          
          console.log("Wallet would: Display details → Get approval → Sign → Submit");
        } else {
          console.log(`- Endpoint: ${parsed.params.link}`);
          console.log("Wallet would: GET details → Show info → POST account → Sign transaction");
        }
        
      } catch (error) {
        console.log(`❌ Parse error: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      console.log();
    }

    console.log("✅ Wallet integration examples completed!");

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main(); 