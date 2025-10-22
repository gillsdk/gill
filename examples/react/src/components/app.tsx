import { Balance } from "./balance";
import { Wallets } from "./wallets";
import { Wallet } from "./wallet";

export function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-4">
      <Balance />
      <Wallets />
      <Wallet />
    </div>
  );
}
