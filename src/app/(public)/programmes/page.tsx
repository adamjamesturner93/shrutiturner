import { PublicPageLoading } from "@/components/public-loading";
import { Suspense } from "react";
import { connection } from "next/server";
import { getProgrammeCatalogue } from "@/lib/programmes/public-service";
import { PublicProgrammeCatalogue } from "@/views/programmes/public-catalogue";
async function Catalogue() {
  await connection();
  return <PublicProgrammeCatalogue data={await getProgrammeCatalogue()} />;
}
export default function Page() {
  return (
    <Suspense fallback={<PublicPageLoading label="Loading programmes" />}>
      <Catalogue />
    </Suspense>
  );
}
