import { requireWorldEditAccess } from "@/lib/requireEdit";
import { parseTerminology, DEFAULT_TERMINOLOGY } from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  addCollaboratorAction,
  addTagAction,
  deleteWorldFromEditAction,
  removeCollaboratorAction,
  removeTagAction,
  transferAdminAction,
  updateWorldSettingsAction,
} from "@/app/worlds/[slug]/edit/actions";
import { Badge, Button, Card, ErrorText, Field, PageTitle, Select, TextArea, TextInput } from "@/components/ui";

export default async function WorldSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const { world, access } = await requireWorldEditAccess(slug);
  const term = parseTerminology(world.terminology);
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  const collaborators = await prisma.worldCollaborator.findMany({
    where: { worldId: world.id },
    include: { user: true },
  });

  return (
    <div>
      <PageTitle subtitle="World settings, terminology, tags, and collaborators.">Settings</PageTitle>
      <ErrorText>{error}</ErrorText>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">Basics</h3>
        <form action={updateWorldSettingsAction}>
          <input type="hidden" name="slug" value={slug} />
          <Field label="Name">
            <TextInput name="name" defaultValue={world.name} required disabled={access !== "admin"} />
          </Field>
          <Field label="Description">
            <TextArea name="description" defaultValue={world.description} disabled={access !== "admin"} />
          </Field>
          <Field label="Visibility">
            <Select name="visibility" defaultValue={world.visibility} disabled={access !== "admin"}>
              <option value="PRIVATE">Private (only you and collaborators)</option>
              <option value="PUBLIC">Public (listed in All Worlds)</option>
            </Select>
          </Field>
          <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="allowComments" defaultChecked={world.allowComments} disabled={access !== "admin"} className="accent-amber-500" />
              Allow comments
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="allowRatings" defaultChecked={world.allowRatings} disabled={access !== "admin"} className="accent-amber-500" />
              Allow ratings
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="allowDuplication" defaultChecked={world.allowDuplication} disabled={access !== "admin"} className="accent-amber-500" />
              Allow others to duplicate
            </label>
          </div>

          <h4 className="mb-2 mt-4 text-sm font-semibold text-slate-200">Terminology</h4>
          <p className="mb-3 text-xs text-slate-500">
            Rename any term used throughout this world &mdash; e.g. rename &ldquo;Dungeon&rdquo; to
            &ldquo;Trial&rdquo; or &ldquo;Year&rdquo; to &ldquo;Cycle&rdquo;.
          </p>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(Object.keys(DEFAULT_TERMINOLOGY) as (keyof typeof DEFAULT_TERMINOLOGY)[]).map((key) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">{key}</span>
                <TextInput name={`term_${key}`} defaultValue={term[key]} disabled={access !== "admin"} className="px-2 py-1 text-sm" />
              </label>
            ))}
          </div>

          {access === "admin" && <Button type="submit">Save settings</Button>}
        </form>
      </Card>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">Tags</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {world.tags.map((t) => (
            <span key={t.tagId} className="flex items-center gap-1">
              <Badge>{t.tag.name}</Badge>
              {access === "admin" && (
                <form action={removeTagAction}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="tagId" value={t.tagId} />
                  <button type="submit" className="text-xs text-slate-500 hover:text-red-400">
                    &times;
                  </button>
                </form>
              )}
            </span>
          ))}
          {world.tags.length === 0 && <p className="text-sm text-slate-500">No tags yet.</p>}
        </div>
        {access === "admin" && (
          <form action={addTagAction} className="flex gap-2">
            <input type="hidden" name="slug" value={slug} />
            <TextInput name="tagName" placeholder="e.g. fantasy" list="existing-tags" className="max-w-xs" />
            <datalist id="existing-tags">
              {tags.map((t) => (
                <option key={t.id} value={t.name} />
              ))}
            </datalist>
            <Button type="submit" variant="secondary">
              Add tag
            </Button>
          </form>
        )}
      </Card>

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-100">Collaborators</h3>
        <p className="mb-3 text-xs text-slate-500">
          Shared worlds appear in each collaborator&rsquo;s builder. The admin decides how to distribute
          earnings and can hand off the admin role.
        </p>
        <div className="mb-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span>{world.owner.username} (owner)</span>
            <Badge tone="amber">admin</Badge>
          </div>
          {collaborators.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span>{c.user.username}</span>
              <div className="flex items-center gap-2">
                {c.isAdmin && <Badge tone="amber">admin</Badge>}
                {access === "admin" && (
                  <>
                    {!c.isAdmin && (
                      <form action={transferAdminAction}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="collaboratorId" value={c.id} />
                        <button type="submit" className="text-xs text-amber-400 hover:underline">
                          Make admin
                        </button>
                      </form>
                    )}
                    <form action={removeCollaboratorAction}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="collaboratorId" value={c.id} />
                      <button type="submit" className="text-xs text-slate-500 hover:text-red-400">
                        Remove
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {access === "admin" && (
          <form action={addCollaboratorAction} className="flex gap-2">
            <input type="hidden" name="slug" value={slug} />
            <TextInput name="username" placeholder="username to invite" className="max-w-xs" />
            <Button type="submit" variant="secondary">
              Add collaborator
            </Button>
          </form>
        )}
      </Card>

      {access === "admin" && (
        <Card className="border-red-900/50">
          <h3 className="mb-3 font-semibold text-red-400">Danger zone</h3>
          <form action={deleteWorldFromEditAction}>
            <input type="hidden" name="slug" value={slug} />
            <Button type="submit" variant="danger">
              Delete this world permanently
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
