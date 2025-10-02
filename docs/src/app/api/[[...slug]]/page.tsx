import { getPageTreePeers } from "fumadocs-core/server";
import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui";
import { Card, Cards } from "fumadocs-ui/components/card";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { apiSource } from "@/lib/source";
import { Spread } from "@/lib/Spread";
import { LLMCopyButton } from "@/components/page-actions";

export async function generateStaticParams() {
  return apiSource.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug = [""] } = await props.params;
  const page = apiSource.getPage(slug);
  if (!page) notFound();

  const image = {
    url: `/images/og/api_references.png`,
    width: 1200,
    height: 630,
  };

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      url: `/api/${page.slugs.join("/")}`,
      images: [image],
    },
    twitter: {
      images: [image],
    },
  };
}

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = apiSource.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const hasCategory = page.file.name === "index" && page.slugs.length > 0;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-16">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pt-2 pb-6">
        <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
      </div>
      <DocsBody>
        <MDX
          components={{
            ...defaultMdxComponents,
            img: (props) => <ImageZoom {...props} />,
            Popup,
            PopupContent,
            PopupTrigger,
            Spread,
            Step,
            Steps,
            Tab,
            Tabs,
          }}
        />
      </DocsBody>
      {hasCategory && (
        <Cards>
          {getPageTreePeers(apiSource.pageTree, page.url).map((peer) => (
            <Card key={peer.url} title={peer.name} href={peer.url}>
              {peer.description}
            </Card>
          ))}
        </Cards>
      )}
    </DocsPage>
  );
}
