-- AlterTable
ALTER TABLE "TestLog" ADD COLUMN "hoursUsed" TEXT;
ALTER TABLE "TestLog" ADD COLUMN "testCode" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "procedurePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ON_RUN',
    "sfrsId" TEXT,
    "mfrId" TEXT,
    "expiryDate" DATETIME,
    "statutoryExamination" BOOLEAN NOT NULL DEFAULT false,
    "removedAt" DATETIME
);
INSERT INTO "new_Equipment" ("category", "externalId", "id", "location", "mfrId", "name", "procedurePath", "sfrsId", "status") SELECT "category", "externalId", "id", "location", "mfrId", "name", "procedurePath", "sfrsId", "status" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
CREATE UNIQUE INDEX "Equipment_externalId_key" ON "Equipment"("externalId");
CREATE UNIQUE INDEX "Equipment_sfrsId_key" ON "Equipment"("sfrsId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
