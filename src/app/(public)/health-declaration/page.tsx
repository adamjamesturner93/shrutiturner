import type { Metadata } from "next";
import { HealthDeclarationPage } from "@/views/health-declaration";

export const metadata: Metadata = { title: "Health Declaration" };

export default function Page() {
  return <HealthDeclarationPage />;
}
