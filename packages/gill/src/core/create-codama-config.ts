/**
 * Codama dependency map to utilize gill imports
 */
export const GILL_EXTERNAL_MODULE_MAP: Record<string, string> = {
  solanaAccounts: "gill",
  solanaAddresses: "gill",
  solanaCodecsCore: "gill",
  solanaCodecsDataStructures: "gill",
  solanaCodecsNumbers: "gill",
  solanaCodecsStrings: "gill",
  solanaErrors: "gill",
  solanaInstructions: "gill",
  solanaOptions: "gill",
  solanaPrograms: "gill",
  solanaRpcTypes: "gill",
  solanaSigners: "gill",
};

/**
 * Create a Codama CLI configuration to generate a program client from an IDL.
 * Normally saved to `codama.js`.
 *
 * @example
 * ```ts
 * import { createCodamaConfig } from "gill";
 *
 * export default createCodamaConfig({
 *  idl: "program/idl.json",
 *  clientJs: "clients/js/src/generated",
 *  // clientRust: "clients/rust/src/generated",
 * });
 * ```
 */
export function createCodamaConfig({
  idl,
  clientJs,
  clientRust,
  dependencyMap = GILL_EXTERNAL_MODULE_MAP,
}: {
  clientJs: string;
  clientRust?: string;
  dependencyMap?: Record<string, string>;
  idl: string;
}) {
  return {
    idl,
    scripts: {
      js: {
        args: [clientJs, { dependencyMap }],
        from: "@codama/renderers-js",
      },
      ...(clientRust
        ? {
            rust: {
              args: [
                clientRust,
                {
                  crateFolder: "clients/rust",
                  formatCode: true,
                },
              ],
              from: "@codama/renderers-rust",
            },
          }
        : {}),
    },
  };
}
