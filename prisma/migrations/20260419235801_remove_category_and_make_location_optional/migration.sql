-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "procedurePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ON_RUN',
    "sfrsId" TEXT,
    "mfrId" TEXT,
    "expiryDate" DATETIME,
    "statutoryExamination" BOOLEAN NOT NULL DEFAULT false,
    "removedAt" DATETIME,
    "trackHours" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Equipment" ("expiryDate", "externalId", "id", "location", "mfrId", "name", "procedurePath", "removedAt", "sfrsId", "status", "statutoryExamination", "trackHours") SELECT "expiryDate", "externalId", "id", "location", "mfrId", "name", "procedurePath", "removedAt", "sfrsId", "status", "statutoryExamination", "trackHours" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
CREATE UNIQUE INDEX "Equipment_externalId_key" ON "Equipment"("externalId");
CREATE UNIQUE INDEX "Equipment_sfrsId_key" ON "Equipment"("sfrsId");
CREATE INDEX "Equipment_removedAt_idx" ON "Equipment"("removedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
