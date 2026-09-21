import { notFound } from "next/navigation";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/json";
import { deleteFloorAction, duplicateFloorAction, upsertFloorAction } from "./actions";
import { Button, Card, CheckboxList, Field, LinkButton, PageTitle, TextArea, TextInput } from "@/components/ui";

export default async function DungeonFloorsPage({
  params,
}: {
  params: Promise<{ slug: string; dungeonId: string }>;
}) {
  const { slug, dungeonId } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const dungeon = await prisma.dungeon.findUnique({ where: { id: dungeonId } });
  if (!dungeon || dungeon.worldId !== world.id) notFound();

  const [floors, creatures] = await Promise.all([
    prisma.dungeonFloor.findMany({ where: { dungeonId }, orderBy: { order: "asc" } }),
    prisma.creature.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);
  const creatureOptions = creatures.map((c) => ({ id: c.id, label: c.name }));

  return (
    <div>
      <PageTitle subtitle={`Floors of "${dungeon.name}", in ascending order.`}>Dungeon floors</PageTitle>
      <div className="mb-4">
        <LinkButton href={`/worlds/${slug}/edit/dungeons`} variant="ghost">
          &larr; Back to dungeons
        </LinkButton>
      </div>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New floor</h3>
        <form action={upsertFloorAction}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="dungeonId" value={dungeonId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <TextInput name="name" required />
            </Field>
            <Field label="Order">
              <TextInput type="number" name="order" defaultValue={floors.length + 1} />
            </Field>
          </div>
          <Field label="Description">
            <TextArea name="description" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Background seed">
              <TextInput name="backgroundSeed" />
            </Field>
            <Field label="Music seed">
              <TextInput name="musicSeed" />
            </Field>
          </div>
          <Field label="Creatures on this floor">
            <CheckboxList name="creatureIds" options={creatureOptions} selected={[]} />
          </Field>
          <Button type="submit">Create floor</Button>
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        {floors.map((f) => (
          <Card key={f.id}>
            <form action={upsertFloorAction}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="dungeonId" value={dungeonId} />
              <input type="hidden" name="id" value={f.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <TextInput name="name" defaultValue={f.name} required />
                </Field>
                <Field label="Order">
                  <TextInput type="number" name="order" defaultValue={f.order} />
                </Field>
              </div>
              <Field label="Description">
                <TextArea name="description" defaultValue={f.description} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Background seed">
                  <TextInput name="backgroundSeed" defaultValue={f.backgroundSeed} />
                </Field>
                <Field label="Music seed">
                  <TextInput name="musicSeed" defaultValue={f.musicSeed} />
                </Field>
              </div>
              <Field label="Creatures on this floor">
                <CheckboxList name="creatureIds" options={creatureOptions} selected={parseJsonArray(f.creatureIds)} />
              </Field>
              <Button type="submit" variant="secondary">
                Save
              </Button>
            </form>
            <div className="mt-2 flex gap-2">
              <form action={duplicateFloorAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="dungeonId" value={dungeonId} />
                <input type="hidden" name="id" value={f.id} />
                <Button type="submit" variant="ghost">
                  Duplicate
                </Button>
              </form>
              <form action={deleteFloorAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="dungeonId" value={dungeonId} />
                <input type="hidden" name="id" value={f.id} />
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
