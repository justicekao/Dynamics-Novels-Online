"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { uniqueSlug, uniqueWorldName, worldAccessFor, getWorldBySlug } from "@/lib/worlds";
import { cloneWorld } from "@/lib/cloneWorld";
import { DEFAULT_TERMINOLOGY } from "@/lib/constants";
import { censor } from "@/lib/censor";

export async function createWorldAction(formData: FormData) {
  const user = await requireUser();
  const rawName = String(formData.get("name") || "").trim();
  if (!rawName) redirect(`/worlds/new?error=${encodeURIComponent("Give your world a name.")}`);

  const name = await uniqueWorldName(user.id, rawName || "New World");
  const slug = await uniqueSlug(`${user.username}-${name}`);

  const world = await prisma.world.create({
    data: {
      ownerId: user.id,
      name,
      slug,
      description: String(formData.get("description") || ""),
      terminology: JSON.stringify(DEFAULT_TERMINOLOGY),
    },
  });

  redirect(`/worlds/${world.slug}/edit`);
}

export async function duplicateWorldAction(formData: FormData) {
  const user = await requireUser();
  const worldId = String(formData.get("worldId") || "");
  const source = await prisma.world.findUnique({
    where: { id: worldId },
    include: { collaborators: true },
  });
  if (!source) redirect("/worlds");

  const access = worldAccessFor(source!, user);
  if (source!.ownerId !== user.id && !source!.allowDuplication && access === "none") {
    redirect(`/worlds/${source!.slug}?error=${encodeURIComponent("This world cannot be duplicated.")}`);
  }

  const name = await uniqueWorldName(user.id, source!.name);
  const slug = await uniqueSlug(`${user.username}-${name}`);
  const copy = await cloneWorld(source!.id, user.id, name, slug);

  redirect(`/worlds/${copy.slug}/edit`);
}

export async function deleteWorldAction(formData: FormData) {
  const user = await requireUser();
  const worldId = String(formData.get("worldId") || "");
  const world = await prisma.world.findUnique({ where: { id: worldId } });
  if (!world || world.ownerId !== user.id) redirect("/worlds");
  await prisma.world.delete({ where: { id: worldId } });
  redirect("/worlds");
}

export async function toggleFavoriteAction(formData: FormData) {
  const user = await requireUser();
  const worldId = String(formData.get("worldId") || "");
  const slug = String(formData.get("slug") || "");
  const existing = await prisma.favorite.findUnique({
    where: { worldId_userId: { worldId, userId: user.id } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { worldId, userId: user.id } });
  }
  revalidatePath(`/worlds/${slug}`);
}

export async function rateWorldAction(formData: FormData) {
  const user = await requireUser();
  const worldId = String(formData.get("worldId") || "");
  const slug = String(formData.get("slug") || "");
  const value = Math.min(5, Math.max(1, Number(formData.get("value") || 0)));

  await prisma.rating.upsert({
    where: { worldId_userId: { worldId, userId: user.id } },
    update: { value },
    create: { worldId, userId: user.id, value },
  });
  revalidatePath(`/worlds/${slug}`);
}

export async function commentOnWorldAction(formData: FormData) {
  const user = await requireUser();
  const worldId = String(formData.get("worldId") || "");
  const slug = String(formData.get("slug") || "");
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  await prisma.comment.create({ data: { worldId, userId: user.id, body: censor(body) } });
  revalidatePath(`/worlds/${slug}`);
}

export async function recordVisitAction(worldSlug: string) {
  const world = await getWorldBySlug(worldSlug);
  if (!world) return;
  await prisma.$transaction([
    prisma.world.update({ where: { id: world.id }, data: { visitCount: { increment: 1 } } }),
    prisma.worldVisit.create({ data: { worldId: world.id } }),
  ]);
}
