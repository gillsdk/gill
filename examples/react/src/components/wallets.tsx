import { useWallets } from "@gillsdk/react";

export function Wallets() {
  const wallets = useWallets();

  return (
    <ul className="bg-neutral-800 p-4 rounded">
      {wallets.map((wallet, index) => (
        <li key={index}>{wallet.name}</li>
      ))}
    </ul>
  );
}
