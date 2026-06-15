import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDocumentBySlug } from "@/lib/content";
import { buildLegalDocumentMetadata } from "@/lib/content/metadata";
import { LegalDocumentPage } from "@/views/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocumentBySlug("refund-policy");
  return buildLegalDocumentMetadata({
    slug: "refund-policy",
    title: doc?.seoTitle || doc?.title || "Refund & Cancellation Policy",
    description: doc?.seoDescription,
  });
}

export default async function Page() {
  const doc = await getLegalDocumentBySlug("refund-policy");
  if (!doc) notFound();

  return <LegalDocumentPage document={doc} />;
}
