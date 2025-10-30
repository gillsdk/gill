# @gillsdk/remark-package-commands

[![npm version](https://img.shields.io/npm/v/@gillsdk/remark-package-commands)](https://www.npmjs.com/package/@gillsdk/remark-package-commands)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/gillsdk/gill/blob/master/LICENSE)

Remark plugins for generating package manager command tabs in Fumadocs. Supports both **registry execution** (npx/dlx)
and **local script execution** (npm run).

Created to address [GitHub issue #169](https://github.com/gillsdk/gill/issues/169) - provides proper command patterns
for different package managers with clear distinction between registry fetching vs local binary execution.

## Features

- **Two Plugin Variants**: `package-execute` for registry commands, `package-run` for local scripts
- **All Package Managers**: npm, pnpm, yarn, bun with correct command patterns
- **Correct Command Translation**:
  - Registry: `npx` → `pnpm dlx` → `yarn dlx` → `bunx`
  - Local: `npm run` → `pnpm run` → `yarn run` → `bun run`
- **Fumadocs Integration**: Uses fumadocs-core utilities for consistent tab rendering
- **Tab Persistence**: Optional persistent tab selection across page navigation
- **TypeScript**: Fully typed with comprehensive interfaces

## Installation

```bash
npm install @gillsdk/remark-package-commands
# or
pnpm add @gillsdk/remark-package-commands
# or
yarn add @gillsdk/remark-package-commands
# or
bun add @gillsdk/remark-package-commands
```

## Usage

### Registry Execution Plugin (`package-execute`)

For commands that download and execute packages from the registry:

```typescript
import { remarkExecute } from "@gillsdk/remark-package-commands";

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [() => remarkExecute({ persist: { id: "package-execute" } })],
  },
});
```

**Markdown:**

````markdown
```package-execute
codama run js
```
````

````

**Generated Tabs:**
- **npm**: `npx codama run js`
- **pnpm**: `pnpm dlx codama run js`
- **yarn**: `yarn dlx codama run js`
- **bun**: `bunx codama run js`

### Local Script Plugin (`package-run`)

For commands that run locally installed package scripts:

```typescript
import { remarkPackageRun } from '@gillsdk/remark-package-commands';

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      () => remarkPackageRun({ persist: { id: "package-run" } })
    ],
  },
});
````

**Markdown:**

````markdown
```package-run
build:docs
```
````

````

**Generated Tabs:**
- **npm**: `npm run build:docs`
- **pnpm**: `pnpm run build:docs`
- **yarn**: `yarn run build:docs`
- **bun**: `bun run build:docs`

### Using Both Plugins

```typescript
import { remarkExecute, remarkPackageRun } from '@gillsdk/remark-package-commands';

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      () => remarkExecute({ persist: { id: "package-execute" } }),
      () => remarkPackageRun({ persist: { id: "package-run" } })
    ],
  },
});
````

## Configuration Options

Both plugins accept the same configuration options:

```typescript
interface RemarkPackageOptions {
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

interface PackageManager {
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
```

### Custom Package Managers

```typescript
import { remarkExecute } from "@gillsdk/remark-package-commands";

const customPackageManagers = [
  { name: "npm", command: (cmd) => `npx ${cmd}` },
  { name: "pnpm", command: (cmd) => `pnpm dlx ${cmd}` },
  { name: "deno", command: (cmd) => `deno task ${cmd}` }, // Custom!
];

remarkPlugins: [
  () =>
    remarkExecute({
      packageManagers: customPackageManagers,
      persist: { id: "custom-execute" },
    }),
];
```

## When to Use Which Plugin

### Use `package-execute` for:

- CLI tools from npm registry (`codama`, `create-react-app`, etc.)
- One-time command execution
- Global tool usage
- Commands that download packages

**Examples:**

````markdown
```package-execute
create-react-app my-app
```
````

```package-execute
codama run js --config ./idls/token.js
```

````

### Use `package-run` for:
- Package.json scripts
- Local development commands
- Build/test/dev scripts
- Workspace commands

**Examples:**
```markdown
```package-run
dev
````

```package-run
build:production --env staging
```

````

## Command Pattern Reference

| Context | npm | pnpm | yarn | bun |
|---------|-----|------|------|-----|
| **Registry Execution** | `npx <cmd>` | `pnpm dlx <cmd>` | `yarn dlx <cmd>` | `bunx <cmd>` |
| **Local Script Execution** | `npm run <script>` | `pnpm run <script>` | `yarn run <script>` | `bun run <script>` |

## Complex Commands

Both plugins handle complex commands with flags and arguments:

```markdown
```package-execute
codama run js --config ./idls/token.js --out ./generated
````

```package-run
build:docs --verbose --clean
```

````

## Fumadocs Integration

This package leverages fumadocs-core utilities for consistent rendering:
- Uses `generateCodeBlockTabs()` for tab generation
- Compatible with fumadocs theming and styling
- Supports tab persistence across navigation
- Follows fumadocs TypeScript patterns

## Troubleshooting

### Commands Not Converting Properly

**Issue**: Commands showing as `npm run <cmd>` instead of `npx <cmd>`
**Solution**: Make sure you're using the correct plugin:
- `remarkExecute` for registry execution (npx/dlx)
- `remarkPackageRun` for local scripts (npm run)

### Tabs Not Rendering

**Issue**: Code blocks show as plain text
**Solution**: Ensure fumadocs-core is installed and plugins are properly configured in your MDX setup.

### TypeScript Errors

**Issue**: Type errors with mdast or unified
**Solution**: Install peer dependency `@types/mdast`:
```bash
npm install --save-dev @types/mdast
````

## Contributing

This package is part of the [gill](https://github.com/gillsdk/gill) monorepo. Contributions are welcome!

1. Fork the repository
2. Create your feature branch
3. Make your changes in `packages/remark-package-commands/`
4. Test your changes
5. Submit a pull request

## License

MIT → [gillsdk](https://github.com/gillsdk/gill)

## Related

- [fumadocs-core](https://fumadocs.vercel.app/) - The documentation framework this plugin is designed for
- [GitHub Issue #169](https://github.com/gillsdk/gill/issues/169) - Original feature request
- [pnpm dlx documentation](https://pnpm.io/cli/dlx) - Understanding pnpm's registry execution
