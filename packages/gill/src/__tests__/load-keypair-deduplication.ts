import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
    createKeyPairFromBytes,
    createSignerFromKeyPair,
    generateKeyPairSigner,
    type KeyPairSigner,
} from "@solana/kit";

import {
    loadKeypairSignerFromFile,
    loadKeypairSignerFromEnvironment,
    loadKeypairSignerFromEnvironmentBase58,
} from "../node";

const EXPECTED_ADDRESS = "5CxWcsm9h3NfCM8WPM6eaw8LnnSmnYyEHf8BQQ56YJGK";

// Corresponds to address `5CxWcsm9h3NfCM8WPM6eaw8LnnSmnYyEHf8BQQ56YJGK`
const MOCK_KEY_BYTES = new Uint8Array([
    158, 162, 68, 53, 7, 160, 11, 228, 121, 212, 9, 20, 153, 66, 181, 218, 221, 151, 133, 191, 47, 200, 42, 248, 9, 193,
    87, 242, 138, 52, 78, 247, 62, 126, 231, 24, 61, 119, 89, 115, 57, 124, 71, 221, 150, 117, 118, 44, 234, 134, 91, 100,
    152, 80, 11, 142, 29, 0, 122, 146, 140, 107, 174, 196,
]);

// Corresponds to address `5CxWcsm9h3NfCM8WPM6eaw8LnnSmnYyEHf8BQQ56YJGK`
const MOCK_KEY_BASE58 = "4AxFzQaPR6N9dWP5K3GdZRLuWJcdgPznM4h42ASqByP3c6vywVLKs32rwPPsuvsJh1E6fLjkAbe8dzhTj3w173Ky";

