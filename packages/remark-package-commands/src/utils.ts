import type { Code } from "mdast";
import type { MdxJsxAttribute, MdxJsxAttributeValueExpression, MdxJsxFlowElement } from "mdast-util-mdx-jsx";

/**
 * Configuration for package manager command conversion
 */
export interface PackageManager {
  /**
   * Convert command for this package manager
   */
  command: (command: string) => string | undefined;
  name: string;
  /**
   * Custom value for the tab, defaults to `name`
   */
  value?: string;
}

/**
 * Options for both remark package plugins
 */
export interface RemarkPackageOptions {
  /**
   * Package managers to generate tabs for
   * @defaultValue [npm, pnpm, yarn, bun]
   */
  packageManagers?: PackageManager[];

  /**
   * Persist tab selection across page navigation (Fumadocs UI only)
   * @defaultValue false
   */
  persist?: false | { id: string };
}

/**
 * Default package managers for registry execution (npx/dlx patterns)
 */
export const defaultRegistryPackageManagers: PackageManager[] = [
  {
    command: (cmd: string) => `npx ${cmd}`,
    name: "npm",
  },
  {
    command: (cmd: string) => `pnpm dlx ${cmd}`,
    name: "pnpm",
  },
  {
    command: (cmd: string) => `yarn dlx ${cmd}`,
    name: "yarn",
  },
  {
    command: (cmd: string) => `bunx ${cmd}`,
    name: "bun",
  },
];

/**
 * Default package managers for local script execution (npm run patterns)
 */
export const defaultLocalPackageManagers: PackageManager[] = [
  {
    command: (cmd: string) => `npm run ${cmd}`,
    name: "npm",
  },
  {
    command: (cmd: string) => `pnpm run ${cmd}`,
    name: "pnpm",
  },
  {
    command: (cmd: string) => `yarn run ${cmd}`,
    name: "yarn",
  },
  {
    command: (cmd: string) => `bun run ${cmd}`,
    name: "bun",
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
        name: "groupId",
        type: "mdxJsxAttribute",
        value: persist.id,
      },
      {
        name: "persist",
        type: "mdxJsxAttribute",
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
    elements: packageManagers.map(({ name }) => ({
      type: "Literal",
      value: name,
    })),
    type: "ArrayExpression",
  } as const;

  const program = {
    body: [
      {
        expression: arrayExpression,
        type: "ExpressionStatement",
      },
    ],
    comments: [],
    sourceType: "module",
    type: "Program",
  } as const;

  const valueExpression: MdxJsxAttributeValueExpression = {
    data: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type assertion to avoid estree version conflicts
      estree: program as any,
    },
    type: "mdxJsxAttributeValueExpression",
    value: "",
  };

  return {
    name: "items",
    type: "mdxJsxAttribute",
    value: valueExpression,
  };
}

/**
 * Builds the Tab child elements for each package manager
 */
function buildTabChildren(packageManagers: PackageManager[], code: string, meta?: string | null): MdxJsxFlowElement[] {
  const children: MdxJsxFlowElement[] = [];

  for (const manager of packageManagers) {
    const value = manager.value ?? manager.name;
    const command = manager.command(code);

    // Skip if the command conversion failed or returned empty
    if (!command || command.length === 0) {
      continue;
    }

    const tabElement: MdxJsxFlowElement = {
      attributes: [
        {
          name: "value",
          type: "mdxJsxAttribute",
          value,
        },
      ],
      children: [
        {
          lang: "bash",
          meta: meta ?? undefined,
          type: "code",
          value: command,
        } as Code,
      ],
      name: "Tab",
      type: "mdxJsxFlowElement",
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
  persist?: false | { id: string },
  meta?: string | null,
): MdxJsxFlowElement {
  // Build MDX JSX attributes for the Tabs component
  const attributes = buildTabsAttributes(persist, packageManagers);

  // Build Tab children elements
  const children = buildTabChildren(packageManagers, command, meta);

  // Create the Tabs MDX JSX element
  const tabsElement: MdxJsxFlowElement = {
    attributes,
    children,
    name: "Tabs",
    type: "mdxJsxFlowElement",
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
