import { useSignMessage } from "@gillsdk/react";
import { Button } from "./ui/button";

export function SignMessage() {
  const { signAsync } = useSignMessage();

  const handle = async () => {
    const result = await signAsync("Hello, World!");

    console.log(result);
  };

  return (
    <div className="bg-neutral-800 p-4 rounded flex flex-col gap-4">
      <Button onClick={handle}>Sign Message</Button>
    </div>
  );
}
