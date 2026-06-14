import { describe, expect, it } from "vitest";
import {
  buildImportPlan,
  buildUserMapping,
  parsePgDump,
  splitCopyRow,
} from "../../../scripts/data/import-legacy";

describe("legacy import tooling", () => {
  it("parses PostgreSQL COPY blocks and unescapes row values", () => {
    const dump = parsePgDump(`COPY public."User" (id, email, name) FROM stdin;
user_1\tperson@example.com\tA\\\\B\\tTabbed
\\.
COPY public."Newsletter" (id, subject) FROM stdin;
news_1\tHello
\\.
`);

    expect(dump.get("User")).toEqual([
      {
        id: "user_1",
        email: "person@example.com",
        name: "A\\B\tTabbed",
      },
    ]);
    expect(dump.get("Newsletter")?.[0]?.subject).toBe("Hello");
  });

  it("splits nulls and escaped new lines in COPY rows", () => {
    expect(splitCopyRow("one\t\\N\ttwo\\nlines")).toEqual(["one", null, "two\nlines"]);
  });

  it("normalises users by email and merges duplicate legacy accounts", () => {
    const users = [
      {
        id: "old_1",
        email: " Person@Example.com ",
        name: "First User",
        stripeCustomerId: null,
        createdAt: "2026-01-01 10:00:00",
        updatedAt: "2026-01-01 10:00:00",
        terms: "t",
        terms_signed_on: "2026-01-01T10:00:00.000Z",
        waiver: "f",
        medical_consent: "f",
        marketing: "f",
      },
      {
        id: "old_2",
        email: "person@example.com",
        name: "Second User",
        stripeCustomerId: "cus_123",
        createdAt: "2026-01-02 10:00:00",
        updatedAt: "2026-01-02 10:00:00",
        terms: "f",
        waiver: "t",
        waiver_signed_on: "2026-01-02T10:00:00.000Z",
        medical_consent: "t",
        medical_consent_signed_on: "2026-01-02T10:00:00.000Z",
        marketing: "t",
        marketing_signed_on: "2026-01-02T10:00:00.000Z",
      },
    ];

    const mapping = buildUserMapping(users, []);

    expect(mapping.users).toHaveLength(1);
    expect(mapping.duplicateEmailsMerged).toBe(1);
    expect(mapping.userIdByLegacyId.get("old_1")).toBe("old_2");
    expect(mapping.userIdByLegacyId.get("old_2")).toBe("old_2");
    expect(mapping.users[0]).toMatchObject({
      id: "old_2",
      email: "person@example.com",
      name: "Second User",
      stripeCustomerId: "cus_123",
      hasAgreedToTerms: true,
      hasAgreedToHealth: true,
      hasConsentedToHealthData: true,
      marketing: true,
    });
  });

  it("builds a dry-run plan without reactivating retired product inventory", () => {
    const dump =
      parsePgDump(`COPY public."User" (id, name, email, marketing, marketing_signed_on, "createdAt", "updatedAt") FROM stdin;
u1\tTest User\ttest@example.com\tt\t2026-01-01T10:00:00.000Z\t2026-01-01 10:00:00\t2026-01-01 10:00:00
\\.
COPY public."Health" (id, "createdAt", "userId", autoimmune, autoimmune_details) FROM stdin;
h1\t2026-01-01 10:00:00\tu1\tt\tPsoriatic arthritis
\\.
COPY public."LiveOnlineClass" (id, title) FROM stdin;
c1\tOld class
\\.
`);

    const plan = buildImportPlan(dump, {
      apply: false,
      source: "fixture.sql",
      target: "local",
    });

    expect(plan.users.normalizedUsers).toBe(1);
    expect(plan.newsletterSubscribers).toBe(1);
    expect(plan.healthProfiles).toBe(1);
    expect(plan.healthSelections).toBe(1);
    expect(plan.skippedRetiredProductRows.LiveOnlineClass).toBe(1);
  });
});
