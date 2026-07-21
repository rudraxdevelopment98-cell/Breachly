-- CreateTable
CREATE TABLE "breach_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "breachName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "year" INTEGER,
    "breachDate" TEXT,
    "exposedFields" TEXT[],
    "description" TEXT NOT NULL,
    "passwordExposed" BOOLEAN NOT NULL DEFAULT false,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breach_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_listings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brokerName" TEXT NOT NULL,
    "brokerDomain" TEXT NOT NULL,
    "registry" TEXT,
    "status" TEXT NOT NULL DEFAULT 'found',
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opt_out_requests" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "confirmationRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opt_out_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "ip" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "breach_records_userId_idx" ON "breach_records"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "breach_records_userId_source_breachName_key" ON "breach_records"("userId", "source", "breachName");

-- CreateIndex
CREATE INDEX "broker_listings_userId_idx" ON "broker_listings"("userId");

-- CreateIndex
CREATE INDEX "opt_out_requests_listingId_idx" ON "opt_out_requests"("listingId");

-- CreateIndex
CREATE INDEX "audit_log_actorId_idx" ON "audit_log"("actorId");

-- AddForeignKey
ALTER TABLE "opt_out_requests" ADD CONSTRAINT "opt_out_requests_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "broker_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
