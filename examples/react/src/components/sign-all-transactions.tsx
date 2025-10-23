import { useSignAllTransactions } from "@gillsdk/react";
import { Button } from "./ui/button";
import { getAddMemoInstruction } from "gill/programs";

export function SignAllTransactions() {
  const { signAllAsync } = useSignAllTransactions();

  const handle = async () => {
    const result = await signAllAsync([
      {
        instructions: [getAddMemoInstruction({ memo: "Hello, World 1!" })],
      },
      {
        instructions: [getAddMemoInstruction({ memo: "Hello, World 2!" })],
      },
    ]);

    console.log(result);
  };

  return (
    <div className="bg-neutral-800 p-4 rounded flex flex-col gap-4">
      <Button onClick={handle}>Sign All Transactions</Button>
    </div>
  );
}
