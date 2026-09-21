"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { statModifiersFromForm } from "@/lib/statForm";
import { getMultiValues } from "@/lib/json";

export async function upsertClassAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const startingSkillIds = getMultiValues(formData, "startingSkillIds");

  const data = {
    worldId: world.id,
    name: String(formData.get("name") || "Unnamed Class"),
    description: String(formData.get("description") || ""),
    statModifiers: statModifiersFromForm(formData),
    startingSkillIds: JSON.stringify(startingSkillIds),
  };
  if (id) {
    await prisma.class.update({ where: { id }, data });
  } else {
    await prisma.class.create({ data });
  }
  revalidatePath(`/worlds/${slug}/edit/classes`);
}

export async function deleteClassAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.class.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/classes`);
}
