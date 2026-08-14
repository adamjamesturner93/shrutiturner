import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "This application route has been replaced by the coaching enquiry form." },
    { status: 410 }
  );
}
