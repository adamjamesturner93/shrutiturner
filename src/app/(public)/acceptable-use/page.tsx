import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDocumentBySlug } from "@/lib/content";
import { buildLegalDocumentMetadata } from "@/lib/content/metadata";
import { LegalDocumentPage } from "@/views/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocumentBySlug("acceptable-use");
  return buildLegalDocumentMetadata({
    slug: "acceptable-use",
    title: doc?.seoTitle || doc?.title || "Acceptable Use Policy",
    description: doc?.seoDescription,
  });
}

export default async function Page() {
  const doc = await getLegalDocumentBySlug("acceptable-use");
  if (!doc) notFound();

  return <LegalDocumentPage document={doc} />;
}
