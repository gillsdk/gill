import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { getWalletFeature } from "@wallet-standard/react";
import type { UiWallet, UiWalletAccount } from "@wallet-standard/ui";
import {
  StandardConnect,
  StandardConnectFeature,
  StandardConnectInput,
  StandardDisconnect,
  StandardDisconnectFeature,
} from "@wallet-standard/features";
import {
  getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  getWalletForHandle_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
} from "@wallet-standard/ui-registry";
import { persistentAtom } from "@nanostores/persistent";
import { useStore } from "@nanostores/react";
import { useWallets } from "./wallets.js";
import { atom } from "nanostores";

export interface WalletContextValue {
  account: UiWalletAccount | undefined;
  connect: (uiWallet: UiWallet, input?: StandardConnectInput) => Promise<UiWalletAccount>;
  disconnect: (uiWallet: UiWallet) => Promise<void>;
  status: "idle" | "connecting" | "disconnecting";
  wallet: UiWallet | undefined;
  wallets: readonly UiWallet[];
  walletAllowList: string[];
}

export const WalletContext = createContext<WalletContextValue>({
  account: undefined,
  connect: async () => {
    throw new Error("Not implemented");
  },
  disconnect: async () => {
    throw new Error("Not implemented");
  },
  status: "idle",
  wallet: undefined,
  wallets: [],
  walletAllowList: [],
});

export type WalletContextProviderProps = {
  autoConnect?: boolean;
  walletAllowList?: string[];
  children: ReactNode;
};

export const persistent = persistentAtom<string>("gill:wallet", "");

export const nonPersistent = atom<string>("");

export function WalletContextProvider({ children, autoConnect, walletAllowList }: WalletContextProviderProps) {
  const store = autoConnect === false ? nonPersistent : persistent;
  const value = useStore(store);
  const wallets = useWallets({ walletAllowList });
  const [status, setStatus] = useState<"idle" | "connecting" | "disconnecting">("idle");

  const wallet = useMemo(() => {
    if (!value) {
      return undefined;
    }

    const [wallet] = value.split(":");
    return wallets.find((w) => w.name === wallet);
  }, [value, wallets]);

  const account = useMemo(() => {
    if (!value || !wallet) {
      return undefined;
    }

    const [, address] = value.split(":");
    return wallet.accounts.find((a) => a.address === address);
  }, [value, wallet]);

  const connect = async (uiWallet: UiWallet, input?: StandardConnectInput) => {
    if (status === "connecting") {
      throw new Error("Connect in progress");
    }

    try {
      setStatus("connecting");

      const connectFeature = getWalletFeature(
        uiWallet,
        StandardConnect,
      ) as StandardConnectFeature[typeof StandardConnect];
      const wallet = getWalletForHandle_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(uiWallet);
      const result = await connectFeature.connect(input);
      const account = getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(
        wallet,
        result.accounts[0],
      );

      store.set(`${uiWallet.name}:${account.address}`);

      return account;
    } finally {
      setStatus("idle");
    }
  };

  const disconnect = async (uiWallet: UiWallet) => {
    if (status === "disconnecting") {
      throw new Error("Disconnect in progress");
    }

    try {
      setStatus("disconnecting");

      const disconnectFeature = getWalletFeature(
        uiWallet,
        StandardDisconnect,
      ) as StandardDisconnectFeature[typeof StandardDisconnect];
      const result = await disconnectFeature.disconnect();

      store.set("");

      return result;
    } finally {
      setStatus("idle");
    }
  };

  return (
    <WalletContext.Provider
      value={{ account, connect, disconnect, status, wallet, wallets, walletAllowList: walletAllowList || [] }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
