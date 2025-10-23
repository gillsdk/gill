import { createSolanaClient } from "gill";
import { SolanaProvider } from "@gillsdk/react";

const client = createSolanaClient({
  cluster: "devnet",
  urlOrMoniker: "devnet",
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <SolanaProvider client={client}>{children}</SolanaProvider>;
}
