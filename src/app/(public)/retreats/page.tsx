import { RetreatsPage } from "@/views/retreats";
import { listOperationalRetreats } from "@/lib/retreats/service";

export default async function Page() {
  const retreats = await listOperationalRetreats();
  return <RetreatsPage retreats={retreats} />;
}
