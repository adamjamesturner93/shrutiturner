ALTER TABLE "User"
ADD COLUMN "acceptedTermsVersion" TEXT,
ADD COLUMN "acceptedHealthWaiverVersion" TEXT,
ADD COLUMN "hasConsentedToHealthData" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "acceptedHealthDataConsentVersion" TEXT,
ADD COLUMN "healthDataConsentedAt" TIMESTAMP(3);
