import "server-only";
import { prisma } from "@/lib/db";
import type { User } from "@/generated/prisma/client";

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "world"
  );
}

export async function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await prisma.world.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function uniqueWorldName(ownerId: string, baseName: string) {
  const count = await prisma.world.count({ where: { ownerId, name: baseName } });
  if (count === 0) return baseName;
  let n = count + 1;
  // ensure no collision (e.g. gaps from deletions)
  while (await prisma.world.count({ where: { ownerId, name: `${baseName} (${n})` } })) {
    n += 1;
  }
  return `${baseName} (${n})`;
}

export async function getWorldBySlug(slug: string) {
  return prisma.world.findUnique({
    where: { slug },
    include: {
      owner: true,
      tags: { include: { tag: true } },
      collaborators: { include: { user: true } },
      _count: { select: { ratings: true, comments: true, favorites: true } },
    },
  });
}

export type WorldAccess = "none" | "view" | "edit" | "admin";

export function worldAccessFor(
  world: { ownerId: string; visibility: string; collaborators: { userId: string; isAdmin: boolean }[] },
  user: User | null,
): WorldAccess {
  if (user) {
    if (world.ownerId === user.id) return "admin";
    const collab = world.collaborators.find((c) => c.userId === user.id);
    if (collab) return collab.isAdmin ? "admin" : "edit";
  }
  if (world.visibility === "PUBLIC") return "view";
  return "none";
}

export async function avgRating(worldId: string) {
  const agg = await prisma.rating.aggregate({
    where: { worldId },
    _avg: { value: true },
    _count: true,
  });
  return { avg: agg._avg.value ?? 0, count: agg._count };
}

export type WorldSort = "rating" | "visits" | "trending" | "newest";

export async function listPublicWorlds({
  q,
  tag,
  sort = "trending",
  ownerId,
}: {
  q?: string;
  tag?: string;
  sort?: WorldSort;
  ownerId?: string;
}) {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const worlds = await prisma.world.findMany({
    where: {
      ...(ownerId ? { ownerId } : { visibility: "PUBLIC" }),
      ...(q ? { name: { contains: q } } : {}),
      ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
    },
    include: {
      owner: true,
      tags: { include: { tag: true } },
      ratings: { select: { value: true } },
      _count: { select: { comments: true, favorites: true } },
      visits: { where: { createdAt: { gte: monthAgo } }, select: { id: true } },
    },
  });

  const withStats = worlds.map((w) => {
    const ratingCount = w.ratings.length;
    const avg = ratingCount ? w.ratings.reduce((s, r) => s + r.value, 0) / ratingCount : 0;
    return {
      ...w,
      avgRating: avg,
      ratingCount,
      monthVisits: w.visits.length,
    };
  });

  withStats.sort((a, b) => {
    if (sort === "rating") return b.avgRating - a.avgRating || b.ratingCount - a.ratingCount;
    if (sort === "visits") return b.visitCount - a.visitCount;
    if (sort === "trending") return b.monthVisits - a.monthVisits;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return withStats;
}
