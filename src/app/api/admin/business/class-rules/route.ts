import { NextResponse } from "next/server";

const retiredResponse = () =>
  NextResponse.json(
    { message: "Weekly class rules have been retired. Online retreat rooms use retreat settings." },
    { status: 410 }
  );

export async function GET() {
  return retiredResponse();
}

export async function PATCH() {
  return retiredResponse();
}
