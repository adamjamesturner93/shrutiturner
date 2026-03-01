import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Shruti Turner",
    template: "%s | Shruti Turner",
  },
  description:
    "Science-backed strength and yoga coaching for adults with chronic illness, autoimmune conditions, and complex bodies.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
