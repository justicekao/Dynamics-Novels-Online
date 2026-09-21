import "server-only";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWorldBySlug, worldAccessFor } from "@/lib/worlds";

export async function requireWorldEditAccess(slug: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login`);
  const world = await getWorldBySlug(slug);
  if (!world) notFound();
  const access = worldAccessFor(world, user);
  if (access !== "edit" && access !== "admin") notFound();
  return { world, user, access };
}
