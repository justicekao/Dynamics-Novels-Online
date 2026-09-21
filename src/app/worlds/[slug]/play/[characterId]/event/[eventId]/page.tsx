import { notFound } from "next/navigation";
import { requireOwnCharacter } from "@/lib/loadCharacter";
import { prisma } from "@/lib/db";
import { parseJsonAny } from "@/lib/json";
import { chooseEventAction } from "./actions";
import { Badge, Button, Card, PageTitle } from "@/components/ui";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string; characterId: string; eventId: string }>;
}) {
  const { slug, characterId, eventId } = await params;
  await requireOwnCharacter(slug, characterId);

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { choices: true } });
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageTitle>{event.name}</PageTitle>
      <Card>
        <p className="mb-4 whitespace-pre-wrap text-sm text-slate-300">{event.description}</p>
        <div className="flex flex-col gap-2">
          {event.choices.map((c) => {
            const stats = parseJsonAny<{ stat: string; difficulty: number }[]>(c.successStats, []);
            return (
              <form key={c.id} action={chooseEventAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="characterId" value={characterId} />
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="choiceId" value={c.id} />
                <Button type="submit" variant="secondary" className="w-full text-left">
                  <span className="mr-2">{c.text}</span>
                  {stats.map((s) => (
                    <Badge key={s.stat}>
                      {s.stat} vs {s.difficulty}
                    </Badge>
                  ))}
                </Button>
              </form>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
