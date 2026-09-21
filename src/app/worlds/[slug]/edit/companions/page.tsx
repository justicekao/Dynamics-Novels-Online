import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { parseTerminology } from "@/lib/constants";
import { parseJsonArray } from "@/lib/json";
import { deleteCompanionAction, upsertCompanionAction } from "@/app/worlds/[slug]/edit/companions/actions";
import { Button, Card, CheckboxList, Field, PageTitle, TextArea, TextInput } from "@/components/ui";

export default async function CompanionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const term = parseTerminology(world.terminology);
  const [companions, classes, skills] = await Promise.all([
    prisma.companion.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.class.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.skill.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);
  const classOptions = classes.map((c) => ({ id: c.id, label: c.name }));
  const skillOptions = skills.map((s) => ({ id: s.id, label: s.name }));

  return (
    <div>
      <PageTitle
        subtitle={`${term.companion}s are recruitable allies with their own level, XP, and skills learned from classes you allow.`}
      >
        {term.companion}s
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New {term.companion.toLowerCase()}</h3>
        <CompanionFields slug={slug} classOptions={classOptions} skillOptions={skillOptions} />
      </Card>

      <div className="flex flex-col gap-4">
        {companions.map((c) => (
          <Card key={c.id}>
            <CompanionFields slug={slug} companion={c} classOptions={classOptions} skillOptions={skillOptions} />
            <form action={deleteCompanionAction} className="mt-2">
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

type CompanionRow = Awaited<ReturnType<typeof prisma.companion.findFirst>>;

function CompanionFields({
  slug,
  companion,
  classOptions,
  skillOptions,
}: {
  slug: string;
  companion?: NonNullable<CompanionRow>;
  classOptions: { id: string; label: string }[];
  skillOptions: { id: string; label: string }[];
}) {
  return (
    <form action={upsertCompanionAction}>
      <input type="hidden" name="slug" value={slug} />
      {companion && <input type="hidden" name="id" value={companion.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <TextInput name="name" defaultValue={companion?.name} required />
        </Field>
        <Field label="Initial level">
          <TextInput type="number" name="initialLevel" defaultValue={companion?.initialLevel ?? 1} />
        </Field>
      </div>
      <Field label="Description">
        <TextArea name="description" defaultValue={companion?.description} />
      </Field>
      <Field label="Portrait seed">
        <TextInput name="portraitSeed" defaultValue={companion?.portraitSeed} />
      </Field>
      <Field label="Can learn skills from these classes">
        <CheckboxList name="allowedClassIds" options={classOptions} selected={companion ? parseJsonArray(companion.allowedClassIds) : []} />
      </Field>
      <Field label="Starting skills">
        <CheckboxList name="initialSkillIds" options={skillOptions} selected={companion ? parseJsonArray(companion.initialSkillIds) : []} />
      </Field>
      <Field label="Skills hidden from the player by default" hint="Only relevant while 'hide companion skills' is on below.">
        <CheckboxList name="hiddenSkillIds" options={skillOptions} selected={companion ? parseJsonArray(companion.hiddenSkillIds) : []} />
      </Field>
      <label className="mb-4 flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          name="hideCompanionSkillsByDefault"
          defaultChecked={companion?.hideCompanionSkillsByDefault ?? true}
          className="accent-amber-500"
        />
        Hide companion-only skills from the player by default
      </label>
      <Button type="submit" variant={companion ? "secondary" : "primary"}>
        {companion ? "Save" : "Create"}
      </Button>
    </form>
  );
}
