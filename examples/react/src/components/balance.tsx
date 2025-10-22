import { lamportsToSol } from "gill";
import { useBalance } from "@gillsdk/react";

export function Balance() {
  const { balance, isLoading, isError } = useBalance({
    address: "nicktrLHhYzLmoVbuZQzHUTicd2sfP571orwo9jfc8c",
  });

  return (
    <div className="bg-neutral-800 p-4 rounded">
      {isLoading ? "Loading balance..." : null}
      {isError ? "Error loading balance" : null}
      {balance ? <>Balance: {lamportsToSol(balance)} SOL</> : null}
    </div>
  );
}
