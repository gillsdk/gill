import type { Code, Root } from "mdast";
import type { Transformer } from "unified";
import { visit } from "unist-util-visit";

import type { RemarkPackageOptions } from "./utils.js";
import { defaultRegistryPackageManagers, generatePackageManagerTabs, getCodeContent, isValidCommand } from "./utils.js";

// Supported language aliases for the code blocks
const SUPPORTED_ALIASES = ["package-execute"] as const;
type SupportedAlias = (typeof SUPPORTED_ALIASES)[number];

/**
 * Generates multiple tabs of code blocks for different package managers from registry execution commands.
 * Converts commands like "codama run js" to appropriate registry execution commands:
 * - npm: npx codama run js
 * - pnpm: pnpm dlx codama run js
 * - yarn: yarn dlx codama run js
 * - bun: bunx codama run js
 *
 * @example
 * ```package-execute
 * codama run js
 * ```
 *
 * Will generate tabs for npm, pnpm, yarn, and bun with the appropriate commands.
 */
export function remarkExecute({
  persist = false,
  packageManagers = defaultRegistryPackageManagers,
}: RemarkPackageOptions = {}): Transformer<Root, Root> {
  return (tree) => {
    visit(tree, "code", (node: Code) => {
      // Check if this is a supported code block
      if (!node.lang || !SUPPORTED_ALIASES.includes(node.lang as SupportedAlias)) {
        return;
      }

      // Extract and normalize the command
      let code = getCodeContent(node);

      // Validate the command to prevent shell injection and malicious input
      if (!isValidCommand(code)) {
        return;
      }

      // Strip npx prefix if present, so each package manager can add its own prefix
      if (code.startsWith("npx ")) {
        code = code.substring(4); // Remove "npx " prefix
      }

      // Generate the tabs element using our utility function
      const tabsElement = generatePackageManagerTabs(code, packageManagers, persist, node.meta);

      // Replace the code node with the tabs element
      Object.assign(node, tabsElement);
      return "skip";
    });
  };
}

/**
 * Default export for convenience
 */
export default remarkExecute;
