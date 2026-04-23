CREATE TABLE IF NOT EXISTS "nasabah_survey_notes" (
  "id" TEXT NOT NULL,
  "nasabahId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "actorId" TEXT,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "nasabah_survey_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "nasabah_survey_notes_companyId_nasabahId_createdAt_idx"
  ON "nasabah_survey_notes"("companyId", "nasabahId", "createdAt");

CREATE INDEX IF NOT EXISTS "nasabah_survey_notes_actorId_createdAt_idx"
  ON "nasabah_survey_notes"("actorId", "createdAt");

DO $$
BEGIN
  ALTER TABLE "nasabah_survey_notes"
    ADD CONSTRAINT "nasabah_survey_notes_nasabahId_fkey"
    FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "nasabah_survey_notes"
    ADD CONSTRAINT "nasabah_survey_notes_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "nasabah_survey_notes"
    ADD CONSTRAINT "nasabah_survey_notes_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
