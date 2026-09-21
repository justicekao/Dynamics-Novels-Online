"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOwnCharacter } from "@/lib/loadCharacter";
import { characterStateFrom, pushLog } from "@/lib/gameEngine";
import { applyEffectToCharacter } from "@/lib/applyEffect";
import { parseJsonAny } from "@/lib/json";

export async function chooseInteractionAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const characterId = String(formData.get("characterId") || "");
  const choiceId = String(formData.get("choiceId") || "");
  const { character } = await requireOwnCharacter(slug, characterId);

  const choice = await prisma.interactionChoice.findUnique({ where: { id: choiceId } });
  if (!choice) redirect(`/worlds/${slug}/play/${characterId}`);

  const outcomes = parseJsonAny<{ effectId: string; weight: number }[]>(choice!.outcomes, []);
  const totalWeight = outcomes.reduce((s, o) => s + Math.max(0, o.weight), 0);
  let chosen: { effectId: string; weight: number } | null = null;
  if (totalWeight > 0) {
    let roll = Math.random() * totalWeight;
    for (const o of outcomes) {
      roll -= Math.max(0, o.weight);
      if (roll <= 0) {
        chosen = o;
        break;
      }
    }
  }

  const state = characterStateFrom(character);
  const stats = state.stats;
  const traitIds = state.traitIds;
  const logLines = [choice!.resultText || choice!.text];

  if (chosen) {
    const effect = await prisma.effectDefinition.findUnique({ where: { id: chosen.effectId } });
    if (effect) {
      const { logLine } = applyEffectToCharacter(effect, stats, traitIds);
      logLines.push(logLine);
    }
  }

  await prisma.character.update({
    where: { id: character.id },
    data: {
      stats: JSON.stringify(stats),
      traitIds: JSON.stringify(traitIds),
      log: pushLog(character.log, logLines),
    },
  });

  redirect(`/worlds/${slug}/play/${characterId}`);
}
