"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOwnCharacter } from "@/lib/loadCharacter";
import { characterStateFrom, pushLog, successChance, rollPercent } from "@/lib/gameEngine";
import { applyEffectToCharacter } from "@/lib/applyEffect";
import { parseJsonAny, parseJsonArray } from "@/lib/json";

export async function chooseEventAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const characterId = String(formData.get("characterId") || "");
  const eventId = String(formData.get("eventId") || "");
  const choiceId = String(formData.get("choiceId") || "");
  const { character } = await requireOwnCharacter(slug, characterId);

  const choice = await prisma.eventChoice.findUnique({ where: { id: choiceId } });
  if (!choice || choice.eventId !== eventId) redirect(`/worlds/${slug}/play/${characterId}`);

  const state = characterStateFrom(character);
  const stats = state.stats;
  const traitIds = state.traitIds;

  const requiredStats = parseJsonAny<{ stat: string; difficulty: number }[]>(choice!.successStats, []);
  const succeeded = requiredStats.every((r) => rollPercent(successChance(stats[r.stat] ?? 0, r.difficulty)));

  const effectIds = parseJsonArray(succeeded ? choice!.successEffectIds : choice!.failureEffectIds);
  const logLines = [succeeded ? choice!.resultTextSuccess || choice!.text : choice!.resultTextFailure || choice!.text];

  for (const effectId of effectIds) {
    const effect = await prisma.effectDefinition.findUnique({ where: { id: effectId } });
    if (effect) {
      const { logLine } = applyEffectToCharacter(effect, stats, traitIds);
      logLines.push(logLine);
    }
  }

  const completed = new Set(state.completedEventIds);
  completed.add(eventId);

  await prisma.character.update({
    where: { id: character.id },
    data: {
      stats: JSON.stringify(stats),
      traitIds: JSON.stringify(traitIds),
      completedEventIds: JSON.stringify([...completed]),
      log: pushLog(character.log, logLines),
    },
  });

  if (choice!.nextEventId) {
    redirect(`/worlds/${slug}/play/${characterId}/event/${choice!.nextEventId}`);
  }
  redirect(`/worlds/${slug}/play/${characterId}`);
}
