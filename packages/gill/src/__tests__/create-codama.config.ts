import { createCodamaConfig } from "../core";

describe("createCodamaConfig", () => {
  const idl = "anchor/target/idl/counter.json";
  const clientJs = "anchor/src/client/js";
  const clientRust = "anchor/src/client/rust";

  it("should return accept minimal arguments", () => {
    const config = createCodamaConfig({
      clientJs,
      idl,
    });

    expect(config).toMatchObject({
      idl,
      scripts: {
        js: {
          args: [
            clientJs,
            {
              dependencyMap: {
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
              },
            },
          ],
          from: "@codama/renderers-js",
        },
      },
    });
    expect(config.scripts).not.toHaveProperty("rust");
  });

  it("should return accept rust client", () => {
    const config = createCodamaConfig({
      clientJs,
      clientRust,
      idl,
    });

    expect(config).toMatchObject({
      idl,
      scripts: {
        js: {
          args: [
            clientJs,
            {
              dependencyMap: {
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
              },
            },
          ],
          from: "@codama/renderers-js",
        },
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
      },
    });
  });
});
