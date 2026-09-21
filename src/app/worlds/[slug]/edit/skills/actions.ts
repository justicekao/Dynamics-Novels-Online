"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { conditionsFromForm, getMultiValues } from "@/lib/json";

export async function upsertSkillAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const effectIds = getMultiValues(formData, "effectIds");

  const data = {
    worldId: world.id,
    name: String(formData.get("name") || "Unnamed Skill"),
    description: String(formData.get("description") || ""),
    type: String(formData.get("type") || "ACTIVE"),
    element: String(formData.get("element") || "None"),
    targetType: String(formData.get("targetType") || "SINGLE_ENEMY"),
    basePower: Number(formData.get("basePower") || 0),
    baseSuccessChance: Number(formData.get("baseSuccessChance") || 100),
    grantsTraitId: String(formData.get("grantsTraitId") || ""),
    grantsTraitChance: Number(formData.get("grantsTraitChance") || 0),
    requiresTraitId: String(formData.get("requiresTraitId") || ""),
    neverUnlockable: formData.get("neverUnlockable") === "on",
    unlockConditions: conditionsFromForm(formData, "unlock"),
  };

  const skill = id
    ? await prisma.skill.update({ where: { id }, data })
    : await prisma.skill.create({ data });

  await prisma.skillEffect.deleteMany({ where: { skillId: skill.id } });
  for (const effectId of effectIds) {
    await prisma.skillEffect.create({ data: { skillId: skill.id, effectId } });
  }

  revalidatePath(`/worlds/${slug}/edit/skills`);
}

export async function deleteSkillAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.skill.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/skills`);
}
