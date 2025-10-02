"use client";
import { useEffect, Suspense } from "react";
import { load, trackPageview } from "fathom-client";
import { usePathname, useSearchParams } from "next/navigation";

function TrackPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (process?.env?.NODE_ENV !== "production" || !process.env.NEXT_PUBLIC_FATHOM_ID) {
      return;
    }

    load(process.env.NEXT_PUBLIC_FATHOM_ID, {
      auto: false,
      // includedDomains: [SITE.domain, `www.${SITE.domain}`],
    });
  }, []);

  // Record a page view when route changes (including params)
  useEffect(() => {
    if (!pathname) return;

    trackPageview({
      url: pathname + searchParams.toString(),
      referrer: document.referrer,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function FathomAnalytics() {
  return (
    <Suspense fallback={null}>
      <TrackPageView />
    </Suspense>
  );
}
