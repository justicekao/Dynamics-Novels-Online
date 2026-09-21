"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { statModifiersFromForm } from "@/lib/statForm";
import { getMultiValues } from "@/lib/json";

export async function upsertItemAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const effectIds = getMultiValues(formData, "effectIds");

  const data = {
    worldId: world.id,
    name: String(formData.get("name") || "Unnamed Item"),
    description: String(formData.get("description") || ""),
    type: String(formData.get("type") || "MISC"),
    element: String(formData.get("element") || "None"),
    statModifiers: statModifiersFromForm(formData),
  };

  const item = id
    ? await prisma.item.update({ where: { id }, data })
    : await prisma.item.create({ data });

  await prisma.itemEffect.deleteMany({ where: { itemId: item.id } });
  for (const effectId of effectIds) {
    await prisma.itemEffect.create({ data: { itemId: item.id, effectId } });
  }

  revalidatePath(`/worlds/${slug}/edit/items`);
}

export async function deleteItemAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.item.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/items`);
}
