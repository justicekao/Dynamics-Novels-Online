import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toggleBlockAction, toggleFriendAction, updateBioAction } from "@/app/users/actions";
import { Badge, Button, Card, EmptyState, PageTitle, TextArea } from "@/components/ui";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await prisma.user.findUnique({ where: { username } });
  if (!profile) notFound();

  const me = await getCurrentUser();
  const isSelf = me?.id === profile.id;

  const worlds = await prisma.world.findMany({
    where: isSelf ? { ownerId: profile.id } : { ownerId: profile.id, visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
  });
  const totalVisits = worlds.reduce((sum, w) => sum + w.visitCount, 0);

  const favorites = isSelf
    ? await prisma.favorite.findMany({
        where: { userId: profile.id },
        include: { world: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  let isFriend = false;
  let isBlocked = false;
  if (me && !isSelf) {
    const [userAId, userBId] = me.id < profile.id ? [me.id, profile.id] : [profile.id, me.id];
    isFriend = !!(await prisma.friendship.findUnique({ where: { userAId_userBId: { userAId, userBId } } }));
    isBlocked = !!(await prisma.block.findUnique({
      where: { blockingId_blockedId: { blockingId: me.id, blockedId: profile.id } },
    }));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageTitle subtitle={`Joined ${new Date(profile.createdAt).toLocaleDateString()}`}>
          {profile.username}
        </PageTitle>
        {me && !isSelf && (
          <div className="flex gap-2">
            <form action={toggleFriendAction}>
              <input type="hidden" name="userId" value={profile.id} />
              <input type="hidden" name="username" value={profile.username} />
              <Button type="submit" variant={isFriend ? "primary" : "secondary"}>
                {isFriend ? "Friends ✓" : "Add friend"}
              </Button>
            </form>
            <form action={toggleBlockAction}>
              <input type="hidden" name="userId" value={profile.id} />
              <input type="hidden" name="username" value={profile.username} />
              <Button type="submit" variant={isBlocked ? "danger" : "ghost"}>
                {isBlocked ? "Unblock" : "Block"}
              </Button>
            </form>
          </div>
        )}
      </div>

      <Card className="mb-6">
        {isSelf ? (
          <form action={updateBioAction}>
            <TextArea name="bio" defaultValue={profile.bio} placeholder="Write a short bio..." className="mb-2" />
            <Button type="submit" variant="secondary">
              Save bio
            </Button>
          </form>
        ) : (
          <p className="text-sm text-slate-300">{profile.bio || "No bio yet."}</p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          {worlds.length} worlds created &middot; {totalVisits} total visits across all worlds
        </p>
      </Card>

      <h2 className="mb-3 text-lg font-semibold text-slate-100">Worlds</h2>
      {worlds.length === 0 ? (
        <EmptyState>No worlds yet.</EmptyState>
      ) : (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {worlds.map((w) => (
            <Link key={w.id} href={`/worlds/${w.slug}`}>
              <Card className="hover:border-amber-500/50">
                <p className="font-semibold text-slate-50">{w.name}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <Badge tone={w.visibility === "PUBLIC" ? "green" : "default"}>
                    {w.visibility === "PUBLIC" ? "Public" : "Private"}
                  </Badge>
                  <span>{w.visitCount} visits</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {isSelf && (
        <>
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Favorites</h2>
          {favorites.length === 0 ? (
            <EmptyState>You have not favorited any worlds yet.</EmptyState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {favorites.map((f) => (
                <Link key={f.id} href={`/worlds/${f.world.slug}`}>
                  <Card className="hover:border-amber-500/50">
                    <p className="font-semibold text-slate-50">{f.world.name}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
