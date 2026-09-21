import Link from "next/link";
import { requireWorldEditAccess } from "@/lib/requireEdit";
import { parseTerminology } from "@/lib/constants";
import { LinkButton } from "@/components/ui";

const NAV: { href: string; label: (t: ReturnType<typeof parseTerminology>) => string }[] = [
  { href: "", label: () => "Settings" },
  { href: "races", label: (t) => t.race + "s" },
  { href: "classes", label: (t) => t.class + "es" },
  { href: "traits", label: () => "Traits" },
  { href: "skills", label: (t) => t.skill + "s" },
  { href: "items", label: (t) => t.item + "s" },
  { href: "effects", label: () => "Effects" },
  { href: "locations", label: (t) => t.location + "s" },
  { href: "npcs", label: (t) => t.npc + "s" },
  { href: "companions", label: (t) => t.companion + "s" },
  { href: "interactions", label: () => "Interactions" },
  { href: "creatures", label: (t) => t.creature + "s" },
  { href: "dungeons", label: (t) => t.dungeon + "s" },
  { href: "events", label: () => "Events" },
];

export default async function EditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { world } = await requireWorldEditAccess(slug);
  const term = parseTerminology(world.terminology);

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
      <aside className="w-48 shrink-0">
        <p className="mb-3 truncate text-sm font-semibold text-slate-200" title={world.name}>
          {world.name}
        </p>
        <nav className="flex flex-col gap-0.5 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={`/worlds/${slug}/edit/${item.href}`}
              className="rounded px-2 py-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            >
              {item.label(term)}
            </Link>
          ))}
        </nav>
        <div className="mt-4 flex flex-col gap-2">
          <LinkButton href={`/worlds/${slug}`} variant="ghost" className="text-center">
            &larr; Back to world
          </LinkButton>
          <LinkButton href={`/worlds/${slug}/play`} variant="secondary" className="text-center">
            Play
          </LinkButton>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
