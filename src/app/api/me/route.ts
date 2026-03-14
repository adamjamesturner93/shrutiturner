import { connection, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth-user";
import { getAccount, updateAccount } from "@/lib/account/account-service";

function siteUrlFromRequest(request: Request) {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request) {
  try {
    await connection();
    const user = await requireSessionUser();
    const account = await getAccount(user.id, siteUrlFromRequest(request));
    return NextResponse.json(account);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/me failed", error);
    return NextResponse.json({ message: "Failed to load account" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const updated = await updateAccount(user.id, {
      firstName: typeof body.firstName === "string" ? body.firstName : undefined,
      lastName: typeof body.lastName === "string" ? body.lastName : undefined,
      dob: typeof body.dob === "string" ? body.dob : body.dob === null ? null : undefined,
      gender:
        typeof body.gender === "string" ? body.gender : body.gender === null ? null : undefined,
      ethnicity:
        typeof body.ethnicity === "string"
          ? body.ethnicity
          : body.ethnicity === null
            ? null
            : undefined,
      timezone: typeof body.timezone === "string" ? body.timezone : undefined,
      dateFormat: typeof body.dateFormat === "string" ? body.dateFormat : undefined,
      hasAgreedToTerms:
        typeof body.hasAgreedToTerms === "boolean" ? body.hasAgreedToTerms : undefined,
      hasAgreedToHealth:
        typeof body.hasAgreedToHealth === "boolean" ? body.hasAgreedToHealth : undefined,
      heardAboutSource:
        typeof body.heardAboutSource === "string"
          ? body.heardAboutSource
          : body.heardAboutSource === null
            ? null
            : undefined,
      heardAboutDetail:
        typeof body.heardAboutDetail === "string"
          ? body.heardAboutDetail
          : body.heardAboutDetail === null
            ? null
            : undefined,
      isOnboarded: typeof body.isOnboarded === "boolean" ? body.isOnboarded : undefined,
    });
    return NextResponse.json({ profile: updated });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "INVALID_DOB") {
        return NextResponse.json({ message: "Date of birth is invalid." }, { status: 400 });
      }
      if (error.message === "UNDER_18") {
        return NextResponse.json(
          { message: "You must be 18 or over to use this service." },
          { status: 400 }
        );
      }
      if (error.message === "INVALID_DATE_FORMAT") {
        return NextResponse.json({ message: "Invalid date format." }, { status: 400 });
      }
    }
    console.error("PATCH /api/me failed", error);
    return NextResponse.json({ message: "Failed to update account" }, { status: 500 });
  }
}
