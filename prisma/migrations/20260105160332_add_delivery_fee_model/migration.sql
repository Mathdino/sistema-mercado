-- CreateEnum
CREATE TYPE "DeliveryFeeType" AS ENUM ('FIXED', 'PER_KM');

-- CreateTable
CREATE TABLE "DeliveryFee" (
    "id" TEXT NOT NULL,
    "type" "DeliveryFeeType" NOT NULL,
    "fixedValue" DOUBLE PRECISION,
    "perKmValue" DOUBLE PRECISION,
    "minValue" DOUBLE PRECISION,
    "minRange" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryFee_pkey" PRIMARY KEY ("id")
);
