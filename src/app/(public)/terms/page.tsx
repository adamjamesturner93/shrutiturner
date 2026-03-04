import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDocumentBySlug } from "@/lib/content";
import { LegalDocumentPage } from "@/views/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocumentBySlug("terms");
  if (!doc) return { title: "Terms" };

  return {
    title: doc.seoTitle || doc.title,
    description: doc.seoDescription,
  };
}

export default async function Page() {
  const doc = await getLegalDocumentBySlug("terms");
  if (!doc) notFound();

  return <LegalDocumentPage document={doc} />;
}
