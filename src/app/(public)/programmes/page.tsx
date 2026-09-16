import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { db } from "@/lib/db";
import { Layout } from "@/components/layout";
async function Catalogue() {
  await connection();
  const rows = await db.smallGroupProgramme.findMany({
    where: { cohortState: { in: ["on_sale", "confirmed", "active"] } },
  });
  return (
    <Layout>
      <section className="mx-auto max-w-4xl space-y-6 p-8">
        <h1 className="text-4xl">Programmes</h1>
        <p>Small, defined programmes coached by Shruti.</p>
        {rows.map((c) => (
          <article className="rounded border p-5" key={c.id}>
            <h2>
              <Link className="underline" href={`/programmes/${c.runSlug}`}>
                {c.title}
              </Link>
            </h2>
          </article>
        ))}
        {!rows.length && <p>New programmes will be announced here.</p>}
      </section>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p>Loading programmes…</p>}>
      <Catalogue />
    </Suspense>
  );
}
