-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER'
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "procedurePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ON_RUN'
);

-- CreateTable
CREATE TABLE "TestRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "TestRequirement_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "TestLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TestLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_externalId_key" ON "Equipment"("externalId");
