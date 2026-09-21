import "server-only";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getWorldBySlug, worldAccessFor } from "@/lib/worlds";

export async function requirePlayableWorld(slug: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login`);
  const world = await getWorldBySlug(slug);
  if (!world) notFound();
  const access = worldAccessFor(world, user);
  if (access === "none") notFound();
  return { world, user: user! };
}

export async function requireOwnCharacter(slug: string, characterId: string) {
  const { world, user } = await requirePlayableWorld(slug);
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character || character.worldId !== world.id || character.userId !== user.id) notFound();
  return { world, user, character };
}
