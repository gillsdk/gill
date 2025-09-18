import { useWallet } from "@gillsdk/react";
import { Button } from "./ui/button";

export function Wallet() {
  const { account, wallets, connect, disconnect, status } = useWallet();

  return (
    <div className="bg-neutral-800 p-4 rounded flex flex-col gap-4">
      {account ? <p>Connected to {account.address}</p> : <p>Not connected</p>}

      <ul className="flex flex-col gap-4">
        {wallets.map((wallet) => (
          <li key={wallet.name} className="flex gap-4">
            <Button onClick={() => connect(wallet)} disabled={status === "connecting"}>
              Connect to {wallet.name}
            </Button>
            <Button onClick={() => disconnect(wallet)} disabled={status === "disconnecting"}>
              Disconnect from {wallet.name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
