/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `TestLog` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TestLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "TestLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TestLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TestLog" ("equipmentId", "id", "notes", "result", "timestamp", "type", "userId") SELECT "equipmentId", "id", "notes", "result", "timestamp", "type", "userId" FROM "TestLog";
DROP TABLE "TestLog";
ALTER TABLE "new_TestLog" RENAME TO "TestLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
