"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { conditionsFromForm, getMultiValues } from "@/lib/json";
import { EVENT_CHOICE_SLOTS, SUCCESS_STAT_SLOTS, ALL_STATS } from "@/lib/constants";

export async function upsertEventAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const category = String(formData.get("category") || "LOCATION");
  const prerequisiteEventIds = getMultiValues(formData, "prerequisiteEventIds").filter((p) => p !== id);

  const data = {
    worldId: world.id,
    name: String(formData.get("name") || "Unnamed Event"),
    description: String(formData.get("description") || ""),
    imageSeed: String(formData.get("imageSeed") || ""),
    musicSeed: String(formData.get("musicSeed") || ""),
    category,
    locationId: category === "LOCATION" ? String(formData.get("locationId") || "") || null : null,
    dungeonFloorId: category === "DUNGEON_FLOOR" ? String(formData.get("dungeonFloorId") || "") || null : null,
    probability: Math.min(1, Math.max(0, Number(formData.get("probability") || 1))),
    prerequisiteEventIds: JSON.stringify(prerequisiteEventIds),
    unlockConditions: conditionsFromForm(formData, "unlock"),
  };

  const event = id
    ? await prisma.event.update({ where: { id }, data })
    : await prisma.event.create({ data });

  await prisma.eventChoice.deleteMany({ where: { eventId: event.id } });
  for (let i = 0; i < EVENT_CHOICE_SLOTS; i++) {
    const text = String(formData.get(`choice_${i}_text`) || "").trim();
    if (!text) continue;

    const successStats: { stat: string; difficulty: number }[] = [];
    for (let j = 0; j < SUCCESS_STAT_SLOTS; j++) {
      const stat = String(formData.get(`choice_${i}_stat_${j}_stat`) || "");
      if (!stat || !(ALL_STATS as readonly string[]).includes(stat)) continue;
      const difficulty = Number(formData.get(`choice_${i}_stat_${j}_difficulty`) || 10);
      successStats.push({ stat, difficulty });
    }

    await prisma.eventChoice.create({
      data: {
        eventId: event.id,
        text,
        resultTextSuccess: String(formData.get(`choice_${i}_resultTextSuccess`) || ""),
        resultTextFailure: String(formData.get(`choice_${i}_resultTextFailure`) || ""),
        successStats: JSON.stringify(successStats),
        successEffectIds: JSON.stringify(getMultiValues(formData, `choice_${i}_successEffectIds`)),
        failureEffectIds: JSON.stringify(getMultiValues(formData, `choice_${i}_failureEffectIds`)),
        nextEventId: String(formData.get(`choice_${i}_nextEventId`) || "") || null,
      },
    });
  }

  revalidatePath(`/worlds/${slug}/edit/events`);
}

export async function deleteEventAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.event.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/events`);
}

export async function duplicateEventAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const src = await prisma.event.findUnique({ where: { id }, include: { choices: true } });
  if (!src || src.worldId !== world.id) return;

  const copy = await prisma.event.create({
    data: {
      worldId: world.id,
      name: `${src.name} (copy)`,
      description: src.description,
      imageSeed: src.imageSeed,
      musicSeed: src.musicSeed,
      category: src.category,
      locationId: src.locationId,
      dungeonFloorId: src.dungeonFloorId,
      probability: src.probability,
      prerequisiteEventIds: src.prerequisiteEventIds,
      unlockConditions: src.unlockConditions,
    },
  });
  for (const c of src.choices) {
    await prisma.eventChoice.create({
      data: {
        eventId: copy.id,
        text: c.text,
        resultTextSuccess: c.resultTextSuccess,
        resultTextFailure: c.resultTextFailure,
        successStats: c.successStats,
        successEffectIds: c.successEffectIds,
        failureEffectIds: c.failureEffectIds,
        nextEventId: c.nextEventId === src.id ? copy.id : c.nextEventId,
      },
    });
  }
  revalidatePath(`/worlds/${slug}/edit/events`);
}
