import type { Config } from "jest";
import path from "path";
import { createDefaultPreset } from "ts-jest";

import commonConfig from "./jest-unit.config.common";

const tsJestTransformCfg = createDefaultPreset().transform;

const config: Config = {
  ...commonConfig,
  displayName: {
    color: "grey",
    name: "Unit Test (React)",
  },
  globals: {
    ...commonConfig.globals,
    __BROWSER__: false,
    __NODEJS__: false,
    __REACTNATIVE__: false,
  },
  setupFilesAfterEnv: [
    ...(commonConfig.setupFilesAfterEnv ?? []),
    path.resolve(__dirname, "setup-testing-library-jest-dom.ts"),
  ],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: [...(commonConfig.testPathIgnorePatterns ?? []), ".browser.ts$", ".node.ts$"],
  transform: {
    ...commonConfig.transform,
    ...tsJestTransformCfg,
  },
};

export default config;
