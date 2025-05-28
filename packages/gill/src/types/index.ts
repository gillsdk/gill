export * from "./rpc";
export * from "./explorer";
export * from "./transactions";
export * from "./solana-pay";

export type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};
