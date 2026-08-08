-- Make the existing implicit no-subscription arrangement explicit before adding
-- the admin flow that moves a pro-bono client onto paid billing.
CREATE TYPE "CoachingBillingArrangement" AS ENUM ('paid', 'pro_bono');
CREATE TYPE "CoachingPackageChangeRequestType" AS ENUM ('package_change', 'paid_start');

ALTER TABLE "CoachingClientProfile"
ADD COLUMN "billingArrangement" "CoachingBillingArrangement" NOT NULL DEFAULT 'paid',
ADD COLUMN "billingStartsAt" TIMESTAMP(3);

UPDATE "CoachingClientProfile" AS profile
SET "billingArrangement" = 'pro_bono'
FROM "CoachingApplication" AS application
WHERE profile."applicationId" = application."id"
  AND application."status" = 'converted'
  AND profile."stripeSubscriptionId" IS NULL;

ALTER TABLE "CoachingPackageChangeRequest"
ADD COLUMN "requestType" "CoachingPackageChangeRequestType" NOT NULL DEFAULT 'package_change',
ADD COLUMN "billingStartsAt" TIMESTAMP(3);

CREATE INDEX "CoachingClientProfile_billingArrangement_status_idx"
ON "CoachingClientProfile"("billingArrangement", "status");

CREATE INDEX "CoachingPackageChangeRequest_requestType_status_billingStartsAt_idx"
ON "CoachingPackageChangeRequest"("requestType", "status", "billingStartsAt");
