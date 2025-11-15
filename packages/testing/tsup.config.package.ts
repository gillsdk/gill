import { defineConfig } from "tsup";

import { getBaseConfig } from "../build-scripts/getBaseConfig";

export default defineConfig((options = {}) => [
  ...getBaseConfig("node", ["cjs", "esm"], {
    ...options,
    entry: {
      index: "src/index.ts",
      "localValidator/index": "src/localValidator/localValidator.ts",
    },
  }),
  ...getBaseConfig("browser", ["cjs", "esm"], options),
]);
