-- First, add the new columns with temporary default values to handle existing rows
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "cpf" TEXT,
ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

-- Update existing rows with placeholder values if needed
UPDATE "User" 
SET "cpf" = COALESCE("cpf", 'temp_' || "id"), 
    "passwordHash" = COALESCE("passwordHash", 'temp_hash')
WHERE "cpf" IS NULL OR "passwordHash" IS NULL;

-- Now make the columns required
ALTER TABLE "User" 
ALTER COLUMN "cpf" SET NOT NULL,
ALTER COLUMN "passwordHash" SET NOT NULL;

-- Make email optional (as intended in the original migration)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Add the unique constraint on CPF
CREATE UNIQUE INDEX IF NOT EXISTS "User_cpf_key" ON "User"("cpf");

-- Add a comment to mark that temp values need to be updated
-- This is just for documentation, not executable SQL