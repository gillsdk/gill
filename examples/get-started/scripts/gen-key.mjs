import fs from "fs";
import os from "os";
import path from "path";

(async () => {
  try {
    const keyPair = await crypto.subtle.generateKey(
      'Ed25519',
      true,
      ['sign', 'verify']
    );
    const jwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    
    const d = Buffer.from(jwk.d, 'base64url');
    const x = Buffer.from(jwk.x, 'base64url');
    
    const fullBytes = new Uint8Array([...d, ...x]);
    const json = JSON.stringify(Array.from(fullBytes));
    
    const configDir = path.join(os.homedir(), ".config", "solana");
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const keyPath = path.join(configDir, "id.json");
    fs.writeFileSync(keyPath, json);
    console.log(`Generated keypair at ${keyPath}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
