"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { getMultiValues } from "@/lib/json";

export async function upsertNpcAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");

  const data = {
    worldId: world.id,
    name: String(formData.get("name") || "Unnamed NPC"),
    description: String(formData.get("description") || ""),
    portraitSeed: String(formData.get("portraitSeed") || ""),
    traitIds: JSON.stringify(getMultiValues(formData, "traitIds")),
    skillIds: JSON.stringify(getMultiValues(formData, "skillIds")),
    itemIds: JSON.stringify(getMultiValues(formData, "itemIds")),
  };
  if (id) {
    await prisma.npc.update({ where: { id }, data });
  } else {
    await prisma.npc.create({ data });
  }
  revalidatePath(`/worlds/${slug}/edit/npcs`);
}

export async function deleteNpcAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.npc.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/npcs`);
}
