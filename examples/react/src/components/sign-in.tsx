import { useSignIn } from "@gillsdk/react";
import { Button } from "./ui/button";

export function SignIn() {
  const { signInAsync } = useSignIn();

  const handle = async () => {
    const result = await signInAsync();

    console.log(result);
  };

  return (
    <div className="bg-neutral-800 p-4 rounded flex flex-col gap-4">
      <Button onClick={handle}>Sign In</Button>
    </div>
  );
}
