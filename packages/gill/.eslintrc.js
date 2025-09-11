const { resolve } = require("node:path");
const { rules } = require("../eslint-config");

module.exports = {
  extends: "../../config-eslint/index.js",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: resolve(__dirname, "tsconfig.lint.json"),
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "**/*.js",
    "**/*.mjs",
    "**/*.cjs",
    "**/.eslintrc.js",
    "**/eslint.config.js",
  ],
  rules: {
    ...rules,
    "no-console": "off",
    "no-debugger": "off",
  },
};
