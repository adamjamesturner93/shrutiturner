ALTER TYPE "MembershipPlan" RENAME TO "MembershipPlan_old";
CREATE TYPE "MembershipPlan" AS ENUM ('movewell', 'instructor');

ALTER TABLE "MembershipSubscription"
ALTER COLUMN "plan" TYPE "MembershipPlan"
USING (
  CASE
    WHEN "plan"::text IN ('steady', 'committed', 'unlimited') THEN 'movewell'
    ELSE "plan"::text
  END::"MembershipPlan"
);

DROP TYPE "MembershipPlan_old";
