-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageSeed" TEXT NOT NULL DEFAULT '',
    "musicSeed" TEXT NOT NULL DEFAULT '',
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "isStart" BOOLEAN NOT NULL DEFAULT false,
    "x" INTEGER NOT NULL DEFAULT 0,
    "y" INTEGER NOT NULL DEFAULT 0,
    "unlockConditions" TEXT NOT NULL DEFAULT '[]',
    "npcPoolIds" TEXT NOT NULL DEFAULT '[]',
    "companionPoolIds" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Location_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Location" ("description", "hidden", "id", "imageSeed", "musicSeed", "name", "npcPoolIds", "unlockConditions", "worldId", "x", "y") SELECT "description", "hidden", "id", "imageSeed", "musicSeed", "name", "npcPoolIds", "unlockConditions", "worldId", "x", "y" FROM "Location";
DROP TABLE "Location";
ALTER TABLE "new_Location" RENAME TO "Location";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
