-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "email_otps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_otps_email_idx" ON "email_otps"("email");
