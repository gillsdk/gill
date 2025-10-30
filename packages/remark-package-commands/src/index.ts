/**
 * @gillsdk/remark-package-commands
 *
 * Remark plugins for generating package manager command tabs in Fumadocs.
 * Supports both registry execution (npx/dlx) and local script execution (npm run).
 */

// Main plugin exports
export { remarkExecute, default as remarkPackageExecuteDefault } from "./package-execute.js";
export { remarkPackageRun, default as remarkPackageRunDefault } from "./package-run.js";

// Utility exports
export type { PackageManager, RemarkPackageOptions } from "./utils.js";

export {
  defaultRegistryPackageManagers,
  defaultLocalPackageManagers,
  generatePackageManagerTabs,
  getCodeContent,
  isValidCommand,
} from "./utils.js";

// Re-export for convenience (backwards compatibility)
export { remarkExecute as default } from "./package-execute.js";
