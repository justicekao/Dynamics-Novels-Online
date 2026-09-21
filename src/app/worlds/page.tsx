import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { listPublicWorlds, type WorldSort } from "@/lib/worlds";
import { parseTerminology } from "@/lib/constants";
import { Badge, Card, EmptyState, LinkButton, PageTitle, Select, TextInput } from "@/components/ui";

const TABS = [
  { id: "all", label: "All Worlds" },
  { id: "players", label: "Players" },
  { id: "favorites", label: "Favorites" },
] as const;

const SORTS: { id: WorldSort; label: string }[] = [
  { id: "trending", label: "Popular this month" },
  { id: "visits", label: "Most visited" },
  { id: "rating", label: "Highest rated" },
  { id: "newest", label: "Newest" },
];

export default async function WorldsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; tag?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const tab = (sp.tab as (typeof TABS)[number]["id"]) || "all";
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <PageTitle subtitle="Explore worlds other creators have published, search the player directory, or revisit your favorites.">
          Worlds
        </PageTitle>
        {user ? <LinkButton href="/worlds/new">Create a world</LinkButton> : null}
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-800">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/worlds?tab=${t.id}`}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-b-2 border-amber-400 text-amber-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "all" && <AllWorldsTab q={sp.q} tag={sp.tag} sort={sp.sort as WorldSort} />}
      {tab === "players" && <PlayersTab q={sp.q} />}
      {tab === "favorites" && <FavoritesTab userId={user?.id} />}
    </div>
  );
}

async function AllWorldsTab({ q, tag, sort }: { q?: string; tag?: string; sort?: WorldSort }) {
  const worlds = await listPublicWorlds({ q, tag, sort: sort || "trending" });
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <form className="mb-6 flex flex-wrap gap-3" action="/worlds">
        <input type="hidden" name="tab" value="all" />
        <TextInput name="q" placeholder="Search by title..." defaultValue={q} className="max-w-xs" />
        <Select name="tag" defaultValue={tag || ""} className="max-w-[160px]">
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select name="sort" defaultValue={sort || "trending"} className="max-w-[200px]">
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
        <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700">
          Filter
        </button>
      </form>

      {worlds.length === 0 ? (
        <EmptyState>No public worlds match yet. Be the first to publish one!</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worlds.map((w) => {
            const term = parseTerminology(w.terminology);
            return (
              <Link key={w.id} href={`/worlds/${w.slug}`}>
                <Card className="h-full transition-colors hover:border-amber-500/50">
                  <h3 className="mb-1 font-semibold text-slate-50">{w.name}</h3>
                  <p className="mb-2 text-xs text-slate-500">by {w.owner.username}</p>
                  <p className="mb-3 line-clamp-3 text-sm text-slate-400">
                    {w.description || "No description yet."}
                  </p>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {w.tags.map((t) => (
                      <Badge key={t.tagId}>{t.tag.name}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {w.avgRating ? `★ ${w.avgRating.toFixed(1)} (${w.ratingCount})` : "No ratings yet"}
                    </span>
                    <span>{w.visitCount} visits</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">Time step: {term.timeUnit}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function PlayersTab({ q }: { q?: string }) {
  const users = await prisma.user.findMany({
    where: q ? { username: { contains: q } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 60,
    include: { _count: { select: { worlds: true, favorites: true } } },
  });

  return (
    <div>
      <form className="mb-6 flex gap-3" action="/worlds">
        <input type="hidden" name="tab" value="players" />
        <TextInput name="q" placeholder="Search players..." defaultValue={q} className="max-w-xs" />
        <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700">
          Search
        </button>
      </form>
      {users.length === 0 ? (
        <EmptyState>No players found.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <Link key={u.id} href={`/users/${u.username}`}>
              <Card className="hover:border-amber-500/50">
                <p className="font-semibold text-slate-50">{u.username}</p>
                <p className="text-xs text-slate-500">
                  {u._count.worlds} worlds created &middot; {u._count.favorites} favorites
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

async function FavoritesTab({ userId }: { userId?: string }) {
  if (!userId) {
    return <EmptyState>Log in to see the worlds you have favorited.</EmptyState>;
  }
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: { world: { include: { owner: true, tags: { include: { tag: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  if (favorites.length === 0) {
    return <EmptyState>You have not favorited any worlds yet.</EmptyState>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((f) => (
        <Link key={f.id} href={`/worlds/${f.world.slug}`}>
          <Card className="h-full hover:border-amber-500/50">
            <h3 className="mb-1 font-semibold text-slate-50">{f.world.name}</h3>
            <p className="mb-2 text-xs text-slate-500">by {f.world.owner.username}</p>
            <p className="line-clamp-3 text-sm text-slate-400">{f.world.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
