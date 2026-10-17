import { listOperationalRetreats } from "@/lib/retreats/service";
import { buildRetreatNavigation } from "@/lib/retreats/navigation";

export async function GET() {
  try {
    return Response.json({ items: buildRetreatNavigation(await listOperationalRetreats()) });
  } catch {
    return Response.json({ items: [] }, { status: 503 });
  }
}
