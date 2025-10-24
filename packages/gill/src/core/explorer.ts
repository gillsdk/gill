import type { GetExplorerLinkArgs } from "../types";

/**
 * Craft a Solana Explorer link on any cluster
 */
export function getExplorerLink(props: GetExplorerLinkArgs = {}): string {
  const url = new URL("https://explorer.solana.com");

  // default to mainnet / mainnet-beta
  if (!props.cluster || props.cluster == "mainnet") props.cluster = "mainnet-beta";

  if ("address" in props) {
    url.pathname = `/address/${props.address}`;
  } else if ("transaction" in props) {
    url.pathname = `/tx/${props.transaction}`;
  } else if ("block" in props) {
    url.pathname = `/block/${props.block}`;
  }

  if (props.cluster !== "mainnet-beta") {
    if (props.cluster === "localnet" || props.cluster === "localhost") {
      // localnet technically isn't a cluster, so requires special handling
      url.searchParams.set("cluster", "custom");
      url.searchParams.set("customUrl", "http://localhost:8899");
    } else {
      url.searchParams.set("cluster", props.cluster);
    }
  }

  return url.toString();
}
