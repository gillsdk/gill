const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project,
  },
  plugins: ["@typescript-eslint", "jest", "filenames"],
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "filenames/match-regex": ["error", "^[a-z0-9-]+$", true],
    "filenames/match-exported": [
      "error",
      [
        {
          transform: "kebab",
        },
      ],
      {
        ignore: ["index"],
      },
    ],
  },
  ignorePatterns: ["node_modules/", "dist/"],
  overrides: [
    {
      files: ["*.ts", "*.tsx", "*.js", "*.jsx"],
    },
    {
      files: ["*.tsx"],
      rules: {
        "@typescript-eslint/await-thenable": "off",
      },
    },
  ],
};
