import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDocumentBySlug } from "@/lib/content";
import { isHoldingStage } from "@/lib/site-stage";
import { HoldingPrivacyPage } from "@/views/holding-privacy-page";
import { LegalDocumentPage } from "@/views/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  if (isHoldingStage()) {
    return {
      title: "Privacy",
      description: "Privacy information for the holding-page newsletter signup.",
    };
  }

  const doc = await getLegalDocumentBySlug("privacy");
  if (!doc) return { title: "Privacy" };

  return {
    title: doc.seoTitle || doc.title,
    description: doc.seoDescription,
  };
}

export default async function Page() {
  if (isHoldingStage()) {
    return <HoldingPrivacyPage />;
  }

  const doc = await getLegalDocumentBySlug("privacy");
  if (!doc) notFound();

  return <LegalDocumentPage document={doc} />;
}
