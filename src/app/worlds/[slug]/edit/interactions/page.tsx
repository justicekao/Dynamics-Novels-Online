import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { INTERACTION_CHOICE_SLOTS, INTERACTION_OUTCOME_SLOTS, parseTerminology } from "@/lib/constants";
import { parseJsonAny } from "@/lib/json";
import { deleteInteractionAction, upsertInteractionAction } from "@/app/worlds/[slug]/edit/interactions/actions";
import { InteractionTargetPicker } from "@/components/InteractionTargetPicker";
import { Button, Card, Field, PageTitle, Select, TextArea, TextInput } from "@/components/ui";

export default async function InteractionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const term = parseTerminology(world.terminology);
  const [interactions, npcs, companions, effects] = await Promise.all([
    prisma.interaction.findMany({
      where: { worldId: world.id },
      include: { choices: true, npc: true, companion: true },
      orderBy: { name: "asc" },
    }),
    prisma.npc.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.companion.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.effectDefinition.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageTitle
        subtitle={`Interactions define what happens when the player talks to an ${term.npc.toLowerCase()} or ${term.companion.toLowerCase()} — pick a choice, get a randomized outcome.`}
      >
        Interactions
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New interaction</h3>
        <InteractionFields slug={slug} npcs={npcs} companions={companions} effects={effects} />
      </Card>

      <div className="flex flex-col gap-4">
        {interactions.map((it) => (
          <Card key={it.id}>
            <p className="mb-2 text-xs text-slate-500">
              Target: {it.npc?.name || it.companion?.name || "(none selected)"}
            </p>
            <InteractionFields
              slug={slug}
              interaction={it}
              npcs={npcs}
              companions={companions}
              effects={effects}
            />
            <form action={deleteInteractionAction} className="mt-2">
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

type InteractionRow = Awaited<ReturnType<typeof prisma.interaction.findFirst>>;
type ChoiceRow = Awaited<ReturnType<typeof prisma.interactionChoice.findFirst>>;

function InteractionFields({
  slug,
  interaction,
  npcs,
  companions,
  effects,
}: {
  slug: string;
  interaction?: NonNullable<InteractionRow> & { choices?: NonNullable<ChoiceRow>[] };
  npcs: { id: string; name: string }[];
  companions: { id: string; name: string }[];
  effects: { id: string; name: string }[];
}) {
  const choices = interaction?.choices ?? [];
  return (
    <form action={upsertInteractionAction}>
      <input type="hidden" name="slug" value={slug} />
      {interaction && <input type="hidden" name="id" value={interaction.id} />}
      <Field label="Name">
        <TextInput name="name" defaultValue={interaction?.name} required />
      </Field>
      <Field label="Description">
        <TextArea name="description" defaultValue={interaction?.description} />
      </Field>
      <InteractionTargetPicker
        npcs={npcs}
        companions={companions}
        initialKind={interaction?.companionId ? "companion" : "npc"}
        initialTargetId={interaction?.npcId || interaction?.companionId || undefined}
      />

      <h4 className="mb-2 mt-4 text-sm font-semibold text-slate-200">Choices</h4>
      <div className="flex flex-col gap-3">
        {Array.from({ length: INTERACTION_CHOICE_SLOTS }).map((_, i) => {
          const choice = choices[i];
          const outcomes = choice ? parseJsonAny<{ effectId: string; weight: number }[]>(choice.outcomes, []) : [];
          return (
            <div key={i} className="rounded-lg border border-slate-800 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label={`Choice ${i + 1} text (blank = unused)`}>
                  <TextInput name={`choice_${i}_text`} defaultValue={choice?.text} />
                </Field>
                <Field label="Result text shown to player">
                  <TextInput name={`choice_${i}_resultText`} defaultValue={choice?.resultText} />
                </Field>
              </div>
              <p className="mb-1 text-xs text-slate-500">
                Randomized outcomes (each has a relative weight; effect applies to the relationship/player)
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {Array.from({ length: INTERACTION_OUTCOME_SLOTS }).map((__, j) => {
                  const outcome = outcomes[j];
                  return (
                    <div key={j} className="flex gap-1">
                      <Select name={`choice_${i}_outcome_${j}_effectId`} defaultValue={outcome?.effectId} className="text-xs">
                        <option value="">-- none --</option>
                        {effects.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </Select>
                      <TextInput
                        type="number"
                        name={`choice_${i}_outcome_${j}_weight`}
                        defaultValue={outcome?.weight ?? 1}
                        className="w-16 px-2 py-1 text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Button type="submit" variant={interaction ? "secondary" : "primary"} className="mt-4">
        {interaction ? "Save" : "Create"}
      </Button>
    </form>
  );
}
