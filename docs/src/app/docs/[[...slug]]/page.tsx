import { LLMCopyButton, ViewOptions } from "@/components/page-actions";
import { docsSource } from "@/lib/source";
import { Spread } from "@/lib/Spread";
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

export async function generateStaticParams() {
  return docsSource.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug = [""] } = await props.params;
  const page = docsSource.getPage(slug);
  if (!page) notFound();

  const image = {
    url: ["/docs/og", ...slug, "image.png"].join("/") + `?ref=${Date.now()}`,
    width: 1200,
    height: 630,
  };

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      url: `/docs/${page.slugs.join("/")}`,
      images: [image],
    },
    twitter: {
      images: [image],
    },
  };
}

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = docsSource.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const hasCategory = page.file.name === "index" && page.slugs.length > 0;
  // Don't show cards for the React section index page
  const isReactIndex = page.slugs.join("/") === "react";
  const showCards = !isReactIndex;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-16">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pt-2 pb-6">
        <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptions
          markdownUrl={`${page.url}.mdx`}
          githubUrl={`https://github.com/gillsdk/gill/blob/master/docs/content/docs/${page.path}`}
        />
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
      {hasCategory && showCards && (
        <Cards>
          {getPageTreePeers(docsSource.pageTree, page.url).map((peer) => (
            <Card key={peer.url} title={peer.name} href={peer.url}>
              {peer.description}
            </Card>
          ))}
        </Cards>
      )}
    </DocsPage>
  );
}
