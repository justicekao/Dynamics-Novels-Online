"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { DEFAULT_TERMINOLOGY } from "@/lib/constants";

async function requireAdmin(slug: string) {
  const { world, access } = await requireWorldEditAccess(slug);
  if (access !== "admin") throw new Error("Only the world admin can do this.");
  return world;
}

export async function updateWorldSettingsAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const world = await requireAdmin(slug);

  const terminology: Record<keyof typeof DEFAULT_TERMINOLOGY, string> = { ...DEFAULT_TERMINOLOGY };
  for (const key of Object.keys(DEFAULT_TERMINOLOGY) as (keyof typeof DEFAULT_TERMINOLOGY)[]) {
    const v = formData.get(`term_${key}`);
    if (typeof v === "string" && v.trim()) terminology[key] = v.trim();
  }

  await prisma.world.update({
    where: { id: world.id },
    data: {
      name: String(formData.get("name") || world.name),
      description: String(formData.get("description") || ""),
      visibility: formData.get("visibility") === "PUBLIC" ? "PUBLIC" : "PRIVATE",
      allowComments: formData.get("allowComments") === "on",
      allowRatings: formData.get("allowRatings") === "on",
      allowDuplication: formData.get("allowDuplication") === "on",
      terminology: JSON.stringify(terminology),
    },
  });
  revalidatePath(`/worlds/${slug}/edit`);
}

export async function addTagAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const world = await requireAdmin(slug);
  const name = String(formData.get("tagName") || "").trim().toLowerCase();
  if (!name) return;

  const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  await prisma.worldTag
    .create({ data: { worldId: world.id, tagId: tag.id } })
    .catch(() => {});
  revalidatePath(`/worlds/${slug}/edit`);
}

export async function removeTagAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const world = await requireAdmin(slug);
  const tagId = String(formData.get("tagId") || "");
  await prisma.worldTag.delete({ where: { worldId_tagId: { worldId: world.id, tagId } } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit`);
}

export async function addCollaboratorAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const world = await requireAdmin(slug);
  const username = String(formData.get("username") || "").trim();
  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) redirect(`/worlds/${slug}/edit?error=${encodeURIComponent("No user with that username.")}`);
  if (target!.id === world.ownerId) return;

  await prisma.worldCollaborator
    .create({ data: { worldId: world.id, userId: target!.id } })
    .catch(() => {});
  revalidatePath(`/worlds/${slug}/edit`);
}

export async function removeCollaboratorAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireAdmin(slug);
  const collaboratorId = String(formData.get("collaboratorId") || "");
  await prisma.worldCollaborator.delete({ where: { id: collaboratorId } }).catch(() => {});
  revalidatePath(`/worlds/${slug}/edit`);
}

export async function transferAdminAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await requireAdmin(slug);
  const collaboratorId = String(formData.get("collaboratorId") || "");
  await prisma.worldCollaborator.update({
    where: { id: collaboratorId },
    data: { isAdmin: true },
  });
  revalidatePath(`/worlds/${slug}/edit`);
}

export async function deleteWorldFromEditAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const user = await requireUser();
  const world = await prisma.world.findUnique({ where: { slug } });
  if (!world || world.ownerId !== user.id) return;
  await prisma.world.delete({ where: { id: world.id } });
  redirect("/worlds");
}
