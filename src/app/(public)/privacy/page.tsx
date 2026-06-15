import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDocumentBySlug } from "@/lib/content";
import { buildLegalDocumentMetadata } from "@/lib/content/metadata";
import { isHoldingStage } from "@/lib/site-stage";
import { HoldingPrivacyPage } from "@/views/holding-privacy-page";
import { LegalDocumentPage } from "@/views/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  if (isHoldingStage()) {
    return buildLegalDocumentMetadata({
      slug: "privacy",
      title: "Privacy",
      description: "Privacy information for the holding-page newsletter signup.",
      noIndex: true,
    });
  }

  const doc = await getLegalDocumentBySlug("privacy");
  return buildLegalDocumentMetadata({
    slug: "privacy",
    title: doc?.seoTitle || doc?.title || "Privacy",
    description: doc?.seoDescription,
  });
}

export default async function Page() {
  if (isHoldingStage()) {
    return <HoldingPrivacyPage />;
  }

  const doc = await getLegalDocumentBySlug("privacy");
  if (!doc) notFound();

  return <LegalDocumentPage document={doc} />;
}
