import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { CORE_STATS, RESISTANCE_STATS, parseTerminology } from "@/lib/constants";
import { parseStatModifiers } from "@/lib/statForm";
import { parseJsonArray } from "@/lib/json";
import { deleteClassAction, upsertClassAction } from "@/app/worlds/[slug]/edit/classes/actions";
import { Button, Card, CheckboxList, Field, PageTitle, StatGrid, TextArea, TextInput } from "@/components/ui";

const ALL_STAT_KEYS = [...CORE_STATS, ...RESISTANCE_STATS];

export default async function ClassesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const term = parseTerminology(world.terminology);
  const [classes, skills] = await Promise.all([
    prisma.class.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.skill.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);
  const skillOptions = skills.map((s) => ({ id: s.id, label: s.name }));

  return (
    <div>
      <PageTitle subtitle={`${term.class}es define a starting skill set and stat modifiers.`}>
        {term.class}es
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New {term.class.toLowerCase()}</h3>
        <form action={upsertClassAction}>
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
          <Field label="Starting skills">
            <CheckboxList name="startingSkillIds" options={skillOptions} selected={[]} />
          </Field>
          <Button type="submit">Create {term.class.toLowerCase()}</Button>
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        {classes.map((c) => (
          <Card key={c.id}>
            <form action={upsertClassAction}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={c.id} />
              <Field label="Name">
                <TextInput name="name" defaultValue={c.name} required />
              </Field>
              <Field label="Description">
                <TextArea name="description" defaultValue={c.description} />
              </Field>
              <Field label="Stat modifiers">
                <StatGrid stats={ALL_STAT_KEYS} values={parseStatModifiers(c.statModifiers)} />
              </Field>
              <Field label="Starting skills">
                <CheckboxList name="startingSkillIds" options={skillOptions} selected={parseJsonArray(c.startingSkillIds)} />
              </Field>
              <Button type="submit" variant="secondary">
                Save
              </Button>
            </form>
            <form action={deleteClassAction} className="mt-2">
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
