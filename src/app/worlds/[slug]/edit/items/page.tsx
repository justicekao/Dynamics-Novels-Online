import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { CORE_STATS, ELEMENTS, ITEM_TYPES, RESISTANCE_STATS, parseTerminology } from "@/lib/constants";
import { parseStatModifiers } from "@/lib/statForm";
import { deleteItemAction, upsertItemAction } from "@/app/worlds/[slug]/edit/items/actions";
import { Button, Card, CheckboxList, Field, PageTitle, Select, StatGrid, TextArea, TextInput } from "@/components/ui";

const ALL_STAT_KEYS = [...CORE_STATS, ...RESISTANCE_STATS];

export default async function ItemsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const term = parseTerminology(world.terminology);
  const [items, effects] = await Promise.all([
    prisma.item.findMany({
      where: { worldId: world.id },
      include: { effects: true },
      orderBy: { name: "asc" },
    }),
    prisma.effectDefinition.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);
  const effectOptions = effects.map((e) => ({ id: e.id, label: e.name }));

  return (
    <div>
      <PageTitle subtitle={`${term.item}s can be equipped, consumed, or carried, and can grant stat modifiers or effects.`}>
        {term.item}s
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New {term.item.toLowerCase()}</h3>
        <ItemFields slug={slug} effectOptions={effectOptions} selected={[]} stats={{}} />
      </Card>

      <div className="flex flex-col gap-4">
        {items.map((it) => (
          <Card key={it.id}>
            <ItemFields
              slug={slug}
              id={it.id}
              name={it.name}
              description={it.description}
              type={it.type}
              element={it.element}
              stats={parseStatModifiers(it.statModifiers)}
              effectOptions={effectOptions}
              selected={it.effects.map((e) => e.effectId)}
            />
            <form action={deleteItemAction} className="mt-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={it.id} />
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

function ItemFields({
  slug,
  id,
  name,
  description,
  type,
  element,
  stats,
  effectOptions,
  selected,
}: {
  slug: string;
  id?: string;
  name?: string;
  description?: string;
  type?: string;
  element?: string;
  stats: Record<string, number>;
  effectOptions: { id: string; label: string }[];
  selected: string[];
}) {
  return (
    <form action={upsertItemAction}>
      <input type="hidden" name="slug" value={slug} />
      {id && <input type="hidden" name="id" value={id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name">
          <TextInput name="name" defaultValue={name} required />
        </Field>
        <Field label="Type">
          <Select name="type" defaultValue={type || "MISC"}>
            {ITEM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Element">
          <Select name="element" defaultValue={element || "None"}>
            {ELEMENTS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Description">
        <TextArea name="description" defaultValue={description} />
      </Field>
      <Field label="Stat modifiers (while equipped/held)">
        <StatGrid stats={ALL_STAT_KEYS} values={stats} />
      </Field>
      <Field label="Effects">
        <CheckboxList name="effectIds" options={effectOptions} selected={selected} />
      </Field>
      <Button type="submit" variant={id ? "secondary" : "primary"}>
        {id ? "Save" : "Create"}
      </Button>
    </form>
  );
}
