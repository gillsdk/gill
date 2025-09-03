import { createCodamaConfig } from "gill";

export default createCodamaConfig({
    idl: "idls/magic_counter.json",
    clientJs: "src/clients/js/src/generated",
    clientRust: "src/clients/rust/src/generated",
});
