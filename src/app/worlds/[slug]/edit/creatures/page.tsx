import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { CORE_STATS, ELEMENTS, RESISTANCE_STATS, parseTerminology } from "@/lib/constants";
import { parseJsonArray } from "@/lib/json";
import { parseStatModifiers } from "@/lib/statForm";
import { deleteCreatureAction, upsertCreatureAction } from "@/app/worlds/[slug]/edit/creatures/actions";
import { Button, Card, CheckboxList, Field, PageTitle, Select, StatGrid, TextArea, TextInput } from "@/components/ui";

const ALL_STAT_KEYS = [...CORE_STATS, ...RESISTANCE_STATS];

export default async function CreaturesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const term = parseTerminology(world.terminology);
  const [creatures, skills, items] = await Promise.all([
    prisma.creature.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.skill.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);
  const skillOptions = skills.map((s) => ({ id: s.id, label: s.name }));
  const itemOptions = items.map((i) => ({ id: i.id, label: i.name }));

  return (
    <div>
      <PageTitle subtitle={`${term.creature}s are combat opponents placed on dungeon floors, with abilities as complex as player skills.`}>
        {term.creature}s
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New {term.creature.toLowerCase()}</h3>
        <CreatureFields slug={slug} skillOptions={skillOptions} itemOptions={itemOptions} />
      </Card>

      <div className="flex flex-col gap-4">
        {creatures.map((c) => (
          <Card key={c.id}>
            <CreatureFields slug={slug} creature={c} skillOptions={skillOptions} itemOptions={itemOptions} />
            <form action={deleteCreatureAction} className="mt-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={c.id} />
              <Button type="submit" variant="danger">
                Delete
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}

type CreatureRow = Awaited<ReturnType<typeof prisma.creature.findFirst>>;

function CreatureFields({
  slug,
  creature,
  skillOptions,
  itemOptions,
}: {
  slug: string;
  creature?: NonNullable<CreatureRow>;
  skillOptions: { id: string; label: string }[];
  itemOptions: { id: string; label: string }[];
}) {
  return (
    <form action={upsertCreatureAction}>
      <input type="hidden" name="slug" value={slug} />
      {creature && <input type="hidden" name="id" value={creature.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name">
          <TextInput name="name" defaultValue={creature?.name} required />
        </Field>
        <Field label="Element">
          <Select name="element" defaultValue={creature?.element || "None"}>
            {ELEMENTS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="XP reward">
          <TextInput type="number" name="xpReward" defaultValue={creature?.xpReward ?? 10} />
        </Field>
      </div>
      <Field label="Description">
        <TextArea name="description" defaultValue={creature?.description} />
      </Field>
      <Field label="Portrait seed">
        <TextInput name="portraitSeed" defaultValue={creature?.portraitSeed} />
      </Field>
      <Field label="Stats">
        <StatGrid stats={ALL_STAT_KEYS} values={creature ? parseStatModifiers(creature.stats) : {}} />
      </Field>
      <Field label="Abilities">
        <CheckboxList name="skillIds" options={skillOptions} selected={creature ? parseJsonArray(creature.skillIds) : []} />
      </Field>
      <Field label="Loot on defeat">
        <CheckboxList name="lootItemIds" options={itemOptions} selected={creature ? parseJsonArray(creature.lootItemIds) : []} />
      </Field>
      <Button type="submit" variant={creature ? "secondary" : "primary"}>
        {creature ? "Save" : "Create"}
      </Button>
    </form>
  );
}
