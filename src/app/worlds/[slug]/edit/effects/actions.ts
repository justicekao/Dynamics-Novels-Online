"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";

export async function upsertEffectAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const kind = String(formData.get("kind") || "STAT_MODIFIER");

  const payload: Record<string, unknown> = {};
  if (kind === "STAT_MODIFIER") {
    payload.stat = String(formData.get("p_stat") || "");
    payload.amount = Number(formData.get("p_amount") || 0);
    payload.duration = Number(formData.get("p_duration") || 0);
  } else if (kind === "STATUS") {
    payload.status = String(formData.get("p_status") || "");
    payload.chance = Number(formData.get("p_chance") || 100);
    payload.duration = Number(formData.get("p_duration") || 2);
  } else if (kind === "DAMAGE") {
    payload.element = String(formData.get("p_element") || "None");
    payload.amount = Number(formData.get("p_amount") || 0);
  } else if (kind === "HEAL") {
    payload.amount = Number(formData.get("p_amount") || 0);
  } else if (kind === "GRANT_TRAIT") {
    payload.traitId = String(formData.get("p_traitId") || "");
    payload.chance = Number(formData.get("p_chance") || 100);
  }

  const data = {
    worldId: world.id,
    name: String(formData.get("name") || "Unnamed Effect"),
    description: String(formData.get("description") || ""),
    kind,
    payload: JSON.stringify(payload),
  };
  if (id) {
    await prisma.effectDefinition.update({ where: { id }, data });
  } else {
    await prisma.effectDefinition.create({ data });
  }
  revalidatePath(`/worlds/${slug}/edit/effects`);
}

export async function deleteEffectAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.effectDefinition.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/effects`);
}
