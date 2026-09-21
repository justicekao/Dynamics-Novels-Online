import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { ELEMENTS, SKILL_TARGET_TYPES, SKILL_TYPES, parseTerminology } from "@/lib/constants";
import { parseJsonAny } from "@/lib/json";
import { deleteSkillAction, upsertSkillAction } from "@/app/worlds/[slug]/edit/skills/actions";
import { ConditionEditor, type Condition } from "@/components/ConditionEditor";
import { Button, Card, CheckboxList, Field, PageTitle, Select, TextArea, TextInput } from "@/components/ui";
import type { Skill } from "@/generated/prisma/client";

export default async function SkillsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const term = parseTerminology(world.terminology);
  const [skills, traits, effects, items, events, companions] = await Promise.all([
    prisma.skill.findMany({ where: { worldId: world.id }, include: { effects: true }, orderBy: { name: "asc" } }),
    prisma.trait.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.effectDefinition.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.event.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.companion.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);
  const effectOptions = effects.map((e) => ({ id: e.id, label: e.name }));
  const condOpts = {
    items: items.map((i) => ({ id: i.id, name: i.name })),
    traits: traits.map((t) => ({ id: t.id, name: t.name })),
    events: events.map((e) => ({ id: e.id, name: e.name })),
    companions: companions.map((c) => ({ id: c.id, name: c.name })),
  };

  return (
    <div>
      <PageTitle subtitle={`${term.skill}s can be active abilities or passives, deal elemental damage, apply effects, and unlock behind conditions.`}>
        {term.skill}s
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New {term.skill.toLowerCase()}</h3>
        <SkillFields slug={slug} traits={traits} effectOptions={effectOptions} selected={[]} condOpts={condOpts} unlock={[]} />
      </Card>

      <div className="flex flex-col gap-4">
        {skills.map((s) => (
          <Card key={s.id}>
            <SkillFields
              slug={slug}
              skill={s}
              traits={traits}
              effectOptions={effectOptions}
              selected={s.effects.map((e) => e.effectId)}
              condOpts={condOpts}
              unlock={parseJsonAny<Condition[]>(s.unlockConditions, [])}
            />
            <form action={deleteSkillAction} className="mt-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={s.id} />
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

function SkillFields({
  slug,
  skill,
  traits,
  effectOptions,
  selected,
  condOpts,
  unlock,
}: {
  slug: string;
  skill?: Skill;
  traits: { id: string; name: string }[];
  effectOptions: { id: string; label: string }[];
  selected: string[];
  condOpts: { items: { id: string; name: string }[]; traits: { id: string; name: string }[]; events: { id: string; name: string }[]; companions: { id: string; name: string }[] };
  unlock: Condition[];
}) {
  return (
    <form action={upsertSkillAction}>
      <input type="hidden" name="slug" value={slug} />
      {skill && <input type="hidden" name="id" value={skill.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name">
          <TextInput name="name" defaultValue={skill?.name} required />
        </Field>
        <Field label="Type">
          <Select name="type" defaultValue={skill?.type || "ACTIVE"}>
            {SKILL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Target">
          <Select name="targetType" defaultValue={skill?.targetType || "SINGLE_ENEMY"}>
            {SKILL_TARGET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Description">
        <TextArea name="description" defaultValue={skill?.description} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Element">
          <Select name="element" defaultValue={skill?.element || "None"}>
            {ELEMENTS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Base power">
          <TextInput type="number" name="basePower" defaultValue={skill?.basePower ?? 10} />
        </Field>
        <Field label="Success chance (%)">
          <TextInput type="number" name="baseSuccessChance" defaultValue={skill?.baseSuccessChance ?? 100} />
        </Field>
        <Field label="Requires trait">
          <Select name="requiresTraitId" defaultValue={skill?.requiresTraitId || ""}>
            <option value="">-- none --</option>
            {traits.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Using this skill may grant trait" hint="e.g. knowing a fire skill could make the player 'Fireproof'.">
          <Select name="grantsTraitId" defaultValue={skill?.grantsTraitId || ""}>
            <option value="">-- none --</option>
            {traits.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Chance to grant trait (%)">
          <TextInput type="number" name="grantsTraitChance" defaultValue={skill?.grantsTraitChance ?? 0} />
        </Field>
      </div>
      <Field label="Effects">
        <CheckboxList name="effectIds" options={effectOptions} selected={selected} />
      </Field>
      <Field label="Unlock conditions" hint="Leave all rows unused for a skill that is available from the start.">
        <ConditionEditor name="unlock" initial={unlock} {...condOpts} />
      </Field>
      <label className="mb-4 flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" name="neverUnlockable" defaultChecked={skill?.neverUnlockable} className="accent-amber-500" />
        Never unlockable (creator-only / lore skill)
      </label>
      <Button type="submit" variant={skill ? "secondary" : "primary"}>
        {skill ? "Save" : "Create"}
      </Button>
    </form>
  );
}
