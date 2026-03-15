import { redirect } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearch)) {
    if (typeof value === "string") query.set(key, value);
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  redirect(`/classes/small-group/${slug}/checkout${suffix}`);
}
