-- Extend membership lifecycle: add CALON state for prospective members.
DO $$
BEGIN
  ALTER TYPE "StatusNasabah" ADD VALUE IF NOT EXISTS 'CALON';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- New nasabah records now start as CALON.
ALTER TABLE "nasabah"
  ALTER COLUMN "status" SET DEFAULT 'CALON';

-- Support tenant-scoped status filtering for lifecycle dashboards/queries.
CREATE INDEX IF NOT EXISTS "nasabah_companyId_status_idx"
  ON "nasabah"("companyId", "status");
