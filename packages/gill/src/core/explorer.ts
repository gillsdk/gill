import { type GetExplorerLinkArgs } from "../types";

/**
 * Craft a Solana Explorer link on any cluster
 */
export function getExplorerLink(props: GetExplorerLinkArgs = {}): string {
  let url = new URL("https://explorer.solana.com/");

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

/**
 * Craft an Orb Explorer link on any cluster
 */
export function getExplorerLinkOrb(props: GetExplorerLinkArgs = {}): string {
  let url = new URL("https://orb.helius.dev/");

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
    // Orb doesn't support localnet/localhost, so we ignore those clusters
    if (props.cluster !== "localnet" && props.cluster !== "localhost") {
      url.searchParams.set("cluster", props.cluster);
    }
  }

  return url.toString();
}

/**
 * Craft a Solscan Explorer link on any cluster
 */
export function getExplorerLinkSolscan(props: GetExplorerLinkArgs = {}): string {
  let url = new URL("https://solscan.io/");

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

/**
 * Craft a SolanaFM Explorer link on any cluster
 * Note: SolanaFM uses different cluster naming conventions
 */
export function getExplorerLinkSolanafm(props: GetExplorerLinkArgs = {}): string {
  let url = new URL("https://solana.fm/");

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
      // SolanaFM uses "localnet-solana" instead of custom cluster
      url.searchParams.set("cluster", "localnet-solana");
    } else if (props.cluster === "devnet") {
      // SolanaFM uses "devnet-solana" instead of "devnet"
      url.searchParams.set("cluster", "devnet-solana");
    } else if (props.cluster === "testnet") {
      // SolanaFM uses "testnet-solana" instead of "testnet"
      url.searchParams.set("cluster", "testnet-solana");
    } else {
      url.searchParams.set("cluster", props.cluster);
    }
  }

  return url.toString();
}
