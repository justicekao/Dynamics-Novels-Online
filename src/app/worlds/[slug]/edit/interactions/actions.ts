"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { INTERACTION_CHOICE_SLOTS as CHOICE_SLOTS, INTERACTION_OUTCOME_SLOTS as OUTCOME_SLOTS } from "@/lib/constants";

export async function upsertInteractionAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const targetKind = String(formData.get("targetKind") || "npc");
  const targetId = String(formData.get("targetId") || "");

  const data = {
    worldId: world.id,
    name: String(formData.get("name") || "Unnamed Interaction"),
    description: String(formData.get("description") || ""),
    npcId: targetKind === "npc" ? targetId || null : null,
    companionId: targetKind === "companion" ? targetId || null : null,
  };

  const interaction = id
    ? await prisma.interaction.update({ where: { id }, data })
    : await prisma.interaction.create({ data });

  await prisma.interactionChoice.deleteMany({ where: { interactionId: interaction.id } });
  for (let i = 0; i < CHOICE_SLOTS; i++) {
    const text = String(formData.get(`choice_${i}_text`) || "").trim();
    if (!text) continue;
    const resultText = String(formData.get(`choice_${i}_resultText`) || "");
    const outcomes: { effectId: string; weight: number }[] = [];
    for (let j = 0; j < OUTCOME_SLOTS; j++) {
      const effectId = String(formData.get(`choice_${i}_outcome_${j}_effectId`) || "");
      if (!effectId) continue;
      const weight = Number(formData.get(`choice_${i}_outcome_${j}_weight`) || 1);
      outcomes.push({ effectId, weight });
    }
    await prisma.interactionChoice.create({
      data: {
        interactionId: interaction.id,
        text,
        resultText,
        outcomes: JSON.stringify(outcomes),
      },
    });
  }

  revalidatePath(`/worlds/${slug}/edit/interactions`);
}

export async function deleteInteractionAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.interaction.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/interactions`);
}
