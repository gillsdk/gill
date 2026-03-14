import { FooterLinks } from "@/components/footer-links";
import { PackageBadges } from "@/components/package-badges";
import { siteConfig } from "@/const";
import icon from "@@/public/icon-black.svg";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <main className="flex flex-col justify-center flex-1 p-4 space-y-6">
      <h1 className="mx-auto mb-4 text-5xl font-bold">
        <Link href={"/"} className="inline-flex items-center gap-2">
          <Image src={icon} alt={""} className="dark:invert size-16"></Image> {siteConfig.name}
        </Link>
      </h1>

      <section className="mx-auto space-y-3 text-center">
        <p className="max-w-md text-fd-muted-foreground">
          gill is a modern javascript/typescript client library for interacting with the Solana
          blockchain
        </p>

        <PackageBadges packageName="gill" />
      </section>

      <Tabs
        items={["npm", "pnpm", "yarn", "bun"]}
        className="fd-codeblock w-full max-w-md mx-auto rounded-lg"
      >
        <Tab value="npm">
          <CodeBlock className="rounded-none">
            <Pre className="px-4">npm install gill</Pre>
          </CodeBlock>
        </Tab>
        <Tab value="pnpm">
          <CodeBlock className="rounded-none">
            <Pre className="px-4">pnpm add gill</Pre>
          </CodeBlock>
        </Tab>
        <Tab value="yarn">
          <CodeBlock className="rounded-none">
            <Pre className="px-4">yarn add gill</Pre>
          </CodeBlock>
        </Tab>
        <Tab value="bun">
          <CodeBlock className="rounded-none">
            <Pre className="px-4">bun install gill</Pre>
          </CodeBlock>
        </Tab>
      </Tabs>

      <Link href="/docs" className="inline-flex items-center justify-center gap-2 text-center link">
        Read the quickstart guide
      </Link>

      <FooterLinks />
    </main>
  );
}
