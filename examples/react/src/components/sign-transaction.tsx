import { useSignTransaction } from "@gillsdk/react";
import { Button } from "./ui/button";
import { getAddMemoInstruction } from "gill/programs";

export function SignTransaction() {
  const { signAsync } = useSignTransaction();

  const handle = async () => {
    const result = await signAsync({
      instructions: [getAddMemoInstruction({ memo: "Hello, World!" })],
    });

    console.log(result);
  };

  return (
    <div className="bg-neutral-800 p-4 rounded flex flex-col gap-4">
      <Button onClick={handle}>Sign Transaction</Button>
    </div>
  );
}
