import { type NextRequest, NextResponse } from "next/server";
import { getLLMText } from "@/lib/get-llm-text";
import { docsSource } from "@/lib/source";
import { notFound } from "next/navigation";

export const revalidate = false;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;

  const page = docsSource.getPage(slug);
  if (!page) notFound();

  return new NextResponse(await getLLMText(page));
}

export function generateStaticParams() {
  return docsSource.generateParams();
}
