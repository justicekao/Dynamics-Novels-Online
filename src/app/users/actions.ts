"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function toggleFriendAction(formData: FormData) {
  const me = await requireUser();
  const otherId = String(formData.get("userId") || "");
  const username = String(formData.get("username") || "");
  if (otherId === me.id) return;

  const [userAId, userBId] = pairKey(me.id, otherId);
  const existing = await prisma.friendship.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
  if (existing) {
    await prisma.friendship.delete({ where: { id: existing.id } });
  } else {
    await prisma.friendship.create({ data: { userAId, userBId } });
  }
  revalidatePath(`/users/${username}`);
}

export async function toggleBlockAction(formData: FormData) {
  const me = await requireUser();
  const otherId = String(formData.get("userId") || "");
  const username = String(formData.get("username") || "");
  if (otherId === me.id) return;

  const existing = await prisma.block.findUnique({
    where: { blockingId_blockedId: { blockingId: me.id, blockedId: otherId } },
  });
  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
  } else {
    await prisma.block.create({ data: { blockingId: me.id, blockedId: otherId } });
    const [userAId, userBId] = pairKey(me.id, otherId);
    await prisma.friendship.deleteMany({ where: { userAId, userBId } });
  }
  revalidatePath(`/users/${username}`);
}

export async function updateBioAction(formData: FormData) {
  const me = await requireUser();
  const bio = String(formData.get("bio") || "").slice(0, 500);
  await prisma.user.update({ where: { id: me.id }, data: { bio } });
  revalidatePath(`/users/${me.username}`);
}
