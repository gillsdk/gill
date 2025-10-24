import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import { remarkInclude } from "fumadocs-mdx/config";
import { ApiSource, DocsSource } from "@/lib/source";

const processor = remark()
  .use(remarkMdx)
  .use(remarkInclude)
  .use(remarkGfm);

export async function getLLMText(page: DocsSource | ApiSource) {
  const processed = await processor.process({
    path: page.data._file.absolutePath,
    value: page.data.content,
  });

  return `# ${page.data.title}
URL: ${page.url}

${processed.value}`;
}