describe("Load Keypair Signer Deduplication", () => {
    let tempDir: string;
    let testKeypairPath: string;
    let existingSignerWithSameAddress: KeyPairSigner;
    let differentSigner: KeyPairSigner;

    beforeAll(async () => {
        // Create existing signer with the same address as our test keypair
        const keypair = await createKeyPairFromBytes(MOCK_KEY_BYTES);
        existingSignerWithSameAddress = await createSignerFromKeyPair(keypair);

        // Create a different signer with a different address
        differentSigner = await generateKeyPairSigner();
    });

    beforeEach(() => {
        // Create temp directory and file for testing
        tempDir = join(tmpdir(), "gill-test-" + Math.random().toString(36).substring(7));
        if (!existsSync(tempDir)) {
            mkdirSync(tempDir, { recursive: true });
        }
        testKeypairPath = join(tempDir, "test-keypair.json");

        // Write test keypair to file
        writeFileSync(testKeypairPath, JSON.stringify(Array.from(MOCK_KEY_BYTES)));
    });

    afterEach(() => {
        // Clean up environment variables
        delete process.env.TEST_KEYPAIR_JSON;
        delete process.env.TEST_KEYPAIR_BASE58;
    });

    describe("loadKeypairSignerFromFile", () => {
        test("creates new signer when no existing signer provided", async () => {
            const signer = await loadKeypairSignerFromFile(testKeypairPath);

            expect(signer.address).toBe(EXPECTED_ADDRESS);
        });

        test("creates new signer when existing signer has different address", async () => {
            const signer = await loadKeypairSignerFromFile(testKeypairPath, differentSigner);

            expect(signer.address).toBe(EXPECTED_ADDRESS);
            expect(signer).not.toBe(differentSigner); // Different object instances
        });

        test("returns existing signer when addresses match", async () => {
            const signer = await loadKeypairSignerFromFile(testKeypairPath, existingSignerWithSameAddress);

            expect(signer).toBe(existingSignerWithSameAddress); // Same object instance
            expect(signer.address).toBe(EXPECTED_ADDRESS);
        });

        test("handles undefined existing signer gracefully", async () => {
            const signer = await loadKeypairSignerFromFile(testKeypairPath, undefined);

            expect(signer.address).toBe(EXPECTED_ADDRESS);
        });
    });

    describe("loadKeypairSignerFromEnvironment", () => {
        beforeEach(() => {
            // Set up environment variable
            process.env.TEST_KEYPAIR_JSON = JSON.stringify(Array.from(MOCK_KEY_BYTES));
        });

        test("creates new signer when no existing signer provided", async () => {
            const signer = await loadKeypairSignerFromEnvironment("TEST_KEYPAIR_JSON");

            expect(signer.address).toBe(EXPECTED_ADDRESS);
        });

        test("creates new signer when existing signer has different address", async () => {
            const signer = await loadKeypairSignerFromEnvironment("TEST_KEYPAIR_JSON", differentSigner);

            expect(signer.address).toBe(EXPECTED_ADDRESS);
            expect(signer).not.toBe(differentSigner);
        });

        test("returns existing signer when addresses match", async () => {
            const signer = await loadKeypairSignerFromEnvironment("TEST_KEYPAIR_JSON", existingSignerWithSameAddress);

            expect(signer).toBe(existingSignerWithSameAddress);
            expect(signer.address).toBe(EXPECTED_ADDRESS);
        });
    });

    describe("loadKeypairSignerFromEnvironmentBase58", () => {
        beforeEach(() => {
            // Set up environment variable
            process.env.TEST_KEYPAIR_BASE58 = MOCK_KEY_BASE58;
        });

        test("creates new signer when no existing signer provided", async () => {
            const signer = await loadKeypairSignerFromEnvironmentBase58("TEST_KEYPAIR_BASE58");

            expect(signer.address).toBe(EXPECTED_ADDRESS);
        });

        test("creates new signer when existing signer has different address", async () => {
            const signer = await loadKeypairSignerFromEnvironmentBase58("TEST_KEYPAIR_BASE58", differentSigner);

            expect(signer.address).toBe(EXPECTED_ADDRESS);
            expect(signer).not.toBe(differentSigner);
        });

        test("returns existing signer when addresses match", async () => {
            const signer = await loadKeypairSignerFromEnvironmentBase58("TEST_KEYPAIR_BASE58", existingSignerWithSameAddress);

            expect(signer).toBe(existingSignerWithSameAddress);
            expect(signer.address).toBe(EXPECTED_ADDRESS);
        });
    });

    describe("Real-world deduplication scenarios", () => {
        beforeEach(() => {
            process.env.TEST_KEYPAIR_JSON = JSON.stringify(Array.from(MOCK_KEY_BYTES));
            process.env.TEST_KEYPAIR_BASE58 = MOCK_KEY_BASE58;
        });

        test("prevents SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS by deduplicating", async () => {
            // This simulates the real-world scenario described in the issue
            const signer1 = await loadKeypairSignerFromFile(testKeypairPath);

            // Without deduplication, this would create a duplicate signer
            // With deduplication, it should return the same instance
            const signer2 = await loadKeypairSignerFromFile(testKeypairPath, signer1);

            expect(signer1).toBe(signer2); // Same object instance
            expect(signer1.address).toBe(signer2.address);
        });

        test("works across different load methods with same keypair", async () => {
            const signerFromFile = await loadKeypairSignerFromFile(testKeypairPath);
            const signerFromEnv = await loadKeypairSignerFromEnvironment("TEST_KEYPAIR_JSON", signerFromFile);
            const signerFromBase58 = await loadKeypairSignerFromEnvironmentBase58("TEST_KEYPAIR_BASE58", signerFromFile);

            // All should return the same instance since they have the same address
            expect(signerFromFile).toBe(signerFromEnv);
            expect(signerFromFile).toBe(signerFromBase58);
            expect(signerFromFile.address).toBe(EXPECTED_ADDRESS);
        });

        test("maintains type safety with KeyPairSigner return type", async () => {
            const signer = await loadKeypairSignerFromFile(testKeypairPath, existingSignerWithSameAddress);

            // Should still be typed as KeyPairSigner
            expect(typeof signer.address).toBe("string");
            expect("address" in signer).toBe(true);
        });
    });
});
