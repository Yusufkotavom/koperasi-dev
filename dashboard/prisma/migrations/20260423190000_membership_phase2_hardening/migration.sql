CREATE TABLE IF NOT EXISTS "member_counters" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "nextNumber" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "member_counters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "member_counters_companyId_key"
  ON "member_counters"("companyId");

CREATE INDEX IF NOT EXISTS "member_counters_companyId_idx"
  ON "member_counters"("companyId");

DO $$
BEGIN
  ALTER TABLE "member_counters"
    ADD CONSTRAINT "member_counters_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "kelompok"
  ADD COLUMN IF NOT EXISTS "kolektorId" TEXT;

CREATE INDEX IF NOT EXISTS "kelompok_kolektorId_idx"
  ON "kelompok"("kolektorId");

DO $$
BEGIN
  ALTER TABLE "kelompok"
    ADD CONSTRAINT "kelompok_kolektorId_fkey"
    FOREIGN KEY ("kolektorId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "member_counters" ("id", "companyId", "nextNumber", "createdAt", "updatedAt")
SELECT
  concat('mc_', c."id") as "id",
  c."id" as "companyId",
  COALESCE(n.max_seq, 0) + 1 as "nextNumber",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "companies" c
LEFT JOIN (
  SELECT
    "companyId",
    MAX(
      CASE
        WHEN split_part("nomorAnggota", '-', 3) ~ '^[0-9]+$' THEN split_part("nomorAnggota", '-', 3)::INT
        ELSE NULL
      END
    ) as max_seq
  FROM "nasabah"
  GROUP BY "companyId"
) n ON n."companyId" = c."id"
ON CONFLICT ("companyId") DO NOTHING;
