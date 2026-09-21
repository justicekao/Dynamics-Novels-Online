"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { getMultiValues } from "@/lib/json";

export async function upsertCompanionAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");

  const data = {
    worldId: world.id,
    name: String(formData.get("name") || "Unnamed Companion"),
    description: String(formData.get("description") || ""),
    portraitSeed: String(formData.get("portraitSeed") || ""),
    initialLevel: Number(formData.get("initialLevel") || 1),
    hideCompanionSkillsByDefault: formData.get("hideCompanionSkillsByDefault") === "on",
    allowedClassIds: JSON.stringify(getMultiValues(formData, "allowedClassIds")),
    initialSkillIds: JSON.stringify(getMultiValues(formData, "initialSkillIds")),
    hiddenSkillIds: JSON.stringify(getMultiValues(formData, "hiddenSkillIds")),
  };
  if (id) {
    await prisma.companion.update({ where: { id }, data });
  } else {
    await prisma.companion.create({ data });
  }
  revalidatePath(`/worlds/${slug}/edit/companions`);
}

export async function deleteCompanionAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.companion.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/companions`);
}
