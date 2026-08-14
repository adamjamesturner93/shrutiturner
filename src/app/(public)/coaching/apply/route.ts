import { type NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/coaching/enquire", request.url), 301);
}

export function HEAD(request: NextRequest) {
  return NextResponse.redirect(new URL("/coaching/enquire", request.url), 301);
}
