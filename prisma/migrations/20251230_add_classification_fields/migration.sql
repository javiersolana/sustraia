-- AlterTable
ALTER TABLE "CompletedWorkout"
ADD COLUMN IF NOT EXISTS "workoutStructure" JSONB,
ADD COLUMN IF NOT EXISTS "classificationConfidence" TEXT,
ADD COLUMN IF NOT EXISTS "humanReadable" TEXT;
