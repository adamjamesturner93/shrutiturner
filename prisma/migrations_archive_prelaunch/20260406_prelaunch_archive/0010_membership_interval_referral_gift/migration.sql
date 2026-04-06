CREATE TYPE "MembershipBillingInterval" AS ENUM ('monthly', 'annual');

ALTER TABLE "MembershipSubscription"
ADD COLUMN "billingInterval" "MembershipBillingInterval" NOT NULL DEFAULT 'monthly';

ALTER TABLE "ReferralEvent"
ADD COLUMN "giftGrantedAt" TIMESTAMP(3);
