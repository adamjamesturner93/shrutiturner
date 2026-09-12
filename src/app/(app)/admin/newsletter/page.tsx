import { AdminNewsletter } from "@/views/admin/newsletter";
import { Suspense } from "react";
import AdminLoading from "../loading";

export default function Page() {
  return <Suspense fallback={<AdminLoading />}><AdminNewsletter /></Suspense>;
}
