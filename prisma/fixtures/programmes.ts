import type { PrismaClient } from "@prisma/client";

export const programmeFixtureUsers = [
  ["alex.account", "Alex", "Account"],
  ["casey.coaching", "Casey", "Coaching"],
  ["priya.programme", "Priya", "Programme"],
  ["jamie.health", "Jamie", "Health"],
  ["morgan.review", "Morgan", "Review"],
  ["taylor.considerations", "Taylor", "Considerations"],
  ["robin.retreat", "Robin", "Retreat"],
  ["sam.workshop", "Sam", "Workshop"],
  ["drew.events", "Drew", "Events"],
  ["jordan.multi", "Jordan", "Multi"],
  ["avery.everything", "Avery", "Everything"],
  ["riley.history", "Riley", "History"],
  ["pat.purchaser", "Pat", "Purchaser"],
  ["gift.participant", "Gift", "Participant"],
  ["coach", "Test", "Coach"],
] as const;
export const fixtureThemes = [
  "Start Where You Are",
  "Build The Foundations",
  "Build From There",
  "Adapt When Life Happens",
  "Keep Going",
];
export const fixtureExercises = [
  ["box-squat", "Box squat", "3 x 8"],
  ["incline-push-up", "Incline push-up", "3 x 8"],
  ["supported-row", "Supported row", "3 x 10"],
  ["glute-bridge", "Glute bridge", "3 x 10"],
];
export const fixtureReflections = [
  "What did you learn about your current starting point this week?",
  "Was there an exercise or variation that started making more sense?",
  "Where have you noticed you can do a little more?",
  "What did you adapt this week instead of abandoning altogether?",
  "What are you taking forward from these five weeks?",
];
export async function createJanuaryDraft(db: PrismaClient) {
  const definition = await db.programmeDefinition.upsert({
    where: { slug: "rebuilding-your-strength" },
    create: { slug: "rebuilding-your-strength", title: "Rebuilding Your Strength" },
    update: {},
  });
  const cohort = await db.smallGroupProgramme.upsert({
    where: { runSlug: "rebuilding-your-strength-jan-27" },
    create: {
      id: "rys-january-2027",
      slug: "rebuilding-your-strength-jan-27",
      runSlug: "rebuilding-your-strength-jan-27",
      templateSlug: definition.slug,
      definitionId: definition.id,
      title: "Rebuilding Your Strength — Jan '27",
      shortDescription: "",
      durationLabel: "Five coached weeks",
      durationWeeks: 5,
      cohortSize: 0,
      pricePence: 0,
      cohortState: "draft",
      startDate: new Date("2027-01-25T00:00:00Z"),
      liveCoachingEndsAt: new Date("2027-02-26T00:00:00Z"),
      structuredProgrammeEndsAt: new Date("2027-02-27T00:00:00Z"),
      followUpAccessEndsAt: new Date("2027-03-31T23:00:00Z"),
      confirmationDeadline: new Date("2027-01-18T09:00:00Z"),
      communityOpenAt: new Date("2027-01-22T09:00:00Z"),
      enrolmentClosesAt: new Date("2027-01-24T18:00:00Z"),
      minimumParticipants: 4,
    },
    update: {},
  });
  for (let i = 0; i < 5; i++) {
    const release = new Date(Date.UTC(2027, 0, 25 + i * 7));
    const session = await db.smallGroupProgrammeSession.upsert({
      where: { programmeId_sequenceNumber: { programmeId: cohort.id, sequenceNumber: i + 1 } },
      create: {
        id: `${cohort.id}-session-${i + 1}`,
        programmeId: cohort.id,
        sequenceNumber: i + 1,
        title: `Week ${i + 1} Live Workout`,
        startsAt: release,
      },
      update: {},
    });
    await db.programmeWeek.upsert({
      where: { programmeId_number: { programmeId: cohort.id, number: i + 1 } },
      create: {
        id: `${cohort.id}-week-${i + 1}`,
        programmeId: cohort.id,
        number: i + 1,
        title: fixtureThemes[i],
        theme: i === 0 ? "What Strength Means Here" : fixtureThemes[i],
        releasesAt: release,
        reflectionAt: new Date(release.getTime() + 4 * 86400000 + 9 * 3600000),
        reflection: fixtureReflections[i],
        sessionId: session.id,
      },
      update: {},
    });
  }
  return cohort;
}
export async function seedProgrammeFixtures(db: PrismaClient) {
  if (
    !["localhost", "127.0.0.1"].includes(
      new URL(process.env.DATABASE_URL || "http://invalid").hostname
    )
  )
    throw new Error("Synthetic reset requires a local database");
  const fixtureCohorts = await db.smallGroupProgramme.findMany({
    where: { templateSlug: "rys-fixture" },
    select: { id: true },
  });
  const ids = fixtureCohorts.map((c) => c.id);
  const messages = await db.programmeMessage.findMany({
    where: { programmeId: { in: ids } },
    select: { id: true },
  });
  await db.emailDelivery.deleteMany({
    where: { id: { in: messages.map((m) => `programme-${m.id}`) } },
  });
  await db.replayAsset.deleteMany({ where: { smallGroupProgrammeId: { in: ids } } });
  await db.offeringClearance.deleteMany({ where: { programmeId: { in: ids } } });
  await db.smallGroupProgramme.deleteMany({ where: { id: { in: ids } } });
  const users: Record<string, string> = {};
  for (const [name, firstName, lastName] of programmeFixtureUsers) {
    const u = await db.user.upsert({
      where: { email: `${name}@example.test` },
      create: {
        id: `rys-user-${name}`,
        email: `${name}@example.test`,
        firstName,
        lastName,
        role: name === "coach" ? "admin" : "student",
        emailVerified: new Date("2026-12-01"),
        isOnboarded: true,
      },
      update: {},
    });
    users[name] = u.id;
  }
  await db.offeringClearance.deleteMany({
    where: {
      userId: { in: Object.values(users) },
      offeringKey: { startsWith: "event:rys-event-" },
    },
  });
  await db.healthProfile.deleteMany({ where: { userId: { in: Object.values(users) } } });
  const definition = await db.programmeDefinition.upsert({
    where: { slug: "rys-fixture" },
    create: { slug: "rys-fixture", title: "Rebuilding Your Strength (synthetic)" },
    update: {},
  });
  const states = [
    ["draft", "draft"],
    ["on-sale", "on_sale"],
    ["pre-start", "confirmed"],
    ["active-week1", "active"],
    ["active-week3", "active"],
    ["follow-up", "follow_up"],
    ["archived", "archived"],
    ["cancelled", "cancelled"],
    ["below-minimum", "on_sale"],
    ["teaching", "active"],
  ] as const;
  for (const [key, state] of states) {
    const id = `rys-${key}`;
    const common = {
      definitionId: definition.id,
      cohortState: state,
      confirmedAt: ["draft", "on_sale", "cancelled"].includes(state)
        ? null
        : new Date("2027-01-18T09:00:00Z"),
      startDate: new Date("2027-01-25T00:00:00Z"),
      liveCoachingEndsAt: new Date("2027-02-26T00:00:00Z"),
      structuredProgrammeEndsAt: new Date("2027-02-27T00:00:00Z"),
      followUpAccessEndsAt: new Date("2027-03-31T23:00:00Z"),
      confirmationDeadline: new Date("2027-01-18T09:00:00Z"),
      communityOpenAt: new Date("2027-01-22T09:00:00Z"),
      enrolmentClosesAt: new Date("2027-01-24T18:00:00Z"),
      enrolmentOpen: state !== "cancelled",
      salePricePence: state === "draft" ? null : 10000,
      maximumParticipants: state === "draft" ? null : 20,
      minimumParticipants: 4,
      salesCopy: "Synthetic programme sales copy for automated tests.",
      equipment: "A sturdy chair and resistance band.",
      refundWording: "Synthetic cancellation policy: full refund if the cohort is cancelled.",
      closingBody: "What Next? Keep strength training sustainable and repeat the workouts.",
      creditActive: false,
    };
    await db.smallGroupProgramme.upsert({
      where: { id },
      create: {
        id,
        slug: id,
        runSlug: id,
        templateSlug: definition.slug,
        title: `Rebuilding Your Strength — ${key}`,
        shortDescription: "Five supported weeks. Synthetic test programme.",
        durationLabel: "Five weeks",
        durationWeeks: 5,
        cohortSize: 20,
        pricePence: 10000,
        ...common,
      },
      update: common,
    });
    await db.smallGroupProgrammeInstructorAssignment.upsert({
      where: { programmeId_userId: { programmeId: id, userId: users.coach } },
      create: { programmeId: id, userId: users.coach },
      update: {},
    });
    for (let i = 0; i < 5; i++) {
      const releasesAt = new Date(Date.UTC(2027, 0, 25 + i * 7));
      const startsAt = new Date(releasesAt.getTime() + 2 * 86400000 + 18.5 * 3600000);
      const sid = `${id}-s${i + 1}`;
      const completed = ["follow-up", "archived"].includes(key);
      await db.smallGroupProgrammeSession.upsert({
        where: { id: sid },
        create: {
          id: sid,
          programmeId: id,
          title: `Week ${i + 1} Live Workout`,
          sequenceNumber: i + 1,
          startsAt,
          endsAt: new Date(startsAt.getTime() + 45 * 60000),
          exerciseKeys: fixtureExercises.map((e) => e[0]),
          status: completed ? "completed" : "scheduled",
          taughtAt: completed ? new Date(startsAt.getTime() + 45 * 60000) : null,
        },
        update: {
          status: completed ? "completed" : "scheduled",
          taughtAt: completed ? new Date(startsAt.getTime() + 45 * 60000) : null,
        },
      });
      await db.programmeWeek.upsert({
        where: { id: `${id}-w${i + 1}` },
        create: {
          id: `${id}-w${i + 1}`,
          programmeId: id,
          number: i + 1,
          title: fixtureThemes[i],
          theme: i === 0 ? "What Strength Means Here" : fixtureThemes[i],
          education: `Week ${i + 1} education: strength starts with your own starting point.`,
          takeaways: ["Start where you are", "Choose a sustainable variation", "Ask questions"],
          releasesAt,
          published: true,
          workoutPublished: true,
          sessionId: sid,
          reflection: fixtureReflections[i],
          reflectionAt: new Date(releasesAt.getTime() + 4 * 86400000 + 9 * 3600000),
          workoutJson: fixtureExercises.map(([key, name, prescription]) => ({
            key,
            name,
            prescription,
            instruction: "Use a comfortable range.",
            alternatives: "Adjust your support.",
            sessionId: sid,
            timestamp: 60,
          })),
        },
        update: {},
      });
      if (completed)
        await db.replayAsset.upsert({
          where: { id: `${sid}-replay` },
          create: {
            id: `${sid}-replay`,
            resourceType: "small_group_programme_session",
            smallGroupProgrammeId: id,
            smallGroupProgrammeSessionId: sid,
            status: "ready",
            dailyRecordingId: `fixture-${sid}`,
          },
          update: {},
        });
    }
    const participants =
      key === "below-minimum"
        ? ["priya.programme", "jamie.health", "morgan.review"]
        : key === "archived"
          ? ["riley.history"]
          : [
              "priya.programme",
              "jamie.health",
              "morgan.review",
              "taylor.considerations",
              "jordan.multi",
              "avery.everything",
              "gift.participant",
            ];
    for (const name of participants) {
      const userId = users[name];
      const eid = `${id}-${name}`;
      await db.smallGroupProgrammeEnrollment.upsert({
        where: { id: eid },
        create: {
          id: eid,
          programmeId: id,
          userId,
          attendeeName: programmeFixtureUsers
            .find((u) => u[0] === name)!
            .slice(1)
            .join(" "),
          attendeeEmail: `${name}@example.test`,
          purchaserEmail:
            name === "gift.participant" ? "pat.purchaser@example.test" : `${name}@example.test`,
          status: key === "cancelled" ? "cancelled" : "active",
          paidAt: new Date("2027-01-10"),
          pricePaidPence: 10000,
          acceptedAgreementVersion: "1",
          stripePaymentIntentId: `pi_fixture_${eid}`,
        },
        update: {},
      });
      if (name !== "jamie.health") {
        const health = await db.healthProfile.upsert({
          where: { userId },
          create: {
            userId,
            declarationStatus: ["morgan.review", "taylor.considerations"].includes(name)
              ? "context_declared"
              : "none_declared",
            lastUpdatedAt: new Date("2027-01-01"),
            lastConfirmedAt: new Date("2027-01-10"),
          },
          update: {},
        });
        await db.offeringClearance.upsert({
          where: { userId_offeringKey: { userId, offeringKey: `programme:${id}` } },
          create: {
            id: `${eid}-clearance`,
            userId,
            programmeId: id,
            offeringKey: `programme:${id}`,
            healthRevision: health.lastUpdatedAt.toISOString(),
            confirmedAt: new Date("2027-01-10"),
            status:
              name === "morgan.review"
                ? "pending_review"
                : name === "taylor.considerations"
                  ? "cleared_with_considerations"
                  : "cleared",
            considerations:
              name === "taylor.considerations" ? "SYNTHETIC_PRIVATE_CONSIDERATION" : "",
          },
          update: {},
        });
      }
    }
  }
  for (const name of ["casey.coaching", "jordan.multi", "avery.everything"])
    await db.coachingClientProfile.upsert({
      where: { userId: users[name] },
      create: { userId: users[name], tier: "coached_plan", status: "active" },
      update: {},
    });
  for (const kind of ["retreat", "workshop"] as const) {
    const id = `rys-event-${kind}`;
    await db.retreatDate.upsert({
      where: { id },
      create: {
        id,
        externalDateId: id,
        retreatSlug: id,
        retreatTitleSnapshot: kind === "retreat" ? "Stirling Retreat" : "The Middle Ground",
        retreatLocationSnapshot: "Synthetic venue",
        retreatType: kind === "retreat" ? "in_person" : "online",
        startsAt: new Date("2027-06-11T09:00:00Z"),
        endsAt: new Date("2027-06-13T15:00:00Z"),
        capacity: 20,
        status: "open",
        pricePence: 10000,
        depositAmountPence: 0,
      },
      update: {},
    });
    for (const name of [
      ...(kind === "retreat" ? ["robin.retreat"] : ["sam.workshop", "riley.history"]),
      "drew.events",
      "avery.everything",
    ]) {
      const uid = users[name];
      await db.retreatBooking.upsert({
        where: { id: `${id}-${name}` },
        create: {
          id: `${id}-${name}`,
          retreatDateId: id,
          purchaserUserId: uid,
          attendeeUserId: uid,
          purchaserFirstName: name,
          purchaserLastName: "Fixture",
          purchaserEmail: `${name}@example.test`,
          attendeeFirstName: name,
          attendeeLastName: "Fixture",
          attendeeEmail: `${name}@example.test`,
          phone: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          totalPricePence: 10000,
          depositAmountPence: 0,
          balanceAmountPence: 0,
          bookingStatus: "paid_in_full",
          paymentStatus: "paid_in_full",
        },
        update: {},
      });
    }
  }
  await db.retreatDate.upsert({
    where: { id: "rys-event-past-workshop" },
    create: {
      id: "rys-event-past-workshop",
      externalDateId: "rys-event-past-workshop",
      retreatSlug: "rys-event-past-workshop",
      retreatTitleSnapshot: "Sankalpa Workshop",
      retreatLocationSnapshot: "Synthetic venue",
      retreatType: "online",
      eventKind: "online_workshop",
      startsAt: new Date("2026-10-04T09:00Z"),
      endsAt: new Date("2026-10-04T11:00Z"),
      capacity: 20,
      status: "completed",
      pricePence: 10000,
      depositAmountPence: 0,
    },
    update: {},
  });
  await db.retreatBooking.update({
    where: { id: "rys-event-workshop-riley.history" },
    data: { retreatDateId: "rys-event-past-workshop" },
  });
  for (const type of ["terms", "health_waiver", "health_data"] as const) {
    let policy = await db.policyDocumentVersion.findFirst({ where: { type, isCurrent: true } });
    if (!policy)
      policy = await db.policyDocumentVersion.create({
        data: {
          type,
          slug: type,
          version: "rys-fixture-v1",
          label: `Synthetic ${type}`,
          isCurrent: true,
          publishedAt: new Date("2026-12-01"),
        },
      });
    for (const userId of Object.values(users))
      await db.acceptanceEvent.upsert({
        where: { id: `rys-acceptance-${userId}-${type}` },
        create: {
          id: `rys-acceptance-${userId}-${type}`,
          userId,
          type,
          policyVersionId: policy.id,
          version: policy.version,
          acceptanceSurface: "programme-fixture",
          acceptedAt: new Date("2027-01-10"),
        },
        update: {
          policyVersionId: policy.id,
          version: policy.version,
          acceptedAt: new Date("2027-01-10"),
        },
      });
  }
  return users;
}
