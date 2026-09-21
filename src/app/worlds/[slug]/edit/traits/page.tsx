import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { CORE_STATS, RESISTANCE_STATS } from "@/lib/constants";
import { parseStatModifiers } from "@/lib/statForm";
import { deleteTraitAction, upsertTraitAction } from "@/app/worlds/[slug]/edit/traits/actions";
import { Button, Card, Field, PageTitle, StatGrid, TextArea, TextInput } from "@/components/ui";

const ALL_STAT_KEYS = [...CORE_STATS, ...RESISTANCE_STATS];

export default async function TraitsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const traits = await prisma.trait.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } });

  return (
    <div>
      <PageTitle subtitle="Traits are personality/physical flags that races, skills, and events can grant or require.">
        Traits
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New trait</h3>
        <form action={upsertTraitAction}>
          <input type="hidden" name="slug" value={slug} />
          <Field label="Name">
            <TextInput name="name" required />
          </Field>
          <Field label="Description">
            <TextArea name="description" />
          </Field>
          <Field label="Stat modifiers" hint="Applied while this trait is active.">
            <StatGrid stats={ALL_STAT_KEYS} values={{}} />
          </Field>
          <Button type="submit">Create trait</Button>
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        {traits.map((t) => (
          <Card key={t.id}>
            <form action={upsertTraitAction}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={t.id} />
              <Field label="Name">
                <TextInput name="name" defaultValue={t.name} required />
              </Field>
              <Field label="Description">
                <TextArea name="description" defaultValue={t.description} />
              </Field>
              <Field label="Stat modifiers">
                <StatGrid stats={ALL_STAT_KEYS} values={parseStatModifiers(t.statModifiers)} />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" variant="secondary">
                  Save
                </Button>
              </div>
            </form>
            <form action={deleteTraitAction} className="mt-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={t.id} />
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
