import { GetLatestBlockhashApi } from "gill";
import { useLatestBlockhash } from "../hooks/index.js";

// [DESCRIBE] useLatestBlockhash
{
  {
    const { latestBlockhash } = useLatestBlockhash();
    latestBlockhash satisfies ReturnType<GetLatestBlockhashApi["getLatestBlockhash"]>["value"];
  }

  {
    const { latestBlockhash } = useLatestBlockhash({});
    latestBlockhash satisfies ReturnType<GetLatestBlockhashApi["getLatestBlockhash"]>["value"];
  }

  {
    const { latestBlockhash } = useLatestBlockhash({
      config: { commitment: "confirmed" },
    });
    latestBlockhash satisfies ReturnType<GetLatestBlockhashApi["getLatestBlockhash"]>["value"];
  }
}
