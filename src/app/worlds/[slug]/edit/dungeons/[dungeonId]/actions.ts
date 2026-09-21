"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { getMultiValues } from "@/lib/json";

export async function upsertFloorAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const dungeonId = String(formData.get("dungeonId") || "");

  const data = {
    dungeonId,
    order: Number(formData.get("order") || 1),
    name: String(formData.get("name") || "Unnamed Floor"),
    description: String(formData.get("description") || ""),
    backgroundSeed: String(formData.get("backgroundSeed") || ""),
    musicSeed: String(formData.get("musicSeed") || ""),
    creatureIds: JSON.stringify(getMultiValues(formData, "creatureIds")),
  };
  if (id) {
    await prisma.dungeonFloor.update({ where: { id }, data });
  } else {
    await prisma.dungeonFloor.create({ data });
  }
  revalidatePath(`/worlds/${slug}/edit/dungeons/${dungeonId}`);
}

export async function deleteFloorAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const dungeonId = String(formData.get("dungeonId") || "");
  await prisma.dungeonFloor.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/dungeons/${dungeonId}`);
}

export async function duplicateFloorAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const dungeonId = String(formData.get("dungeonId") || "");
  const src = await prisma.dungeonFloor.findUnique({ where: { id } });
  if (!src) return;
  await prisma.dungeonFloor.create({
    data: {
      dungeonId: src.dungeonId,
      order: src.order + 1,
      name: `${src.name} (copy)`,
      description: src.description,
      backgroundSeed: src.backgroundSeed,
      musicSeed: src.musicSeed,
      creatureIds: src.creatureIds,
    },
  });
  revalidatePath(`/worlds/${slug}/edit/dungeons/${dungeonId}`);
}
