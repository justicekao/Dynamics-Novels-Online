import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePlayableWorld } from "@/lib/loadCharacter";
import { parseTerminology } from "@/lib/constants";
import { createCharacterAction, deleteCharacterAction } from "@/app/worlds/[slug]/play/actions";
import { Button, Card, EmptyState, ErrorText, Field, PageTitle, Select, TextInput } from "@/components/ui";

export default async function PlaySelectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const { world, user } = await requirePlayableWorld(slug);
  const term = parseTerminology(world.terminology);

  const [characters, races, classes] = await Promise.all([
    prisma.character.findMany({ where: { worldId: world.id, userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.race.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.class.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageTitle subtitle={`Playing in "${world.name}"`}>Choose your character</PageTitle>
      <ErrorText>{error}</ErrorText>

      {characters.length === 0 ? (
        <EmptyState>You have no characters in this world yet. Create one below.</EmptyState>
      ) : (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {characters.map((c) => (
            <Card key={c.id}>
              <Link href={`/worlds/${slug}/play/${c.id}`}>
                <p className="font-semibold text-slate-50 hover:text-amber-400">{c.name}</p>
              </Link>
              <p className="text-xs text-slate-500">
                Level {c.level} &middot; {c.timeElapsed} {term.timeUnitPlural.toLowerCase()} elapsed
              </p>
              <form action={deleteCharacterAction} className="mt-2">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={c.id} />
                <Button type="submit" variant="danger" className="text-xs">
                  Delete
                </Button>
              </form>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <h3 className="mb-3 font-semibold text-slate-100">New character</h3>
        <form action={createCharacterAction}>
          <input type="hidden" name="slug" value={slug} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Name">
              <TextInput name="name" required />
            </Field>
            <Field label="Gender">
              <TextInput name="gender" placeholder="optional" />
            </Field>
            <Field label={term.race}>
              <Select name="raceId">
                <option value="">-- none --</option>
                {races.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={term.class}>
            <Select name="classId">
              <option value="">-- none --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit">Begin</Button>
        </form>
      </Card>
    </div>
  );
}
