ALTER TABLE "BlogReaction"
  ALTER COLUMN "userId" DROP NOT NULL,
  ADD COLUMN "anonymousToken" TEXT;

CREATE UNIQUE INDEX "BlogReaction_postSlug_anonymousToken_key"
  ON "BlogReaction"("postSlug", "anonymousToken");
