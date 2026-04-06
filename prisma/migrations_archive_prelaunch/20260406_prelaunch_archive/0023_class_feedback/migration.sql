CREATE TYPE "PostClassFeeling" AS ENUM ('great', 'good', 'okay', 'tough', 'too_much');

ALTER TABLE "ClassBooking"
ADD COLUMN "preClassEnergyLevel" INTEGER,
ADD COLUMN "preClassFlareToday" BOOLEAN,
ADD COLUMN "preClassSubmittedAt" TIMESTAMP(3),
ADD COLUMN "postClassFeeling" "PostClassFeeling",
ADD COLUMN "postClassSubmittedAt" TIMESTAMP(3);
