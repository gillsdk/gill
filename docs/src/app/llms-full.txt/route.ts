import { docsSource, apiSource } from "@/lib/source";
import { getLLMText } from "@/lib/get-llm-text";

// cached forever
export const revalidate = false;

export async function GET() {
  const docsScan = docsSource.getPages().map(getLLMText);
  const apiScan = apiSource.getPages().map(getLLMText);
  const scanned = await Promise.all([...docsScan, ...apiScan]);

  return new Response(scanned.join("\n\n"));
}
