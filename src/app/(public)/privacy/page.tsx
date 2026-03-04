import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDocumentBySlug } from "@/lib/content";
import { LegalDocumentPage } from "@/views/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocumentBySlug("privacy");
  if (!doc) return { title: "Privacy" };

  return {
    title: doc.seoTitle || doc.title,
    description: doc.seoDescription,
  };
}

export default async function Page() {
  const doc = await getLegalDocumentBySlug("privacy");
  if (!doc) notFound();

  return <LegalDocumentPage document={doc} />;
}
