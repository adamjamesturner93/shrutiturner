import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createPrivacyExportRequest, downloadPrivacyExportRequest } from "@/lib/privacy/service";

const EMAIL_PREFIX = "integration-privacy-user-";

async function cleanupRows() {
  await db.adminActionLog.deleteMany({
    where: {
      actor: {
        email: {
          startsWith: EMAIL_PREFIX,
        },
      },
    },
  });
  await db.privacyRequest.deleteMany({
    where: {
      OR: [
        { user: { email: { startsWith: EMAIL_PREFIX } } },
        { actor: { email: { startsWith: EMAIL_PREFIX } } },
      ],
    },
  });
  await db.contactSubmission.deleteMany({
    where: {
      email: {
        startsWith: EMAIL_PREFIX,
      },
    },
  });
  await db.healthConditionSelection.deleteMany({
    where: {
      profile: {
        user: {
          email: {
            startsWith: EMAIL_PREFIX,
          },
        },
      },
    },
  });
  await db.healthProfile.deleteMany({
    where: {
      user: {
        email: {
          startsWith: EMAIL_PREFIX,
        },
      },
    },
  });
  await db.user.deleteMany({
    where: {
      email: {
        startsWith: EMAIL_PREFIX,
      },
    },
  });
}

function makeEmail(label: string) {
  return `${EMAIL_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe("privacy service", () => {
  beforeEach(async () => {
    await cleanupRows();
  });

  afterAll(async () => {
    await cleanupRows();
  });

  it("generates a downloadable ZIP export with manifest metadata and section files", async () => {
    const actor = await db.user.create({
      data: {
        email: makeEmail("owner"),
        firstName: "Owner",
        lastName: "Admin",
        role: "owner_admin",
      },
    });
    const user = await db.user.create({
      data: {
        email: makeEmail("member"),
        firstName: "Casey",
        lastName: "Member",
      },
    });

    await db.healthProfile.create({
      data: {
        userId: user.id,
      },
    });
    await db.contactSubmission.create({
      data: {
        userId: user.id,
        firstName: "Casey",
        lastName: "Member",
        email: user.email,
        topic: "classes",
        message: "I would like more information.",
      },
    });

    const created = await createPrivacyExportRequest(actor.id, user.id);
    const downloaded = await downloadPrivacyExportRequest(created.request.id);
    const archiveText = downloaded.archive.toString("utf8");

    expect(downloaded.fileName).toContain(created.request.id);
    expect(downloaded.contentType).toBe("application/zip");
    expect(downloaded.archive.subarray(0, 2).toString("utf8")).toBe("PK");
    expect(created.includedSections).toContain("account");
    expect(created.includedSections).toContain("privacy-requests");
    expect(created.rowCounts.account).toBe(1);
    expect(created.rowCounts["contact-submissions"]).toBe(1);
    expect(archiveText).toContain("README.txt");
    expect(archiveText).toContain("manifest.json");
    expect(archiveText).toContain("account.json");
    expect(archiveText).toContain("privacy-requests.json");
  });
});
