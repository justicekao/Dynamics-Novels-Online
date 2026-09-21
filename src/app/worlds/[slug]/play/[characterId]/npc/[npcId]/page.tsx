import { notFound } from "next/navigation";
import { requireOwnCharacter } from "@/lib/loadCharacter";
import { prisma } from "@/lib/db";
import { chooseInteractionAction } from "./actions";
import { Button, Card, LinkButton, PageTitle } from "@/components/ui";

export default async function NpcInteractionPage({
  params,
}: {
  params: Promise<{ slug: string; characterId: string; npcId: string }>;
}) {
  const { slug, characterId, npcId } = await params;
  await requireOwnCharacter(slug, characterId);

  const npc = await prisma.npc.findUnique({ where: { id: npcId } });
  if (!npc) notFound();
  const interaction = await prisma.interaction.findFirst({
    where: { npcId },
    include: { choices: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageTitle subtitle={npc.description}>{npc.name}</PageTitle>
      <Card>
        {interaction ? (
          <>
            <p className="mb-4 text-sm text-slate-300">{interaction.description || interaction.name}</p>
            <div className="flex flex-col gap-2">
              {interaction.choices.map((c) => (
                <form key={c.id} action={chooseInteractionAction}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="characterId" value={characterId} />
                  <input type="hidden" name="choiceId" value={c.id} />
                  <Button type="submit" variant="secondary" className="w-full text-left">
                    {c.text}
                  </Button>
                </form>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-300">You exchange a few words with {npc.name}.</p>
        )}
      </Card>
      <div className="mt-4">
        <LinkButton href={`/worlds/${slug}/play/${characterId}`} variant="ghost">
          &larr; Back
        </LinkButton>
      </div>
    </div>
  );
}
