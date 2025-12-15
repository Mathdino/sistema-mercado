-- AlterEnum
-- This migration reduces the OrderStatus enum to only include PENDING, CONFIRMED, and CANCELLED
-- It drops the values PREPARING, DELIVERING, and DELIVERED

-- Step 1: Create new enum with only the desired values
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- Step 2: Remove the default value from the status column
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;

-- Step 3: Alter the Order table to use the new enum type
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");

-- Step 4: Set the default value back
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Step 5: Drop the old enum
DROP TYPE "OrderStatus";

-- Step 6: Rename the new enum to the original name
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";