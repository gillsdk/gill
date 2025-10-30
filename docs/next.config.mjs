import { createMDX } from "fumadocs-mdx/next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    webpackMemoryOptimizations: true,
  },
  reactStrictMode: true,
  serverExternalPackages: ["twoslash", "typescript"],
  turbopack: {
    root: path.join(__dirname, "./"),
  },
  async rewrites() {
    return [
      {
        source: "/docs/:path*.mdx",
        destination: "/llms.mdx/docs/:path*",
      },
      {
        source: "/api/:path*.mdx",
        destination: "/llms.mdx/api/:path*",
      },
    ];
  },
};

export default withMDX(config);
