import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getWorldBySlug, worldAccessFor, avgRating } from "@/lib/worlds";
import { parseTerminology } from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  commentOnWorldAction,
  duplicateWorldAction,
  rateWorldAction,
  recordVisitAction,
  toggleFavoriteAction,
} from "@/app/worlds/actions";
import { Badge, Button, Card, ErrorText, LinkButton, PageTitle, Select, TextArea } from "@/components/ui";

export default async function WorldDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const world = await getWorldBySlug(slug);
  if (!world) notFound();

  const user = await getCurrentUser();
  const access = worldAccessFor(world, user);
  if (access === "none") notFound();

  recordVisitAction(slug).catch(() => {});

  const term = parseTerminology(world.terminology);
  const { avg, count } = await avgRating(world.id);
  const isFavorite = user
    ? !!(await prisma.favorite.findUnique({ where: { worldId_userId: { worldId: world.id, userId: user.id } } }))
    : false;
  const myRating = user
    ? await prisma.rating.findUnique({ where: { worldId_userId: { worldId: world.id, userId: user.id } } })
    : null;
  const comments = world.allowComments
    ? await prisma.comment.findMany({
        where: { worldId: world.id },
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ErrorText>{error}</ErrorText>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageTitle
            subtitle={
              <>
                by{" "}
                <Link href={`/users/${world.owner.username}`} className="text-amber-400 hover:underline">
                  {world.owner.username}
                </Link>
                {world.forkedFromId ? " · forked world" : ""}
              </>
            }
          >
            {world.name}
          </PageTitle>
          <div className="flex flex-wrap gap-1">
            {world.tags.map((t) => (
              <Badge key={t.tagId}>{t.tag.name}</Badge>
            ))}
            <Badge tone={world.visibility === "PUBLIC" ? "green" : "default"}>
              {world.visibility === "PUBLIC" ? "Public" : "Private"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/worlds/${world.slug}/play`}>Play</LinkButton>
          {(access === "edit" || access === "admin") && (
            <LinkButton href={`/worlds/${world.slug}/edit`} variant="secondary">
              Edit
            </LinkButton>
          )}
          {user && (world.allowDuplication || access === "admin") && (
            <form action={duplicateWorldAction}>
              <input type="hidden" name="worldId" value={world.id} />
              <Button type="submit" variant="secondary">
                Duplicate
              </Button>
            </form>
          )}
          {user && (
            <form action={toggleFavoriteAction}>
              <input type="hidden" name="worldId" value={world.id} />
              <input type="hidden" name="slug" value={world.slug} />
              <Button type="submit" variant={isFavorite ? "primary" : "secondary"}>
                {isFavorite ? "★ Favorited" : "☆ Favorite"}
              </Button>
            </form>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <p className="whitespace-pre-wrap text-sm text-slate-300">
          {world.description || "No description yet."}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">Time step</dt>
            <dd className="text-slate-200">{term.timeUnit}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Visits</dt>
            <dd className="text-slate-200">{world.visitCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Rating</dt>
            <dd className="text-slate-200">{count ? `${avg.toFixed(1)} / 5 (${count})` : "No ratings"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Favorites</dt>
            <dd className="text-slate-200">{world._count.favorites}</dd>
          </div>
        </dl>
      </Card>

      {world.allowRatings && user && (
        <Card className="mb-6">
          <h3 className="mb-3 font-semibold text-slate-100">Rate this world</h3>
          <form action={rateWorldAction} className="flex items-center gap-3">
            <input type="hidden" name="worldId" value={world.id} />
            <input type="hidden" name="slug" value={world.slug} />
            <Select name="value" defaultValue={myRating?.value ?? 5} className="max-w-[120px]">
              {[5, 4, 3, 2, 1].map((v) => (
                <option key={v} value={v}>
                  {v} star{v > 1 ? "s" : ""}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              {myRating ? "Update rating" : "Submit rating"}
            </Button>
          </form>
        </Card>
      )}

      {world.allowComments && (
        <Card>
          <h3 className="mb-3 font-semibold text-slate-100">Comments ({comments.length})</h3>
          {user && (
            <form action={commentOnWorldAction} className="mb-4">
              <input type="hidden" name="worldId" value={world.id} />
              <input type="hidden" name="slug" value={world.slug} />
              <TextArea name="body" placeholder="Share your thoughts..." required className="mb-2" />
              <Button type="submit" variant="secondary">
                Post comment
              </Button>
            </form>
          )}
          <div className="flex flex-col gap-3">
            {comments.map((c) => (
              <div key={c.id} className="border-b border-slate-800 pb-3 last:border-none">
                <p className="text-sm">
                  <Link href={`/users/${c.user.username}`} className="font-semibold text-amber-400 hover:underline">
                    {c.user.username}
                  </Link>{" "}
                  <span className="text-xs text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </p>
                <p className="text-sm text-slate-300">{c.body}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
