import { Address, GetRecentPrioritizationFeesApi } from "gill";
import { useRecentPrioritizationFees } from "../hooks";

// [DESCRIBE] useRecentPrioritizationFees
{
  // Should accept empty inputs
  {
    useRecentPrioritizationFees();
    useRecentPrioritizationFees({});
  }

  // Should accept an empty array for `addresses`
  {
    const { fees } = useRecentPrioritizationFees({ addresses: [] });
    fees satisfies ReturnType<GetRecentPrioritizationFeesApi["getRecentPrioritizationFees"]>;
  }

  {
    const { fees } = useRecentPrioritizationFees({
      addresses: ["123" as Address],
      options: {
        refetchInterval: 1000,
      },
    });
    fees satisfies ReturnType<GetRecentPrioritizationFeesApi["getRecentPrioritizationFees"]>;
  }

  {
    const { fees } = useRecentPrioritizationFees({
      addresses: ["123" as Address],
      abortSignal: new AbortController().signal,
    });
    fees satisfies ReturnType<GetRecentPrioritizationFeesApi["getRecentPrioritizationFees"]>;
  }
}
