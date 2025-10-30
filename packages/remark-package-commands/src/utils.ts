import type { MdxJsxFlowElement, MdxJsxAttribute, MdxJsxAttributeValueExpression } from "mdast-util-mdx-jsx";
import type { Code } from "mdast";

/**
 * Configuration for package manager command conversion
 */
export interface PackageManager {
  name: string;
  /**
   * Custom value for the tab, defaults to `name`
   */
  value?: string;
  /**
   * Convert command for this package manager
   */
  command: (command: string) => string | undefined;
}

/**
 * Options for both remark package plugins
 */
export interface RemarkPackageOptions {
  /**
   * Persist tab selection across page navigation (Fumadocs UI only)
   * @defaultValue false
   */
  persist?: { id: string } | false;

  /**
   * Package managers to generate tabs for
   * @defaultValue [npm, pnpm, yarn, bun]
   */
  packageManagers?: PackageManager[];
}

/**
 * Default package managers for registry execution (npx/dlx patterns)
 */
export const defaultRegistryPackageManagers: PackageManager[] = [
  {
    name: "npm",
    command: (cmd: string) => `npx ${cmd}`,
  },
  {
    name: "pnpm",
    command: (cmd: string) => `pnpm dlx ${cmd}`,
  },
  {
    name: "yarn",
    command: (cmd: string) => `yarn dlx ${cmd}`,
  },
  {
    name: "bun",
    command: (cmd: string) => `bunx ${cmd}`,
  },
];

/**
 * Default package managers for local script execution (npm run patterns)
 */
export const defaultLocalPackageManagers: PackageManager[] = [
  {
    name: "npm",
    command: (cmd: string) => `npm run ${cmd}`,
  },
  {
    name: "pnpm",
    command: (cmd: string) => `pnpm run ${cmd}`,
  },
  {
    name: "yarn",
    command: (cmd: string) => `yarn run ${cmd}`,
  },
  {
    name: "bun",
    command: (cmd: string) => `bun run ${cmd}`,
  },
];

/**
 * Extract text content from a code node
 *
 * @param node - The mdast Code node to extract content from
 * @returns The trimmed text content of the code node
 */
export function getCodeContent(node: Code): string {
  return node.value.trim();
}

/**
 * Builds the attributes for the Tabs component
 */
function buildTabsAttributes(
  persist: RemarkPackageOptions["persist"],
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
 * Generate package manager command tabs using standard MDX JSX structure
 * Compatible with fumadocs Tab/Tabs components
 *
 * @param command - The base command to convert for each package manager
 * @param packageManagers - Array of package managers with conversion functions
 * @param persist - Optional persistence configuration for tab state across navigation
 * @param meta - Optional metadata string from the original code block
 * @returns MDX JSX flow element representing the generated tabs
 */
export function generatePackageManagerTabs(
  command: string,
  packageManagers: PackageManager[],
  persist?: { id: string } | false,
  meta?: string | null | undefined,
): MdxJsxFlowElement {
  // Build MDX JSX attributes for the Tabs component
  const attributes = buildTabsAttributes(persist, packageManagers);

  // Build Tab children elements
  const children = buildTabChildren(packageManagers, command, meta);

  // Create the Tabs MDX JSX element
  const tabsElement: MdxJsxFlowElement = {
    type: "mdxJsxFlowElement",
    name: "Tabs",
    attributes,
    children,
  };

  return tabsElement;
}

/**
 * Parse command string into arguments, handling quotes and escaping similar to npm-to-yarn.
 * This is used for validation to ensure we can properly parse the command.
 *
 * @param command - The command string to parse
 * @returns Array of parsed arguments
 */
function parseCommand(command: string): string[] {
  const args: string[] = [];
  let lastQuote: string | false = false;
  let escaped = false;
  let part = "";

  for (let i = 0; i < command.length; ++i) {
    const char = command.charAt(i);
    if (char === "\\") {
      part += char;
      escaped = true;
    } else {
      if (char === " " && !lastQuote) {
        args.push(part);
        part = "";
      } else if (!escaped && (char === '"' || char === "'")) {
        part += char;
        if (char === lastQuote) {
          lastQuote = false;
        } else if (!lastQuote) {
          lastQuote = char;
        }
      } else {
        part += char;
      }
      escaped = false;
    }
  }
  args.push(part);
  return args.filter((arg) => arg.length > 0);
}

/**
 * Validate if a command string is safe and non-empty
 * Prevents command injection and DoS attacks through input sanitization
 * Uses parsing approach similar to npm-to-yarn for proper quote handling
 *
 * @param command - The command string to validate
 * @returns True if the command is safe to process, false otherwise
 */
export function isValidCommand(command: string): boolean {
  const trimmed = command.trim();

  // Check basic requirements - prevent empty commands and DoS via large inputs
  if (trimmed.length === 0 || trimmed.length > 1000) {
    return false;
  }

  // Prevent newline injection attacks
  if (trimmed.includes("\n") || trimmed.includes("\r")) {
    return false;
  }

  // Parse the command to properly handle quoted strings (like npm-to-yarn)
  // This allows us to validate the actual command parts, not just the raw string
  let parsedArgs: string[];
  try {
    parsedArgs = parseCommand(trimmed);
  } catch {
    // If parsing fails, reject the command
    return false;
  }

  // Ensure we have at least one argument
  if (parsedArgs.length === 0) {
    return false;
  }

  // Validate each parsed argument for dangerous patterns
  // This approach is more accurate than checking the raw string since it handles quotes properly
  const dangerousPatterns = /[;&|`$(){}[\]<>]/;
  for (const arg of parsedArgs) {
    // Remove quotes from the argument for validation (quotes are valid in commands)
    const unquoted = arg.replace(/^["']|["']$/g, "");
    // Check if unquoted content contains dangerous patterns
    if (dangerousPatterns.test(unquoted)) {
      return false;
    }
  }

  return true;
}
