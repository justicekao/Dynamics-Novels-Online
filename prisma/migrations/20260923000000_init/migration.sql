-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "avatarSeed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "blockingId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldTag" (
    "worldId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "WorldTag_pkey" PRIMARY KEY ("worldId","tagId")
);

-- CreateTable
CREATE TABLE "World" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "allowRatings" BOOLEAN NOT NULL DEFAULT true,
    "allowDuplication" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "terminology" TEXT NOT NULL DEFAULT '{}',
    "forkedFromId" TEXT,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "World_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldCollaborator" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorldCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldVisit" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "portraitSeed" TEXT NOT NULL DEFAULT '',
    "statModifiers" TEXT NOT NULL DEFAULT '{}',
    "traitIds" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "statModifiers" TEXT NOT NULL DEFAULT '{}',
    "startingSkillIds" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trait" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "statModifiers" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "Trait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EffectDefinition" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "EffectDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'ACTIVE',
    "element" TEXT NOT NULL DEFAULT '',
    "targetType" TEXT NOT NULL DEFAULT 'SINGLE_ENEMY',
    "basePower" INTEGER NOT NULL DEFAULT 0,
    "baseSuccessChance" INTEGER NOT NULL DEFAULT 100,
    "grantsTraitId" TEXT NOT NULL DEFAULT '',
    "grantsTraitChance" INTEGER NOT NULL DEFAULT 0,
    "requiresTraitId" TEXT NOT NULL DEFAULT '',
    "unlockConditions" TEXT NOT NULL DEFAULT '[]',
    "neverUnlockable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEffect" (
    "skillId" TEXT NOT NULL,
    "effectId" TEXT NOT NULL,

    CONSTRAINT "SkillEffect_pkey" PRIMARY KEY ("skillId","effectId")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'MISC',
    "element" TEXT NOT NULL DEFAULT '',
    "statModifiers" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemEffect" (
    "itemId" TEXT NOT NULL,
    "effectId" TEXT NOT NULL,

    CONSTRAINT "ItemEffect_pkey" PRIMARY KEY ("itemId","effectId")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationConnection" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,

    CONSTRAINT "LocationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Npc" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "portraitSeed" TEXT NOT NULL DEFAULT '',
    "traitIds" TEXT NOT NULL DEFAULT '[]',
    "skillIds" TEXT NOT NULL DEFAULT '[]',
    "itemIds" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Npc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Companion" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "portraitSeed" TEXT NOT NULL DEFAULT '',
    "allowedClassIds" TEXT NOT NULL DEFAULT '[]',
    "initialLevel" INTEGER NOT NULL DEFAULT 1,
    "initialSkillIds" TEXT NOT NULL DEFAULT '[]',
    "hiddenSkillIds" TEXT NOT NULL DEFAULT '[]',
    "hideCompanionSkillsByDefault" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Companion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "npcId" TEXT,
    "companionId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionChoice" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "resultText" TEXT NOT NULL DEFAULT '',
    "outcomes" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "InteractionChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creature" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "portraitSeed" TEXT NOT NULL DEFAULT '',
    "element" TEXT NOT NULL DEFAULT '',
    "stats" TEXT NOT NULL DEFAULT '{}',
    "skillIds" TEXT NOT NULL DEFAULT '[]',
    "lootItemIds" TEXT NOT NULL DEFAULT '[]',
    "xpReward" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Creature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dungeon" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "musicSeed" TEXT NOT NULL DEFAULT '',
    "unlockConditions" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Dungeon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DungeonFloor" (
    "id" TEXT NOT NULL,
    "dungeonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "backgroundSeed" TEXT NOT NULL DEFAULT '',
    "musicSeed" TEXT NOT NULL DEFAULT '',
    "creatureIds" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "DungeonFloor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageSeed" TEXT NOT NULL DEFAULT '',
    "musicSeed" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'LOCATION',
    "locationId" TEXT,
    "dungeonFloorId" TEXT,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "prerequisiteEventIds" TEXT NOT NULL DEFAULT '[]',
    "unlockConditions" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventChoice" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "resultTextSuccess" TEXT NOT NULL DEFAULT '',
    "resultTextFailure" TEXT NOT NULL DEFAULT '',
    "successStats" TEXT NOT NULL DEFAULT '[]',
    "successEffectIds" TEXT NOT NULL DEFAULT '[]',
    "failureEffectIds" TEXT NOT NULL DEFAULT '[]',
    "nextEventId" TEXT,

    CONSTRAINT "EventChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT '',
    "raceId" TEXT,
    "classId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "stats" TEXT NOT NULL DEFAULT '{}',
    "currentLocationId" TEXT,
    "timeElapsed" INTEGER NOT NULL DEFAULT 0,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "inventory" TEXT NOT NULL DEFAULT '[]',
    "unlockedSkillIds" TEXT NOT NULL DEFAULT '[]',
    "traitIds" TEXT NOT NULL DEFAULT '[]',
    "knownNpcIds" TEXT NOT NULL DEFAULT '[]',
    "companions" TEXT NOT NULL DEFAULT '[]',
    "unlockedLocationIds" TEXT NOT NULL DEFAULT '[]',
    "completedEventIds" TEXT NOT NULL DEFAULT '[]',
    "flags" TEXT NOT NULL DEFAULT '{}',
    "log" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userAId_userBId_key" ON "Friendship"("userAId", "userBId");

-- CreateIndex
CREATE UNIQUE INDEX "Block_blockingId_blockedId_key" ON "Block"("blockingId", "blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "World_slug_key" ON "World"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorldCollaborator_worldId_userId_key" ON "WorldCollaborator"("worldId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_worldId_userId_key" ON "Rating"("worldId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_worldId_userId_key" ON "Favorite"("worldId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LocationConnection_fromId_toId_key" ON "LocationConnection"("fromId", "toId");

-- CreateIndex
CREATE UNIQUE INDEX "Character_worldId_userId_name_key" ON "Character"("worldId", "userId", "name");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockingId_fkey" FOREIGN KEY ("blockingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldTag" ADD CONSTRAINT "WorldTag_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldTag" ADD CONSTRAINT "WorldTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "World" ADD CONSTRAINT "World_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "World" ADD CONSTRAINT "World_forkedFromId_fkey" FOREIGN KEY ("forkedFromId") REFERENCES "World"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldCollaborator" ADD CONSTRAINT "WorldCollaborator_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldCollaborator" ADD CONSTRAINT "WorldCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldVisit" ADD CONSTRAINT "WorldVisit_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trait" ADD CONSTRAINT "Trait_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EffectDefinition" ADD CONSTRAINT "EffectDefinition_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEffect" ADD CONSTRAINT "SkillEffect_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEffect" ADD CONSTRAINT "SkillEffect_effectId_fkey" FOREIGN KEY ("effectId") REFERENCES "EffectDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEffect" ADD CONSTRAINT "ItemEffect_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEffect" ADD CONSTRAINT "ItemEffect_effectId_fkey" FOREIGN KEY ("effectId") REFERENCES "EffectDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationConnection" ADD CONSTRAINT "LocationConnection_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationConnection" ADD CONSTRAINT "LocationConnection_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationConnection" ADD CONSTRAINT "LocationConnection_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Npc" ADD CONSTRAINT "Npc_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "Npc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionChoice" ADD CONSTRAINT "InteractionChoice_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creature" ADD CONSTRAINT "Creature_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dungeon" ADD CONSTRAINT "Dungeon_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dungeon" ADD CONSTRAINT "Dungeon_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DungeonFloor" ADD CONSTRAINT "DungeonFloor_dungeonId_fkey" FOREIGN KEY ("dungeonId") REFERENCES "Dungeon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_dungeonFloorId_fkey" FOREIGN KEY ("dungeonFloorId") REFERENCES "DungeonFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventChoice" ADD CONSTRAINT "EventChoice_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

