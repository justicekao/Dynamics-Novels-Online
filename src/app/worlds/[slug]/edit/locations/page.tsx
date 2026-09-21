import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { parseTerminology } from "@/lib/constants";
import { parseJsonArray, parseJsonAny } from "@/lib/json";
import { deleteLocationAction, upsertLocationAction } from "@/app/worlds/[slug]/edit/locations/actions";
import { ConditionEditor, type Condition } from "@/components/ConditionEditor";
import { Badge, Button, Card, CheckboxList, Field, PageTitle, TextArea, TextInput } from "@/components/ui";

export default async function LocationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const term = parseTerminology(world.terminology);
  const [locations, npcs, items, traits, events, companions] = await Promise.all([
    prisma.location.findMany({
      where: { worldId: world.id },
      orderBy: { name: "asc" },
      include: { roadsFrom: true, roadsTo: true },
    }),
    prisma.npc.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.trait.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.event.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.companion.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);
  const npcOptions = npcs.map((n) => ({ id: n.id, label: n.name }));
  const companionOptions = companions.map((c) => ({ id: c.id, label: c.name }));
  const condOpts = {
    items: items.map((i) => ({ id: i.id, name: i.name })),
    traits: traits.map((t) => ({ id: t.id, name: t.name })),
    events: events.map((e) => ({ id: e.id, name: e.name })),
    companions: companions.map((c) => ({ id: c.id, name: c.name })),
  };

  return (
    <div>
      <PageTitle subtitle={`${term.location}s make up the map. Connect them with roads, and hide/lock some until conditions are met.`}>
        {term.location}s
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New {term.location.toLowerCase()}</h3>
        <LocationFields
          slug={slug}
          npcOptions={npcOptions}
          companionOptions={companionOptions}
          condOpts={condOpts}
          allOtherLocations={locations.map((l) => ({ id: l.id, label: l.name }))}
        />
      </Card>

      <div className="flex flex-col gap-4">
        {locations.map((l) => {
          const connectedIds = [...l.roadsFrom.map((r) => r.toId), ...l.roadsTo.map((r) => r.fromId)];
          return (
            <Card key={l.id}>
              <div className="mb-2 flex gap-2">
                {l.hidden && <Badge tone="red">Hidden</Badge>}
                {l.isStart && <Badge tone="green">Starting location</Badge>}
              </div>
              <LocationFields
                slug={slug}
                location={l}
                npcOptions={npcOptions}
                companionOptions={companionOptions}
                condOpts={condOpts}
                allOtherLocations={locations.filter((o) => o.id !== l.id).map((o) => ({ id: o.id, label: o.name }))}
                connectedIds={connectedIds}
              />
              <form action={deleteLocationAction} className="mt-2">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={l.id} />
                <Button type="submit" variant="danger">
                  Delete
                </Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

type LocationRow = Awaited<ReturnType<typeof prisma.location.findFirst>>;

function LocationFields({
  slug,
  location,
  npcOptions,
  companionOptions,
  condOpts,
  allOtherLocations,
  connectedIds = [],
}: {
  slug: string;
  location?: NonNullable<LocationRow>;
  npcOptions: { id: string; label: string }[];
  companionOptions: { id: string; label: string }[];
  condOpts: { items: { id: string; name: string }[]; traits: { id: string; name: string }[]; events: { id: string; name: string }[]; companions: { id: string; name: string }[] };
  allOtherLocations: { id: string; label: string }[];
  connectedIds?: string[];
}) {
  return (
    <form action={upsertLocationAction}>
      <input type="hidden" name="slug" value={slug} />
      {location && <input type="hidden" name="id" value={location.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name">
          <TextInput name="name" defaultValue={location?.name} required />
        </Field>
        <Field label="Map X">
          <TextInput type="number" name="x" defaultValue={location?.x ?? 0} />
        </Field>
        <Field label="Map Y">
          <TextInput type="number" name="y" defaultValue={location?.y ?? 0} />
        </Field>
      </div>
      <Field label="Description">
        <TextArea name="description" defaultValue={location?.description} />
      </Field>
      <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="hidden" defaultChecked={location?.hidden} className="accent-amber-500" />
          Hidden until unlocked
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isStart" defaultChecked={location?.isStart} className="accent-amber-500" />
          New characters start here
        </label>
      </div>
      <Field label="Unlock conditions">
        <ConditionEditor
          name="unlock"
          initial={location ? parseJsonAny<Condition[]>(location.unlockConditions, []) : []}
          {...condOpts}
        />
      </Field>
      <Field label="NPCs that can appear here">
        <CheckboxList name="npcPoolIds" options={npcOptions} selected={location ? parseJsonArray(location.npcPoolIds) : []} />
      </Field>
      <Field label="Companions recruitable here">
        <CheckboxList
          name="companionPoolIds"
          options={companionOptions}
          selected={location ? parseJsonArray(location.companionPoolIds) : []}
        />
      </Field>
      <Field label="Connected locations (roads)">
        <CheckboxList name="connectedIds" options={allOtherLocations} selected={connectedIds} />
      </Field>
      <Button type="submit" variant={location ? "secondary" : "primary"}>
        {location ? "Save" : "Create"}
      </Button>
    </form>
  );
}
