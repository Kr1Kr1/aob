/*
  Warnings:

  - Added the required column `username` to the `IAUser` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IAUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeCharacterId" INTEGER,
    CONSTRAINT "IAUser_activeCharacterId_fkey" FOREIGN KEY ("activeCharacterId") REFERENCES "Characters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_IAUser" ("activeCharacterId", "createdAt", "id") SELECT "activeCharacterId", "createdAt", "id" FROM "IAUser";
DROP TABLE "IAUser";
ALTER TABLE "new_IAUser" RENAME TO "IAUser";
CREATE UNIQUE INDEX "IAUser_username_key" ON "IAUser"("username");
CREATE UNIQUE INDEX "IAUser_activeCharacterId_key" ON "IAUser"("activeCharacterId");
CREATE INDEX "IAUser_activeCharacterId_idx" ON "IAUser"("activeCharacterId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
