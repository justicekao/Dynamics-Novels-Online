import { notFound } from "next/navigation";
import { requireOwnCharacter } from "@/lib/loadCharacter";
import { prisma } from "@/lib/db";
import { parseTerminology } from "@/lib/constants";
import { parseJsonArray, parseJsonAny } from "@/lib/json";
import { characterStateFrom, checkConditions, parseConditions, seededPick } from "@/lib/gameEngine";
import {
  advanceTimeAction,
  meetNpcAction,
  recruitCompanionAction,
  travelAction,
} from "@/app/worlds/[slug]/play/[characterId]/actions";
import { Badge, Button, Card, LinkButton, PageTitle } from "@/components/ui";

export default async function PlayHomePage({
  params,
}: {
  params: Promise<{ slug: string; characterId: string }>;
}) {
  const { slug, characterId } = await params;
  const { world, character } = await requireOwnCharacter(slug, characterId);
  const term = parseTerminology(world.terminology);

  if (!character.currentLocationId) notFound();
  const location = await prisma.location.findUnique({ where: { id: character.currentLocationId } });
  if (!location) notFound();

  const state = characterStateFrom(character);
  const stats = state.stats;

  const [npcPool, companionPool, dungeonsHere, connectionsFrom, connectionsTo, race, klass] = await Promise.all([
    prisma.npc.findMany({ where: { id: { in: parseJsonArray(location.npcPoolIds) } } }),
    prisma.companion.findMany({ where: { id: { in: parseJsonArray(location.companionPoolIds) } } }),
    prisma.dungeon.findMany({ where: { locationId: location.id } }),
    prisma.locationConnection.findMany({ where: { fromId: location.id }, include: { to: true } }),
    prisma.locationConnection.findMany({ where: { toId: location.id }, include: { from: true } }),
    character.raceId ? prisma.race.findUnique({ where: { id: character.raceId } }) : null,
    character.classId ? prisma.class.findUnique({ where: { id: character.classId } }) : null,
  ]);

  const connectedLocations = [
    ...connectionsFrom.map((c) => c.to),
    ...connectionsTo.map((c) => c.from),
  ];
  const visibleConnections = connectedLocations.filter((l) => {
    if (!l.hidden) return true;
    return checkConditions(parseConditions(l.unlockConditions), state);
  });

  const knownNpcIds = new Set(parseJsonArray(character.knownNpcIds));
  const shownNpcs = seededPick(npcPool, Math.min(3, npcPool.length), `${character.id}-${character.timeElapsed}-npc`);
  const recruitedCompanionIds = new Set(state.companions.map((c) => c.companionId));
  const availableCompanions = companionPool.filter((c) => !recruitedCompanionIds.has(c.id));

  const log = parseJsonAny<string[]>(character.log, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageTitle
          subtitle={`${character.name}${race ? ` · ${race.name}` : ""}${klass ? ` · ${klass.name}` : ""} · Level ${character.level} · ${character.timeElapsed} ${term.timeUnitPlural.toLowerCase()} elapsed`}
        >
          {location.name}
        </PageTitle>
        <div className="flex gap-2">
          <LinkButton href={`/worlds/${slug}/play/${characterId}/sheet`} variant="secondary">
            Character sheet
          </LinkButton>
          <LinkButton href={`/worlds/${slug}/play`} variant="ghost">
            Switch character
          </LinkButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="mb-4">
            <p className="mb-3 text-sm text-slate-300">{location.description || "Nothing remarkable here."}</p>
            <div className="flex items-center gap-3 text-sm">
              <Badge tone="amber">
                HP {stats.HP ?? 0}/{stats.MaxHP ?? 0}
              </Badge>
              <Badge>
                MP {stats.MP ?? 0}/{stats.MaxMP ?? 0}
              </Badge>
              <form action={advanceTimeAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="characterId" value={characterId} />
                <Button type="submit" variant="secondary">
                  Let a {term.timeUnit.toLowerCase()} pass
                </Button>
              </form>
            </div>
          </Card>

          <Card className="mb-4">
            <h3 className="mb-3 font-semibold text-slate-100">People here</h3>
            {shownNpcs.length === 0 && availableCompanions.length === 0 ? (
              <p className="text-sm text-slate-500">No one around right now.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {shownNpcs.map((npc) => (
                  <div key={npc.id} className="flex items-center justify-between rounded-lg border border-slate-800 p-2">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{npc.name}</p>
                      {knownNpcIds.has(npc.id) && <Badge tone="green">Known</Badge>}
                    </div>
                    <form action={meetNpcAction}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="characterId" value={characterId} />
                      <input type="hidden" name="npcId" value={npc.id} />
                      <Button type="submit" variant="secondary">
                        Talk
                      </Button>
                    </form>
                  </div>
                ))}
                {availableCompanions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-amber-900/40 p-2">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{c.name}</p>
                      <Badge tone="amber">Recruitable {term.companion}</Badge>
                    </div>
                    <form action={recruitCompanionAction}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="characterId" value={characterId} />
                      <input type="hidden" name="companionId" value={c.id} />
                      <Button type="submit">Recruit</Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {dungeonsHere.length > 0 && (
            <Card className="mb-4">
              <h3 className="mb-3 font-semibold text-slate-100">{term.dungeon}s</h3>
              <div className="flex flex-col gap-2">
                {dungeonsHere.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-800 p-2">
                    <p className="text-sm font-medium text-slate-100">{d.name}</p>
                    <LinkButton href={`/worlds/${slug}/play/${characterId}/dungeon/${d.id}`} variant="secondary">
                      Enter
                    </LinkButton>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="mb-3 font-semibold text-slate-100">Travel</h3>
            {visibleConnections.length === 0 ? (
              <p className="text-sm text-slate-500">No roads lead elsewhere from here.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {visibleConnections.map((l) => (
                  <form key={l.id} action={travelAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="characterId" value={characterId} />
                    <input type="hidden" name="locationId" value={l.id} />
                    <Button type="submit" variant="secondary">
                      {l.name}
                    </Button>
                  </form>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="mb-4">
            <h3 className="mb-2 font-semibold text-slate-100">Party</h3>
            {state.companions.length === 0 ? (
              <p className="text-sm text-slate-500">No {term.companion.toLowerCase()}s yet.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm text-slate-300">
                {state.companions.map((c) => (
                  <CompanionRow key={c.companionId} companionId={c.companionId} level={c.level} />
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h3 className="mb-2 font-semibold text-slate-100">Recent events</h3>
            {log.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing has happened yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-xs text-slate-400">
                {log
                  .slice(-8)
                  .reverse()
                  .map((line, i) => (
                    <li key={i} className="border-b border-slate-800 pb-1 last:border-none">
                      {line}
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

async function CompanionRow({ companionId, level }: { companionId: string; level: number }) {
  const companion = await prisma.companion.findUnique({ where: { id: companionId } });
  if (!companion) return null;
  return (
    <li className="flex justify-between">
      <span>{companion.name}</span>
      <span className="text-slate-500">Lv {level}</span>
    </li>
  );
}
