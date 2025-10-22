import { createCodamaConfig } from "./src/create-codama-config.js";

export default createCodamaConfig({
  clientJs: "./src/client/js/generated",
  idl: "./target/idl/escrow_program.json",
});
