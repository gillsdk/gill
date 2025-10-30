import type { Root, Code } from "mdast";
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxAttributeValueExpression } from "mdast-util-mdx-jsx";
import type { Transformer } from "unified";
import { visit } from "unist-util-visit";
import * as npmToYarn from "npm-to-yarn";

interface PackageManager {
  name: string;
  /**
   * Custom value for the tab, defaults to `name`
   */
  value?: string;
  /**
   * Convert from npm to another package manager
   */
  command: (command: string) => string | undefined;
}

export interface RemarkExecuteOptions {
  /**
   * Persist Tab value across page navigation (Fumadocs UI only)
   *
   * @defaultValue false
   */
  persist?:
    | {
        id: string;
      }
    | false;

  /**
   * Package managers to generate tabs for
   * @defaultValue npm, pnpm, yarn, bun
   */
  packageManagers?: PackageManager[];
}

// Supported language aliases for the code blocks
const SUPPORTED_ALIASES = ["package-execute"] as const;
type SupportedAlias = (typeof SUPPORTED_ALIASES)[number];

/**
 * Generates multiple tabs of code blocks for different package managers from an npm command code block.
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
  packageManagers = [
    { command: (cmd) => (npmToYarn.default as any)(cmd, "npm"), name: "npm" },
    { command: (cmd) => (npmToYarn.default as any)(cmd, "pnpm"), name: "pnpm" },
    { command: (cmd) => (npmToYarn.default as any)(cmd, "yarn"), name: "yarn" },
    { command: (cmd) => (npmToYarn.default as any)(cmd, "bun"), name: "bun" },
  ],
}: RemarkExecuteOptions = {}): Transformer<Root, Root> {
  return (tree) => {
    visit(tree, "code", (node: Code) => {
      // Check if this is a supported code block
      if (!node.lang || !SUPPORTED_ALIASES.includes(node.lang as SupportedAlias)) {
        return;
      }

      let code = node.value;

      // Prepend npx if the command doesn't start with npm or npx
      if (node.lang === "package-execute" && !code.startsWith("npm") && !code.startsWith("npx")) {
        code = `npx ${code}`;
      }

      // Build MDX JSX attributes for the Tabs component
      const attributes = buildTabsAttributes(persist, packageManagers);

      // Build Tab children elements
      const children = buildTabChildren(packageManagers, code, node.meta);

      // Create the Tabs MDX JSX element
      const tabsElement: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Tabs",
        attributes,
        children,
      };

      // Replace the code node with the tabs element
      Object.assign(node, tabsElement);
      return "skip";
    });
  };
}

/**
 * Builds the attributes for the Tabs component
 */
function buildTabsAttributes(
  persist: RemarkExecuteOptions["persist"],
  packageManagers: PackageManager[],
): MdxJsxAttribute[] {
  const attributes: MdxJsxAttribute[] = [];

  // Add persistence attributes if configured
  if (typeof persist === "object" && persist.id) {
    attributes.push(
      {
        type: "mdxJsxAttribute",
        name: "groupId",
        value: persist.id,
      },
      {
        type: "mdxJsxAttribute",
        name: "persist",
        value: null,
      },
    );
  }

  // Add items attribute with package manager names
  const itemsAttribute = createItemsAttribute(packageManagers);
  attributes.push(itemsAttribute);

  return attributes;
}

/**
 * Creates the items attribute with an array of package manager names
 */
function createItemsAttribute(packageManagers: PackageManager[]): MdxJsxAttribute {
  const arrayExpression = {
    type: "ArrayExpression",
    elements: packageManagers.map(({ name }) => ({
      type: "Literal",
      value: name,
    })),
  } as const;

  const program = {
    type: "Program",
    body: [
      {
        type: "ExpressionStatement",
        expression: arrayExpression,
      },
    ],
    sourceType: "module",
    comments: [],
  } as const;

  const valueExpression: MdxJsxAttributeValueExpression = {
    type: "mdxJsxAttributeValueExpression",
    value: "",
    data: {
      estree: program as any, // Type assertion to avoid estree version conflicts
    },
  };

  return {
    type: "mdxJsxAttribute",
    name: "items",
    value: valueExpression,
  };
}

/**
 * Builds the Tab child elements for each package manager
 */
function buildTabChildren(
  packageManagers: PackageManager[],
  code: string,
  meta?: string | null | undefined,
): MdxJsxFlowElement[] {
  const children: MdxJsxFlowElement[] = [];

  for (const manager of packageManagers) {
    const value = manager.value ?? manager.name;
    const command = manager.command(code);

    // Skip if the command conversion failed or returned empty
    if (!command || command.length === 0) {
      continue;
    }

    const tabElement: MdxJsxFlowElement = {
      type: "mdxJsxFlowElement",
      name: "Tab",
      attributes: [
        {
          type: "mdxJsxAttribute",
          name: "value",
          value,
        },
      ],
      children: [
        {
          type: "code",
          lang: "bash",
          meta: meta ?? undefined,
          value: command,
        } as Code,
      ],
    };

    children.push(tabElement);
  }

  return children;
}

/**
 * Default export for convenience
 */
export default remarkExecute;
