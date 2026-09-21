"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwnCharacter } from "@/lib/loadCharacter";
import { applyXp, characterStateFrom, parseConditions, checkConditions, pushLog, resolveCombat, rollPercent } from "@/lib/gameEngine";
import { parseJsonArray, parseJsonObject } from "@/lib/json";

export async function exploreFloorAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const characterId = String(formData.get("characterId") || "");
  const dungeonId = String(formData.get("dungeonId") || "");
  const { character } = await requireOwnCharacter(slug, characterId);

  const flags = parseJsonObject<Record<string, number>>(character.flags);
  const floorKey = `floor_${dungeonId}`;
  const currentIndex = flags[floorKey] ?? 0;

  const floors = await prisma.dungeonFloor.findMany({ where: { dungeonId }, orderBy: { order: "asc" } });
  const floor = floors[currentIndex];
  if (!floor) {
    redirect(`/worlds/${slug}/play/${characterId}/dungeon/${dungeonId}`);
  }

  const state = characterStateFrom(character);

  // Dungeon-floor event has a chance to fire instead of combat.
  const floorEvents = await prisma.event.findMany({
    where: { worldId: character.worldId, category: "DUNGEON_FLOOR", dungeonFloorId: floor!.id },
    include: { choices: true },
  });
  for (const ev of floorEvents) {
    if (!ev.choices.length) continue;
    const prereqs = parseJsonArray(ev.prerequisiteEventIds);
    if (!prereqs.every((id) => state.completedEventIds.includes(id))) continue;
    if (!checkConditions(parseConditions(ev.unlockConditions), state)) continue;
    if (rollPercent(ev.probability * 100)) {
      redirect(`/worlds/${slug}/play/${characterId}/event/${ev.id}`);
    }
  }

  const creatureIds = parseJsonArray(floor!.creatureIds);
  const logLines: string[] = [];
  const stats = state.stats;

  if (creatureIds.length > 0) {
    const creatureId = creatureIds[Math.floor(Math.random() * creatureIds.length)];
    const creature = await prisma.creature.findUnique({ where: { id: creatureId } });
    if (creature) {
      const result = resolveCombat(stats, {
        name: creature.name,
        stats: parseJsonObject<Record<string, number>>(creature.stats),
        xpReward: creature.xpReward,
        lootItemIds: parseJsonArray(creature.lootItemIds),
        element: creature.element,
      });
      logLines.push(`Encountered ${creature.name} on ${floor!.name}.`, ...result.log);

      if (result.won) {
        const leveled = applyXp(stats, character.level, character.xp, result.xpReward);
        logLines.push(`Defeated ${creature.name}! +${result.xpReward} XP.`, ...leveled.log);

        const inventory = state.inventory;
        for (const itemId of result.lootItemIds) {
          const existing = inventory.find((i) => i.itemId === itemId);
          if (existing) existing.qty += 1;
          else inventory.push({ itemId, qty: 1 });
        }

        flags[floorKey] = currentIndex + 1;
        await prisma.character.update({
          where: { id: character.id },
          data: {
            stats: JSON.stringify(stats),
            level: leveled.level,
            xp: leveled.xp,
            inventory: JSON.stringify(inventory),
            flags: JSON.stringify(flags),
            log: pushLog(character.log, logLines),
          },
        });
      } else {
        logLines.push(`You were defeated and retreat to recover.`);
        await prisma.character.update({
          where: { id: character.id },
          data: { stats: JSON.stringify(stats), log: pushLog(character.log, logLines) },
        });
      }
      revalidatePath(`/worlds/${slug}/play/${characterId}/dungeon/${dungeonId}`);
      return;
    }
  }

  // No creatures on this floor: move straight on.
  logLines.push(`${floor!.name} is clear. You move on.`);
  flags[floorKey] = currentIndex + 1;
  await prisma.character.update({
    where: { id: character.id },
    data: { flags: JSON.stringify(flags), log: pushLog(character.log, logLines) },
  });
  revalidatePath(`/worlds/${slug}/play/${characterId}/dungeon/${dungeonId}`);
}
