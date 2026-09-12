import { AdminBusiness } from "@/views/admin/business";
import { Suspense } from "react";
import AdminLoading from "../loading";

export default function Page() {
  return <Suspense fallback={<AdminLoading />}><AdminBusiness /></Suspense>;
}
