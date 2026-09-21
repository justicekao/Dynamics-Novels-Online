import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { parseTerminology } from "@/lib/constants";
import { parseJsonArray } from "@/lib/json";
import { deleteNpcAction, upsertNpcAction } from "@/app/worlds/[slug]/edit/npcs/actions";
import { Button, Card, CheckboxList, Field, PageTitle, TextArea, TextInput } from "@/components/ui";

export default async function NpcsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const term = parseTerminology(world.terminology);
  const [npcs, traits, skills, items] = await Promise.all([
    prisma.npc.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.trait.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.skill.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);
  const traitOptions = traits.map((t) => ({ id: t.id, label: t.name }));
  const skillOptions = skills.map((s) => ({ id: s.id, label: s.name }));
  const itemOptions = items.map((i) => ({ id: i.id, label: i.name }));

  return (
    <div>
      <PageTitle
        subtitle={`${term.npc}s populate locations. Add them to a location's NPC pool so they show up as encounter options.`}
      >
        {term.npc}s
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New {term.npc.toLowerCase()}</h3>
        <NpcFields slug={slug} traitOptions={traitOptions} skillOptions={skillOptions} itemOptions={itemOptions} />
      </Card>

      <div className="flex flex-col gap-4">
        {npcs.map((n) => (
          <Card key={n.id}>
            <NpcFields
              slug={slug}
              npc={n}
              traitOptions={traitOptions}
              skillOptions={skillOptions}
              itemOptions={itemOptions}
            />
            <form action={deleteNpcAction} className="mt-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={n.id} />
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

type NpcRow = Awaited<ReturnType<typeof prisma.npc.findFirst>>;

function NpcFields({
  slug,
  npc,
  traitOptions,
  skillOptions,
  itemOptions,
}: {
  slug: string;
  npc?: NonNullable<NpcRow>;
  traitOptions: { id: string; label: string }[];
  skillOptions: { id: string; label: string }[];
  itemOptions: { id: string; label: string }[];
}) {
  return (
    <form action={upsertNpcAction}>
      <input type="hidden" name="slug" value={slug} />
      {npc && <input type="hidden" name="id" value={npc.id} />}
      <Field label="Name">
        <TextInput name="name" defaultValue={npc?.name} required />
      </Field>
      <Field label="Description">
        <TextArea name="description" defaultValue={npc?.description} />
      </Field>
      <Field label="Portrait seed" hint="A short word/phrase used to pick a consistent generated portrait.">
        <TextInput name="portraitSeed" defaultValue={npc?.portraitSeed} />
      </Field>
      <Field label="Traits">
        <CheckboxList name="traitIds" options={traitOptions} selected={npc ? parseJsonArray(npc.traitIds) : []} />
      </Field>
      <Field label="Skills">
        <CheckboxList name="skillIds" options={skillOptions} selected={npc ? parseJsonArray(npc.skillIds) : []} />
      </Field>
      <Field label="Carries items">
        <CheckboxList name="itemIds" options={itemOptions} selected={npc ? parseJsonArray(npc.itemIds) : []} />
      </Field>
      <Button type="submit" variant={npc ? "secondary" : "primary"}>
        {npc ? "Save" : "Create"}
      </Button>
    </form>
  );
}
