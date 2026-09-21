import { LinkButton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-20 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">
        A platform for text-RPG worlds
      </p>
      <h1 className="text-4xl font-bold text-slate-50 sm:text-5xl">
        Build a world. Anyone can live in it.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
        Create races, classes, skills, locations, dungeons, NPCs, and branching events with
        point-and-click tools&nbsp;&mdash; no code, no typing IDs. Then let time pass, meet
        characters, fight, and explore. Publish your world for others to play, rate, comment on,
        or fork.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <LinkButton href="/worlds">Browse worlds</LinkButton>
        {user ? (
          <LinkButton href="/worlds/new" variant="secondary">
            Create a world
          </LinkButton>
        ) : (
          <LinkButton href="/signup" variant="secondary">
            Sign up free
          </LinkButton>
        )}
      </div>

      <div className="mt-20 grid gap-4 text-left sm:grid-cols-3">
        {[
          {
            title: "Design without typing IDs",
            body: "Every relationship between races, skills, events, and items is picked from a list — the world stays consistent no matter how tangled the story gets.",
          },
          {
            title: "Time moves, choices matter",
            body: "Locations unlock, NPCs remember you, and stat-driven choices resolve with success chances the creator controls.",
          },
          {
            title: "One engine, any genre",
            body: "The same tools power a medieval fantasy, a cell biology simulation, a far-future space opera, or an island dating show.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="mb-2 font-semibold text-slate-100">{f.title}</h3>
            <p className="text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
