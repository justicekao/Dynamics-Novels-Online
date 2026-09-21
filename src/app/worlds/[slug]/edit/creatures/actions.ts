"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { statModifiersFromForm } from "@/lib/statForm";
import { getMultiValues } from "@/lib/json";

export async function upsertCreatureAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");

  const data = {
    worldId: world.id,
    name: String(formData.get("name") || "Unnamed Creature"),
    description: String(formData.get("description") || ""),
    portraitSeed: String(formData.get("portraitSeed") || ""),
    element: String(formData.get("element") || "None"),
    xpReward: Number(formData.get("xpReward") || 0),
    stats: statModifiersFromForm(formData),
    skillIds: JSON.stringify(getMultiValues(formData, "skillIds")),
    lootItemIds: JSON.stringify(getMultiValues(formData, "lootItemIds")),
  };
  if (id) {
    await prisma.creature.update({ where: { id }, data });
  } else {
    await prisma.creature.create({ data });
  }
  revalidatePath(`/worlds/${slug}/edit/creatures`);
}

export async function deleteCreatureAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.creature.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/creatures`);
}
