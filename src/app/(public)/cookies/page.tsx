import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDocumentBySlug } from "@/lib/content";
import { buildLegalDocumentMetadata } from "@/lib/content/metadata";
import { LegalDocumentPage } from "@/views/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocumentBySlug("cookies");
  return buildLegalDocumentMetadata({
    slug: "cookies",
    title: doc?.seoTitle || doc?.title || "Cookies",
    description: doc?.seoDescription,
  });
}

export default async function Page() {
  const doc = await getLegalDocumentBySlug("cookies");
  if (!doc) notFound();

  return <LegalDocumentPage document={doc} />;
}
