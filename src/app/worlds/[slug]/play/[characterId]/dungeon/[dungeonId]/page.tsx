import { notFound } from "next/navigation";
import { requireOwnCharacter } from "@/lib/loadCharacter";
import { prisma } from "@/lib/db";
import { parseJsonObject } from "@/lib/json";
import { exploreFloorAction } from "./actions";
import { Badge, Button, Card, LinkButton, PageTitle } from "@/components/ui";

export default async function DungeonPlayPage({
  params,
}: {
  params: Promise<{ slug: string; characterId: string; dungeonId: string }>;
}) {
  const { slug, characterId, dungeonId } = await params;
  const { character } = await requireOwnCharacter(slug, characterId);

  const dungeon = await prisma.dungeon.findUnique({ where: { id: dungeonId } });
  if (!dungeon) notFound();
  const floors = await prisma.dungeonFloor.findMany({ where: { dungeonId }, orderBy: { order: "asc" } });

  const flags = parseJsonObject<Record<string, number>>(character.flags);
  const currentIndex = flags[`floor_${dungeonId}`] ?? 0;
  const complete = currentIndex >= floors.length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageTitle subtitle={dungeon.description}>{dungeon.name}</PageTitle>
      <Card className="mb-4">
        <div className="flex flex-col gap-2">
          {floors.map((f, i) => (
            <div
              key={f.id}
              className={`flex items-center justify-between rounded-lg border p-2 ${
                i === currentIndex ? "border-amber-600 bg-amber-500/5" : "border-slate-800"
              }`}
            >
              <span className="text-sm">
                {i + 1}. {f.name}
              </span>
              {i < currentIndex && <Badge tone="green">Cleared</Badge>}
              {i === currentIndex && <Badge tone="amber">Current</Badge>}
            </div>
          ))}
        </div>
      </Card>

      {complete ? (
        <Card>
          <p className="text-sm text-emerald-400">You have cleared every floor of {dungeon.name}!</p>
        </Card>
      ) : (
        <form action={exploreFloorAction}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="characterId" value={characterId} />
          <input type="hidden" name="dungeonId" value={dungeonId} />
          <Button type="submit">Explore {floors[currentIndex]?.name}</Button>
        </form>
      )}

      <div className="mt-4">
        <LinkButton href={`/worlds/${slug}/play/${characterId}`} variant="ghost">
          &larr; Back
        </LinkButton>
      </div>
    </div>
  );
}
