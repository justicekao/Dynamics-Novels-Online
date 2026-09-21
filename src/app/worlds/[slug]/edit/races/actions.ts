"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { statModifiersFromForm } from "@/lib/statForm";
import { getMultiValues } from "@/lib/json";

export async function upsertRaceAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const traitIds = getMultiValues(formData, "traitIds");

  const data = {
    worldId: world.id,
    name: String(formData.get("name") || "Unnamed Race"),
    description: String(formData.get("description") || ""),
    statModifiers: statModifiersFromForm(formData),
    traitIds: JSON.stringify(traitIds),
  };
  if (id) {
    await prisma.race.update({ where: { id }, data });
  } else {
    await prisma.race.create({ data });
  }
  revalidatePath(`/worlds/${slug}/edit/races`);
}

export async function deleteRaceAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.race.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/races`);
}
