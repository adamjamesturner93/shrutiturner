import { NextRequest, NextResponse } from "next/server";
import { readReceipt, RECEIPT_COOKIE } from "@/lib/analytics/receipt";
import { CONSENT_COOKIE } from "@/lib/analytics/contracts";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  const receipt =
    request.cookies.get(CONSENT_COOKIE)?.value === "granted"
      ? readReceipt(request.cookies.get(RECEIPT_COOKIE)?.value)
      : null;
  const response = NextResponse.json(
    receipt ? { id: receipt.id, source: receipt.source, guide: receipt.guide } : {},
    { headers: { "Cache-Control": "no-store" } }
  );
  response.cookies.set(RECEIPT_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  const response = new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
  response.cookies.set(RECEIPT_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
