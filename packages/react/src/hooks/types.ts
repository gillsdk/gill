import type { useQuery } from "@tanstack/react-query";
import type { Simplify } from "gill";

export type OmittedUseQueryFields = "queryFn" | "queryKey";

export type GillUseQueryDefaultOptions = Omit<Parameters<typeof useQuery>[0], OmittedUseQueryFields>;

export type GillUseRpcHook<TConfig, TOptions extends GillUseQueryDefaultOptions = GillUseQueryDefaultOptions> = {
  /**
   * Signal used to abort the RPC operation
   *
   * See MDN docs for {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal}
   * and {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortController | AbortController}
   */
  abortSignal?: AbortSignal;
  /**
   * RPC configuration passed to the RPC method being called
   */
  config?: TConfig;
  /**
   * Options passed to the {@link useQuery} hook
   */
  options?: Simplify<TOptions>;
};
