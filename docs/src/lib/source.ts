import { api, docs } from "@/.source";
import { InferPageType, loader } from "fumadocs-core/source";

export const docsSource = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});

export const apiSource = loader({
  baseUrl: "/api",
  source: api.toFumadocsSource(),
});

export type DocsSource = InferPageType<typeof docsSource>;
export type ApiSource = InferPageType<typeof apiSource>;
