import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { ALL_STATS, EVENT_CHOICE_SLOTS, SUCCESS_STAT_SLOTS } from "@/lib/constants";
import { parseJsonAny, parseJsonArray } from "@/lib/json";
import { deleteEventAction, duplicateEventAction, upsertEventAction } from "@/app/worlds/[slug]/edit/events/actions";
import { ConditionEditor, type Condition } from "@/components/ConditionEditor";
import { EventTargetPicker } from "@/components/EventTargetPicker";
import { Badge, Button, Card, CheckboxList, Field, PageTitle, Select, TextArea, TextInput } from "@/components/ui";

export default async function EventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const [events, locations, floors, effects, items, traits, companions] = await Promise.all([
    prisma.event.findMany({ where: { worldId: world.id }, include: { choices: true }, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.dungeonFloor.findMany({ where: { dungeon: { worldId: world.id } }, include: { dungeon: true }, orderBy: { order: "asc" } }),
    prisma.effectDefinition.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.trait.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.companion.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);

  const floorOptions = floors.map((f) => ({ id: f.id, name: f.name, dungeonName: f.dungeon.name }));
  const effectOptions = effects.map((e) => ({ id: e.id, label: e.name }));
  const eventOptions = events.map((e) => ({ id: e.id, label: e.name }));
  const condOpts = {
    items: items.map((i) => ({ id: i.id, name: i.name })),
    traits: traits.map((t) => ({ id: t.id, name: t.name })),
    events: events.map((e) => ({ id: e.id, name: e.name })),
    companions: companions.map((c) => ({ id: c.id, name: c.name })),
  };

  return (
    <div>
      <PageTitle subtitle="Events fire at locations, on dungeon floors, or globally. Each choice can require success on one or more stats, with different results and effects.">
        Events
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New event</h3>
        <EventFields
          slug={slug}
          locations={locations}
          floors={floorOptions}
          effectOptions={effectOptions}
          eventOptions={eventOptions}
          condOpts={condOpts}
        />
      </Card>

      <div className="flex flex-col gap-4">
        {events.map((ev) => (
          <Card key={ev.id}>
            <div className="mb-2 flex items-center gap-2">
              <Badge>{ev.category.replace("_", " ")}</Badge>
              <Badge>{Math.round(ev.probability * 100)}% chance</Badge>
            </div>
            <EventFields
              slug={slug}
              event={ev}
              locations={locations}
              floors={floorOptions}
              effectOptions={effectOptions}
              eventOptions={eventOptions.filter((o) => o.id !== ev.id)}
              condOpts={condOpts}
            />
            <div className="mt-2 flex gap-2">
              <form action={duplicateEventAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={ev.id} />
                <Button type="submit" variant="ghost">
                  Duplicate
                </Button>
              </form>
              <form action={deleteEventAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={ev.id} />
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

type EventRow = Awaited<ReturnType<typeof prisma.event.findFirst>>;
type ChoiceRow = Awaited<ReturnType<typeof prisma.eventChoice.findFirst>>;

function EventFields({
  slug,
  event,
  locations,
  floors,
  effectOptions,
  eventOptions,
  condOpts,
}: {
  slug: string;
  event?: NonNullable<EventRow> & { choices?: NonNullable<ChoiceRow>[] };
  locations: { id: string; name: string }[];
  floors: { id: string; name: string; dungeonName: string }[];
  effectOptions: { id: string; label: string }[];
  eventOptions: { id: string; label: string }[];
  condOpts: { items: { id: string; name: string }[]; traits: { id: string; name: string }[]; events: { id: string; name: string }[]; companions: { id: string; name: string }[] };
}) {
  const choices = event?.choices ?? [];
  return (
    <form action={upsertEventAction}>
      <input type="hidden" name="slug" value={slug} />
      {event && <input type="hidden" name="id" value={event.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <TextInput name="name" defaultValue={event?.name} required />
        </Field>
        <Field label="Probability (0-1)" hint="Chance this event is picked when eligible.">
          <TextInput type="number" step="0.05" min="0" max="1" name="probability" defaultValue={event?.probability ?? 1} />
        </Field>
      </div>
      <Field label="Description">
        <TextArea name="description" defaultValue={event?.description} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Image seed">
          <TextInput name="imageSeed" defaultValue={event?.imageSeed} />
        </Field>
        <Field label="Music seed">
          <TextInput name="musicSeed" defaultValue={event?.musicSeed} />
        </Field>
      </div>
      <EventTargetPicker
        locations={locations}
        floors={floors}
        initialCategory={event?.category}
        initialLocationId={event?.locationId}
        initialFloorId={event?.dungeonFloorId}
      />
      <Field label="Requires these events completed first">
        <CheckboxList
          name="prerequisiteEventIds"
          options={eventOptions}
          selected={event ? parseJsonArray(event.prerequisiteEventIds) : []}
        />
      </Field>
      <Field label="Other unlock conditions">
        <ConditionEditor
          name="unlock"
          initial={event ? parseJsonAny<Condition[]>(event.unlockConditions, []) : []}
          {...condOpts}
        />
      </Field>

      <h4 className="mb-2 mt-4 text-sm font-semibold text-slate-200">Choices</h4>
      <div className="flex flex-col gap-3">
        {Array.from({ length: EVENT_CHOICE_SLOTS }).map((_, i) => {
          const choice = choices[i];
          const stats = choice ? parseJsonAny<{ stat: string; difficulty: number }[]>(choice.successStats, []) : [];
          return (
            <div key={i} className="rounded-lg border border-slate-800 p-3">
              <Field label={`Choice ${i + 1} text (blank = unused)`}>
                <TextInput name={`choice_${i}_text`} defaultValue={choice?.text} />
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Result text (success)">
                  <TextArea name={`choice_${i}_resultTextSuccess`} defaultValue={choice?.resultTextSuccess} rows={2} />
                </Field>
                <Field label="Result text (failure)">
                  <TextArea name={`choice_${i}_resultTextFailure`} defaultValue={choice?.resultTextFailure} rows={2} />
                </Field>
              </div>

              <p className="mb-1 text-xs text-slate-500">Success stats (all must succeed)</p>
              <div className="mb-2 grid gap-2 sm:grid-cols-3">
                {Array.from({ length: SUCCESS_STAT_SLOTS }).map((__, j) => {
                  const s = stats[j];
                  return (
                    <div key={j} className="flex gap-1">
                      <Select name={`choice_${i}_stat_${j}_stat`} defaultValue={s?.stat} className="text-xs">
                        <option value="">-- unused --</option>
                        {ALL_STATS.map((stat) => (
                          <option key={stat} value={stat}>
                            {stat}
                          </option>
                        ))}
                      </Select>
                      <TextInput
                        type="number"
                        name={`choice_${i}_stat_${j}_difficulty`}
                        defaultValue={s?.difficulty ?? 10}
                        placeholder="Difficulty"
                        className="w-20 px-2 py-1 text-xs"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Effects on success">
                  <CheckboxList
                    name={`choice_${i}_successEffectIds`}
                    options={effectOptions}
                    selected={choice ? parseJsonArray(choice.successEffectIds) : []}
                  />
                </Field>
                <Field label="Effects on failure">
                  <CheckboxList
                    name={`choice_${i}_failureEffectIds`}
                    options={effectOptions}
                    selected={choice ? parseJsonArray(choice.failureEffectIds) : []}
                  />
                </Field>
              </div>
              <Field label="Leads to event (optional chain)">
                <Select name={`choice_${i}_nextEventId`} defaultValue={choice?.nextEventId || ""}>
                  <option value="">-- none --</option>
                  {eventOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          );
        })}
      </div>

      <Button type="submit" variant={event ? "secondary" : "primary"} className="mt-4">
        {event ? "Save" : "Create"}
      </Button>
    </form>
  );
}
