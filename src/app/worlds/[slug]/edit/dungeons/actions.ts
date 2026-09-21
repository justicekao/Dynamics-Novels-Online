"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { conditionsFromForm } from "@/lib/json";

export async function upsertDungeonAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");

  const data = {
    worldId: world.id,
    locationId: String(formData.get("locationId") || ""),
    name: String(formData.get("name") || "Unnamed Dungeon"),
    description: String(formData.get("description") || ""),
    musicSeed: String(formData.get("musicSeed") || ""),
    unlockConditions: conditionsFromForm(formData, "unlock"),
  };
  if (!data.locationId) return;
  if (id) {
    await prisma.dungeon.update({ where: { id }, data });
  } else {
    await prisma.dungeon.create({ data });
  }
  revalidatePath(`/worlds/${slug}/edit/dungeons`);
}

export async function deleteDungeonAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.dungeon.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/dungeons`);
}
