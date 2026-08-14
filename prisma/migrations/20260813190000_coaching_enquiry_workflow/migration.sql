ALTER TYPE "AcceptanceType" ADD VALUE IF NOT EXISTS 'coaching_agreement';

ALTER TYPE "CoachingApplicationStatus" ADD VALUE IF NOT EXISTS 'consultation_scheduled';
ALTER TYPE "CoachingApplicationStatus" ADD VALUE IF NOT EXISTS 'consultation_completed';
ALTER TYPE "CoachingApplicationStatus" ADD VALUE IF NOT EXISTS 'offer_sent';

CREATE TYPE "CoachingConsultationStatus" AS ENUM (
  'not_scheduled',
  'scheduled',
  'completed',
  'cancelled'
);

ALTER TABLE "CoachingApplication"
  ADD COLUMN "applicantName" TEXT,
  ADD COLUMN "enquiryConsentVersion" TEXT,
  ADD COLUMN "enquiryConsentText" TEXT,
  ADD COLUMN "enquiryConsentedAt" TIMESTAMP(3),
  ADD COLUMN "consultationStatus" "CoachingConsultationStatus" NOT NULL DEFAULT 'not_scheduled',
  ADD COLUMN "consultationScheduledAt" TIMESTAMP(3),
  ADD COLUMN "consultationCompletedAt" TIMESTAMP(3),
  ADD COLUMN "consultationNotes" TEXT,
  ADD COLUMN "recommendedOfferKey" TEXT,
  ADD COLUMN "offerSentAt" TIMESTAMP(3);

ALTER TABLE "CoachingApplication"
  ALTER COLUMN "coachingAgreementAcceptedAt" DROP NOT NULL;

UPDATE "CoachingApplication"
SET
  "applicantName" = TRIM(CONCAT("applicantFirstName", ' ', "applicantLastName")),
  "recommendedOfferKey" = CASE
    WHEN "answersJson"->>'offerKey' IN (
      'guided_accountability',
      'independent_training_plan',
      'guided_training_plan',
      'one_to_one_coaching'
    ) THEN "answersJson"->>'offerKey'
    ELSE NULL
  END
WHERE "applicantName" IS NULL;

CREATE INDEX "CoachingApplication_consultationStatus_consultationScheduledAt_idx"
  ON "CoachingApplication"("consultationStatus", "consultationScheduledAt");

CREATE INDEX "CoachingApplication_recommendedOfferKey_status_idx"
  ON "CoachingApplication"("recommendedOfferKey", "status");
