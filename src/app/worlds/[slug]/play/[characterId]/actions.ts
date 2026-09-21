"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwnCharacter } from "@/lib/loadCharacter";
import { characterStateFrom, checkConditions, parseConditions, rollPercent } from "@/lib/gameEngine";
import { parseJsonArray } from "@/lib/json";

export async function travelAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const characterId = String(formData.get("characterId") || "");
  const { character } = await requireOwnCharacter(slug, characterId);
  const locationId = String(formData.get("locationId") || "");

  await prisma.character.update({
    where: { id: character.id },
    data: { currentLocationId: locationId },
  });
  redirect(`/worlds/${slug}/play/${characterId}`);
}

async function findEligibleEvent(
  worldId: string,
  category: "LOCATION" | "GLOBAL" | "DUNGEON_FLOOR",
  scopeId: string | null,
  character: Awaited<ReturnType<typeof requireOwnCharacter>>["character"],
) {
  const where =
    category === "LOCATION"
      ? { worldId, category, locationId: scopeId }
      : category === "DUNGEON_FLOOR"
        ? { worldId, category, dungeonFloorId: scopeId }
        : { worldId, category: "GLOBAL" as const };

  const events = await prisma.event.findMany({ where, include: { choices: true } });
  const state = characterStateFrom(character);
  for (const ev of events) {
    if (!ev.choices.length) continue;
    const prereqs = parseJsonArray(ev.prerequisiteEventIds);
    if (!prereqs.every((id) => state.completedEventIds.includes(id))) continue;
    if (!checkConditions(parseConditions(ev.unlockConditions), state)) continue;
    if (rollPercent(ev.probability * 100)) return ev;
  }
  return null;
}

export async function advanceTimeAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const characterId = String(formData.get("characterId") || "");
  const { world, character } = await requireOwnCharacter(slug, characterId);

  await prisma.character.update({
    where: { id: character.id },
    data: { timeElapsed: character.timeElapsed + 1 },
  });

  const refreshed = await prisma.character.findUniqueOrThrow({ where: { id: character.id } });
  const locationEvent = character.currentLocationId
    ? await findEligibleEvent(world.id, "LOCATION", character.currentLocationId, refreshed)
    : null;
  const event = locationEvent ?? (await findEligibleEvent(world.id, "GLOBAL", null, refreshed));

  if (event) {
    redirect(`/worlds/${slug}/play/${characterId}/event/${event.id}`);
  }
  revalidatePath(`/worlds/${slug}/play/${characterId}`);
}

export async function meetNpcAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const characterId = String(formData.get("characterId") || "");
  const npcId = String(formData.get("npcId") || "");
  const { character } = await requireOwnCharacter(slug, characterId);

  const known = new Set(parseJsonArray(character.knownNpcIds));
  known.add(npcId);
  await prisma.character.update({
    where: { id: character.id },
    data: { knownNpcIds: JSON.stringify([...known]) },
  });

  const interaction = await prisma.interaction.findFirst({ where: { npcId } });
  if (interaction) {
    redirect(`/worlds/${slug}/play/${characterId}/npc/${npcId}`);
  }
  revalidatePath(`/worlds/${slug}/play/${characterId}`);
}

export async function recruitCompanionAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const characterId = String(formData.get("characterId") || "");
  const companionId = String(formData.get("companionId") || "");
  const { character } = await requireOwnCharacter(slug, characterId);

  const companion = await prisma.companion.findUnique({ where: { id: companionId } });
  if (!companion) return;

  const companions = characterStateFrom(character).companions;
  if (companions.some((c) => c.companionId === companionId)) return;

  const hiddenIds = new Set(parseJsonArray(companion.hiddenSkillIds));
  const initialSkillIds = parseJsonArray(companion.initialSkillIds);
  const unlockedSkillIds = companion.hideCompanionSkillsByDefault
    ? initialSkillIds.filter((id) => !hiddenIds.has(id))
    : initialSkillIds;

  companions.push({ companionId, level: companion.initialLevel, xp: 0, unlockedSkillIds });

  const known = new Set(parseJsonArray(character.knownNpcIds));
  known.add(companionId);

  await prisma.character.update({
    where: { id: character.id },
    data: {
      companions: JSON.stringify(companions),
      knownNpcIds: JSON.stringify([...known]),
    },
  });
  revalidatePath(`/worlds/${slug}/play/${characterId}`);
}
