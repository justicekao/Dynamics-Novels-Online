import Link from "next/link";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { parseTerminology } from "@/lib/constants";
import { parseJsonAny } from "@/lib/json";
import { deleteDungeonAction, upsertDungeonAction } from "@/app/worlds/[slug]/edit/dungeons/actions";
import { ConditionEditor, type Condition } from "@/components/ConditionEditor";
import { Button, Card, Field, PageTitle, Select, TextArea, TextInput } from "@/components/ui";

export default async function DungeonsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const term = parseTerminology(world.terminology);
  const [dungeons, locations, items, traits, events, companions] = await Promise.all([
    prisma.dungeon.findMany({
      where: { worldId: world.id },
      include: { location: true, floors: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.trait.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.event.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.companion.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);
  const condOpts = {
    items: items.map((i) => ({ id: i.id, name: i.name })),
    traits: traits.map((t) => ({ id: t.id, name: t.name })),
    events: events.map((e) => ({ id: e.id, name: e.name })),
    companions: companions.map((c) => ({ id: c.id, name: c.name })),
  };

  return (
    <div>
      <PageTitle subtitle={`${term.dungeon}s live at a ${term.location.toLowerCase()} and contain ordered floors with encounters and events.`}>
        {term.dungeon}s
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New {term.dungeon.toLowerCase()}</h3>
        <DungeonFields slug={slug} locations={locations} condOpts={condOpts} />
      </Card>

      <div className="flex flex-col gap-4">
        {dungeons.map((d) => (
          <Card key={d.id}>
            <DungeonFields slug={slug} dungeon={d} locations={locations} condOpts={condOpts} />
            <div className="mt-3 flex gap-2">
              <Link href={`/worlds/${slug}/edit/dungeons/${d.id}`}>
                <Button variant="secondary" type="button">
                  Manage floors ({d.floors.length})
                </Button>
              </Link>
              <form action={deleteDungeonAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={d.id} />
                <Button type="submit" variant="danger">
                  Delete
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

type DungeonRow = Awaited<ReturnType<typeof prisma.dungeon.findFirst>>;

function DungeonFields({
  slug,
  dungeon,
  locations,
  condOpts,
}: {
  slug: string;
  dungeon?: NonNullable<DungeonRow>;
  locations: { id: string; name: string }[];
  condOpts: { items: { id: string; name: string }[]; traits: { id: string; name: string }[]; events: { id: string; name: string }[]; companions: { id: string; name: string }[] };
}) {
  return (
    <form action={upsertDungeonAction}>
      <input type="hidden" name="slug" value={slug} />
      {dungeon && <input type="hidden" name="id" value={dungeon.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <TextInput name="name" defaultValue={dungeon?.name} required />
        </Field>
        <Field label="Location">
          <Select name="locationId" defaultValue={dungeon?.locationId} required>
            <option value="">-- choose --</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Description">
        <TextArea name="description" defaultValue={dungeon?.description} />
      </Field>
      <Field label="Music seed">
        <TextInput name="musicSeed" defaultValue={dungeon?.musicSeed} />
      </Field>
      <Field label="Unlock conditions">
        <ConditionEditor
          name="unlock"
          initial={dungeon ? parseJsonAny<Condition[]>(dungeon.unlockConditions, []) : []}
          {...condOpts}
        />
      </Field>
      <Button type="submit" variant={dungeon ? "secondary" : "primary"}>
        {dungeon ? "Save" : "Create"}
      </Button>
    </form>
  );
}
