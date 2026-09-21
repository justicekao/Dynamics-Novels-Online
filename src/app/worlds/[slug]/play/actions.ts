"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePlayableWorld } from "@/lib/loadCharacter";
import { buildStartingStats } from "@/lib/gameEngine";
import { parseJsonArray } from "@/lib/json";

export async function createCharacterAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world, user } = await requirePlayableWorld(slug);

  const name = String(formData.get("name") || "").trim();
  if (!name) redirect(`/worlds/${slug}/play?error=${encodeURIComponent("Give your character a name.")}`);

  const raceId = String(formData.get("raceId") || "") || null;
  const classId = String(formData.get("classId") || "") || null;
  const gender = String(formData.get("gender") || "");

  const [race, klass, startLocation, fallbackLocation] = await Promise.all([
    raceId ? prisma.race.findUnique({ where: { id: raceId } }) : null,
    classId ? prisma.class.findUnique({ where: { id: classId } }) : null,
    prisma.location.findFirst({ where: { worldId: world.id, isStart: true } }),
    prisma.location.findFirst({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);

  const stats = buildStartingStats(race?.statModifiers ?? "{}", klass?.statModifiers ?? "{}");
  const traitIds = race ? parseJsonArray(race.traitIds) : [];
  const unlockedSkillIds = klass ? parseJsonArray(klass.startingSkillIds) : [];
  const location = startLocation ?? fallbackLocation;

  const existing = await prisma.character.findFirst({ where: { worldId: world.id, userId: user.id, name } });
  if (existing) {
    redirect(`/worlds/${slug}/play?error=${encodeURIComponent("You already have a character with that name.")}`);
  }

  const character = await prisma.character.create({
    data: {
      worldId: world.id,
      userId: user.id,
      name,
      gender,
      raceId,
      classId,
      stats: JSON.stringify(stats),
      traitIds: JSON.stringify(traitIds),
      unlockedSkillIds: JSON.stringify(unlockedSkillIds),
      currentLocationId: location?.id,
    },
  });

  redirect(`/worlds/${slug}/play/${character.id}`);
}

export async function deleteCharacterAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { user } = await requirePlayableWorld(slug);
  const id = String(formData.get("id") || "");
  const character = await prisma.character.findUnique({ where: { id } });
  if (!character || character.userId !== user.id) return;
  await prisma.character.delete({ where: { id } });
}
