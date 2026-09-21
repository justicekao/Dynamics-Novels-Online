import { requireOwnCharacter } from "@/lib/loadCharacter";
import { prisma } from "@/lib/db";
import { parseTerminology, ALL_STATS } from "@/lib/constants";
import { characterStateFrom, checkConditions, parseConditions } from "@/lib/gameEngine";
import { Badge, Card, LinkButton, PageTitle } from "@/components/ui";

export default async function CharacterSheetPage({
  params,
}: {
  params: Promise<{ slug: string; characterId: string }>;
}) {
  const { slug, characterId } = await params;
  const { world, character } = await requireOwnCharacter(slug, characterId);
  const term = parseTerminology(world.terminology);
  const state = characterStateFrom(character);

  const [allSkills, allTraits, allItems, allNpcs, allCompanions] = await Promise.all([
    prisma.skill.findMany({ where: { worldId: world.id } }),
    prisma.trait.findMany({ where: { worldId: world.id } }),
    prisma.item.findMany({ where: { worldId: world.id } }),
    prisma.npc.findMany({ where: { worldId: world.id } }),
    prisma.companion.findMany({ where: { worldId: world.id } }),
  ]);

  const traitById = new Map(allTraits.map((t) => [t.id, t]));
  const itemById = new Map(allItems.map((i) => [i.id, i]));
  const npcById = new Map(allNpcs.map((n) => [n.id, n]));
  const companionById = new Map(allCompanions.map((c) => [c.id, c]));

  const knownSkills = allSkills.filter((s) => {
    if (s.neverUnlockable) return false;
    const conditions = parseConditions(s.unlockConditions);
    return checkConditions(conditions, state);
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageTitle subtitle={`${character.name} — Level ${character.level} (${character.xp} XP)`}>
        Character sheet
      </PageTitle>
      <div className="mb-4">
        <LinkButton href={`/worlds/${slug}/play/${characterId}`} variant="ghost">
          &larr; Back
        </LinkButton>
      </div>

      <Card className="mb-4">
        <h3 className="mb-3 font-semibold text-slate-100">Stats</h3>
        <div className="grid grid-cols-3 gap-3 text-sm sm:grid-cols-4">
          {ALL_STATS.map((s) => (
            <div key={s}>
              <p className="text-xs text-slate-500">{s}</p>
              <p className="text-slate-200">{state.stats[s] ?? 0}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <h3 className="mb-3 font-semibold text-slate-100">{term.skill}s available</h3>
        {knownSkills.length === 0 ? (
          <p className="text-sm text-slate-500">None yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {knownSkills.map((s) => (
              <Badge key={s.id}>{s.name}</Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <h3 className="mb-3 font-semibold text-slate-100">Traits</h3>
        {state.traitIds.length === 0 ? (
          <p className="text-sm text-slate-500">None yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {state.traitIds.map((id) => (
              <Badge key={id}>{traitById.get(id)?.name ?? "Unknown trait"}</Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <h3 className="mb-3 font-semibold text-slate-100">Inventory</h3>
        {state.inventory.length === 0 ? (
          <p className="text-sm text-slate-500">Empty.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-slate-300">
            {state.inventory.map((i) => (
              <li key={i.itemId} className="flex justify-between">
                <span>{itemById.get(i.itemId)?.name ?? "Unknown item"}</span>
                <span className="text-slate-500">x{i.qty}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mb-4">
        <h3 className="mb-3 font-semibold text-slate-100">{term.companion}s</h3>
        {state.companions.length === 0 ? (
          <p className="text-sm text-slate-500">None recruited.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-slate-300">
            {state.companions.map((c) => (
              <li key={c.companionId} className="flex justify-between">
                <span>{companionById.get(c.companionId)?.name ?? "Unknown"}</span>
                <span className="text-slate-500">
                  Lv {c.level} &middot; {c.xp} XP
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-100">Known {term.npc}s</h3>
        {(() => {
          const known = Array.from(new Set(JSON.parse(character.knownNpcIds || "[]") as string[]));
          if (known.length === 0) return <p className="text-sm text-slate-500">None met yet.</p>;
          return (
            <div className="flex flex-wrap gap-1">
              {known.map((id) => (
                <Badge key={id}>{npcById.get(id)?.name ?? companionById.get(id)?.name ?? "Unknown"}</Badge>
              ))}
            </div>
          );
        })()}
      </Card>
    </div>
  );
}
