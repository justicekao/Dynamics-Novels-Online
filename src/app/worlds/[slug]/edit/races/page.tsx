import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { CORE_STATS, RESISTANCE_STATS, parseTerminology } from "@/lib/constants";
import { parseStatModifiers } from "@/lib/statForm";
import { parseJsonArray } from "@/lib/json";
import { deleteRaceAction, upsertRaceAction } from "@/app/worlds/[slug]/edit/races/actions";
import { Button, Card, CheckboxList, Field, PageTitle, StatGrid, TextArea, TextInput } from "@/components/ui";

const ALL_STAT_KEYS = [...CORE_STATS, ...RESISTANCE_STATS];

export default async function RacesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const term = parseTerminology(world.terminology);
  const [races, traits] = await Promise.all([
    prisma.race.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.trait.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);
  const traitOptions = traits.map((t) => ({ id: t.id, label: t.name }));

  return (
    <div>
      <PageTitle subtitle={`${term.race}s players and companions can belong to, each with stat modifiers and starting traits.`}>
        {term.race}s
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New {term.race.toLowerCase()}</h3>
        <form action={upsertRaceAction}>
          <input type="hidden" name="slug" value={slug} />
          <Field label="Name">
            <TextInput name="name" required />
          </Field>
          <Field label="Description">
            <TextArea name="description" />
          </Field>
          <Field label="Stat modifiers">
            <StatGrid stats={ALL_STAT_KEYS} values={{}} />
          </Field>
          <Field label="Starting traits">
            <CheckboxList name="traitIds" options={traitOptions} selected={[]} />
          </Field>
          <Button type="submit">Create {term.race.toLowerCase()}</Button>
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        {races.map((r) => (
          <Card key={r.id}>
            <form action={upsertRaceAction}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={r.id} />
              <Field label="Name">
                <TextInput name="name" defaultValue={r.name} required />
              </Field>
              <Field label="Description">
                <TextArea name="description" defaultValue={r.description} />
              </Field>
              <Field label="Stat modifiers">
                <StatGrid stats={ALL_STAT_KEYS} values={parseStatModifiers(r.statModifiers)} />
              </Field>
              <Field label="Starting traits">
                <CheckboxList name="traitIds" options={traitOptions} selected={parseJsonArray(r.traitIds)} />
              </Field>
              <Button type="submit" variant="secondary">
                Save
              </Button>
            </form>
            <form action={deleteRaceAction} className="mt-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={r.id} />
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
