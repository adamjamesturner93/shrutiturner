ALTER TABLE "User"
  ADD COLUMN "hasAgreedToTerms" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hasAgreedToHealth" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "termsAgreedAt" TIMESTAMP(3),
  ADD COLUMN "healthAgreedAt" TIMESTAMP(3),
  ADD COLUMN "heardAboutSource" TEXT,
  ADD COLUMN "heardAboutDetail" TEXT;
