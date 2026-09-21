"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { statModifiersFromForm } from "@/lib/statForm";

export async function upsertTraitAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const data = {
    worldId: world.id,
    name: String(formData.get("name") || "Unnamed Trait"),
    description: String(formData.get("description") || ""),
    statModifiers: statModifiersFromForm(formData),
  };
  if (id) {
    await prisma.trait.update({ where: { id }, data });
  } else {
    await prisma.trait.create({ data });
  }
  revalidatePath(`/worlds/${slug}/edit/traits`);
}

export async function deleteTraitAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.trait.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/traits`);
}
