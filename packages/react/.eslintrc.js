const { resolve } = require("node:path");

module.exports = {
  extends: [resolve(__dirname, "../../eslint-config/index.js")],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: resolve(__dirname, "tsconfig.lint.json"),
  },
  ignorePatterns: ["node_modules/", "dist/", "**/.eslintrc.js", "**/eslint.config.js"],
};
