CREATE TABLE "ThemedWeek" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "ctaHref" TEXT NOT NULL,
  "ctaLabel" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ThemedWeek_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ThemedWeek_slug_key" ON "ThemedWeek"("slug");
CREATE INDEX "ThemedWeek_startDate_endDate_idx" ON "ThemedWeek"("startDate", "endDate");
CREATE INDEX "ThemedWeek_sortOrder_startDate_idx" ON "ThemedWeek"("sortOrder", "startDate");
