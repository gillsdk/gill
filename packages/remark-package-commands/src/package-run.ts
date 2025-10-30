import type { Root, Code } from "mdast";
import type { Transformer } from "unified";
import { visit } from "unist-util-visit";
import {
  type RemarkPackageOptions,
  defaultLocalPackageManagers,
  generatePackageManagerTabs,
  getCodeContent,
  isValidCommand,
} from "./utils.js";

/**
 * Supported language aliases for package-run code blocks
 */
const SUPPORTED_ALIASES = ["package-run"] as const;
type SupportedAlias = (typeof SUPPORTED_ALIASES)[number];

/**
 * Remark plugin for generating package manager command tabs for local script execution.
 * Converts commands like "build:docs" to appropriate local script execution commands:
 * - npm: npm run build:docs
 * - pnpm: pnpm run build:docs
 * - yarn: yarn run build:docs
 * - bun: bun run build:docs
 *
 * @example
 * ```package-run
 * build:docs --verbose
 * ```
 *
 * @param options - Configuration options for the plugin
 * @returns Unified transformer function
 */
export function remarkPackageRun({
  persist = false,
  packageManagers = defaultLocalPackageManagers,
}: RemarkPackageOptions = {}): Transformer<Root, Root> {
  return (tree) => {
    visit(tree, "code", (node: Code) => {
      // Check if this is a supported code block
      if (!node.lang || !SUPPORTED_ALIASES.includes(node.lang as SupportedAlias)) {
        return;
      }

      // Extract and validate the command
      const command = getCodeContent(node);
      if (!isValidCommand(command)) {
        return;
      }

      // Generate the tabs element using our utility function
      const tabsElement = generatePackageManagerTabs(command, packageManagers, persist);

      // Replace the code node with the tabs element
      Object.assign(node, tabsElement);
      return "skip";
    });
  };
}

/**
 * Default export for convenience
 */
export default remarkPackageRun;
