-- CreateTable
CREATE TABLE "CoachAthlete" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachAthlete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachAthlete_coachId_idx" ON "CoachAthlete"("coachId");

-- CreateIndex
CREATE INDEX "CoachAthlete_athleteId_idx" ON "CoachAthlete"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachAthlete_coachId_athleteId_key" ON "CoachAthlete"("coachId", "athleteId");

-- AddForeignKey
ALTER TABLE "CoachAthlete" ADD CONSTRAINT "CoachAthlete_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachAthlete" ADD CONSTRAINT "CoachAthlete_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing coach-athlete relationships from User.coachId to CoachAthlete table
INSERT INTO "CoachAthlete" ("id", "coachId", "athleteId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    "coachId",
    "id",
    NOW(),
    NOW()
FROM "User"
WHERE "coachId" IS NOT NULL;

-- Drop the old coachId column (COMMENTED OUT - do this manually after verifying data)
-- ALTER TABLE "User" DROP COLUMN "coachId";
