import { Config } from "@jest/types";
import path from "path";

const config: Partial<Config.InitialProjectOptions> = {
  resetMocks: true,
  restoreMocks: true,
  roots: ["<rootDir>/src/"],
  setupFilesAfterEnv: [
    path.resolve(__dirname, "setup-dev-mode.ts"),
    path.resolve(__dirname, "setup-define-version-constant.ts"),
    path.resolve(__dirname, "setup-webcrypto.ts"),
  ],
  coveragePathIgnorePatterns: [
    // comment for better diffs
    "node_modules",
    ".turbo",
    ".next",
    ".*generated.*",
    ".*reexports|index.ts",
  ],
  testPathIgnorePatterns: ["__setup__.ts"],
  moduleNameMapper: {
    // Handle .js imports to .ts files for ESM compatibility
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.(ts|js)x?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2020",
        },
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!.*\\@noble/ed25519/)", "\\.pnp\\.[^\\/]+$"],
};

export default config;
