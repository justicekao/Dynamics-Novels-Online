import { requireWorldEditAccess } from "@/lib/requireEdit";
import { prisma } from "@/lib/db";
import { parseJsonObject } from "@/lib/json";
import { deleteEffectAction, upsertEffectAction } from "@/app/worlds/[slug]/edit/effects/actions";
import { EffectForm } from "@/components/EffectForm";
import { Badge, Button, Card, PageTitle } from "@/components/ui";

export default async function EffectsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const [effects, traits] = await Promise.all([
    prisma.effectDefinition.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
    prisma.trait.findMany({ where: { worldId: world.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageTitle subtitle="Effects are the building blocks you attach to skills and items: stat changes, status conditions, elemental damage, healing, or granting a trait.">
        Effects
      </PageTitle>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">New effect</h3>
        <EffectForm action={upsertEffectAction} slug={slug} payload={{}} traits={traits} submitLabel="Create effect" />
      </Card>

      <div className="flex flex-col gap-4">
        {effects.map((e) => (
          <Card key={e.id}>
            <div className="mb-2">
              <Badge>{e.kind.replace("_", " ")}</Badge>
            </div>
            <EffectForm
              action={upsertEffectAction}
              slug={slug}
              id={e.id}
              name={e.name}
              description={e.description}
              kind={e.kind}
              payload={parseJsonObject(e.payload)}
              traits={traits}
              submitLabel="Save"
            />
            <form action={deleteEffectAction} className="mt-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={e.id} />
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
