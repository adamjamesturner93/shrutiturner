import { connection, NextResponse } from "next/server";
import { listOperationalRetreats } from "@/lib/retreats/service";

export async function GET() {
  await connection();
  const items = await listOperationalRetreats();
  return NextResponse.json({ items });
}
