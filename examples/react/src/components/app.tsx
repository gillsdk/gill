import { Balance } from "./balance";
import { Wallets } from "./wallets";
import { Wallet } from "./wallet";
import { useWallet } from "@gillsdk/react";
import { SignAndSendTransaction } from "./sign-and-send-transaction";
import { SignTransaction } from "./sign-transaction";
import { SignMessage } from "./sign-message";
import { SignIn } from "./sign-in";
import { SignAllTransactions } from "./sign-all-transactions";

export function App() {
  const { account } = useWallet();
  const signInAvailable = account?.features.includes("solana:signIn");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-4">
      <Balance />
      <Wallets />
      <Wallet />
      {account ? <SignTransaction /> : null}
      {account ? <SignAllTransactions /> : null}
      {account ? <SignAndSendTransaction /> : null}
      {account ? <SignMessage /> : null}
      {account && signInAvailable ? <SignIn /> : null}
    </div>
  );
}
