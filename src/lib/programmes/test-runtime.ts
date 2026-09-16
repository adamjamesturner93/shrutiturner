import "server-only";
/** Provider substitutes are permitted only in an explicitly isolated, local non-production test process. */
export function programmeTestRuntime() {
  if (
    process.env.PROGRAMME_TEST_MODE !== "1" ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL
  )
    return false;
  const url = new URL(process.env.DATABASE_URL || "http://invalid");
  return ["127.0.0.1", "localhost"].includes(url.hostname);
}
