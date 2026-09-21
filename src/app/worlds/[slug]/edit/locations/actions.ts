"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { conditionsFromForm, getMultiValues } from "@/lib/json";

export async function upsertLocationAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const { world } = await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  const npcPoolIds = getMultiValues(formData, "npcPoolIds");
  const companionPoolIds = getMultiValues(formData, "companionPoolIds");
  const connectedIds = getMultiValues(formData, "connectedIds");
  const isStart = formData.get("isStart") === "on";

  const data = {
    worldId: world.id,
    name: String(formData.get("name") || "Unnamed Location"),
    description: String(formData.get("description") || ""),
    hidden: formData.get("hidden") === "on",
    isStart,
    x: Number(formData.get("x") || 0),
    y: Number(formData.get("y") || 0),
    npcPoolIds: JSON.stringify(npcPoolIds),
    companionPoolIds: JSON.stringify(companionPoolIds),
    unlockConditions: conditionsFromForm(formData, "unlock"),
  };

  const location = id
    ? await prisma.location.update({ where: { id }, data })
    : await prisma.location.create({ data });

  if (isStart) {
    await prisma.location.updateMany({
      where: { worldId: world.id, id: { not: location.id } },
      data: { isStart: false },
    });
  }

  await prisma.locationConnection.deleteMany({
    where: { worldId: world.id, OR: [{ fromId: location.id }, { toId: location.id }] },
  });
  for (const otherId of connectedIds) {
    if (otherId === location.id) continue;
    await prisma.locationConnection
      .create({ data: { worldId: world.id, fromId: location.id, toId: otherId } })
      .catch(() => {});
  }

  revalidatePath(`/worlds/${slug}/edit/locations`);
}

export async function deleteLocationAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireWorldEditAccess(slug);
  const id = String(formData.get("id") || "");
  await prisma.location.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit/locations`);
}
