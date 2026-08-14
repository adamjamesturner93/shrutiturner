import { NextResponse } from "next/server";

function redirectToSupportLevels(request: Request) {
  return NextResponse.redirect(new URL("/coaching#support-levels", request.url), 301);
}

export function GET(request: Request) {
  return redirectToSupportLevels(request);
}

export function HEAD(request: Request) {
  return redirectToSupportLevels(request);
}
