import { GILL_EXTERNAL_MODULE_MAP } from "gill";

export function createCodamaConfig({ idl, clientJs, dependencyMap = GILL_EXTERNAL_MODULE_MAP }) {
  return {
    idl,
    scripts: {
      js: {
        args: [clientJs, { dependencyMap }],
        from: "@codama/renderers-js",
      },
    },
  };
}
