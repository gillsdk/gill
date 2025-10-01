import { siteConfig } from "@/const";
import { RootProvider } from "fumadocs-ui/provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./global.css";
import FathomAnalytics from "@/components/fathom-analytics";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} - Solana JavaScript SDK`,
    template: `%s | ${siteConfig.name} Solana SDK`,
  },
  metadataBase: new URL(siteConfig.url),
  description: siteConfig.description,
  openGraph: {
    images: {
      url: "/cover.png",
    },
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <FathomAnalytics />
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
