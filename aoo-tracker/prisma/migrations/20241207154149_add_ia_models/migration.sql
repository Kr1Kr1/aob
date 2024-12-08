-- CreateTable
CREATE TABLE "IAUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeCharacterId" INTEGER,
    CONSTRAINT "IAUser_activeCharacterId_fkey" FOREIGN KEY ("activeCharacterId") REFERENCES "Characters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IAChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" INTEGER NOT NULL,
    "chatType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IAChat_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Characters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IAMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IAMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "IAChat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IAVote" (
    "chatId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "isUpvoted" BOOLEAN NOT NULL,

    PRIMARY KEY ("chatId", "messageId"),
    CONSTRAINT "IAVote_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "IAChat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "IAVote_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "IAMessage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IADocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "IADocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "IAUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IASuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "suggestedText" TEXT NOT NULL,
    "description" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IASuggestion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "IADocument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "IASuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "IAUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Characters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "targetId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "rank" TEXT,
    "popularity" TEXT,
    "role" TEXT,
    "portraitUrl" TEXT,
    "factionId" INTEGER,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Characters_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Factions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "IAUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Characters" ("createdAt", "factionId", "id", "name", "popularity", "portraitUrl", "rank", "role", "targetId") SELECT "createdAt", "factionId", "id", "name", "popularity", "portraitUrl", "rank", "role", "targetId" FROM "Characters";
DROP TABLE "Characters";
ALTER TABLE "new_Characters" RENAME TO "Characters";
CREATE UNIQUE INDEX "Characters_targetId_key" ON "Characters"("targetId");
CREATE INDEX "Characters_targetId_idx" ON "Characters"("targetId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "IAUser_activeCharacterId_key" ON "IAUser"("activeCharacterId");

-- CreateIndex
CREATE INDEX "IAUser_activeCharacterId_idx" ON "IAUser"("activeCharacterId");
