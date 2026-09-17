ALTER TABLE "SmallGroupProgramme" ADD COLUMN "publicVisibility" TEXT NOT NULL DEFAULT 'hidden',
ADD COLUMN "publicImageUrl" TEXT, ADD COLUMN "publicImageAlt" TEXT;
ALTER TABLE "PlatformSetting" ADD COLUMN "programmeCatalogueIntro" TEXT, ADD COLUMN "programmeCatalogueEmpty" TEXT;
