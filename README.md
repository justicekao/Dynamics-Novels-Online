# Dynamics Novels Online

A platform for building and playing text-RPG worlds. Creators design races,
classes, skills, locations, dungeons, NPCs, companions, and branching events
entirely through point-and-click forms (no typing IDs, no editing files), and
players explore those worlds with stat-driven choices, time progression, and
simple combat. Worlds can be published, searched, tagged, rated, commented on,
favorited, and duplicated by other players.

The same engine works for any genre: a fantasy adventure, a cell-biology
simulation, a far-future space opera, or a reality-show island are all just
different worlds built with the same tools. Four starter worlds are included.

## Stack

- Next.js 16 (App Router, Server Actions, TypeScript)
- Tailwind CSS v4
- Prisma 7 + PostgreSQL (via `@prisma/adapter-pg`) — works with any Postgres,
  including the free tier of [Prisma Postgres](https://console.prisma.io)
- Cookie-based sessions (bcrypt-hashed passwords, no third-party auth)

## Getting started (local)

```bash
npm install
cp .env.example .env   # then set DATABASE_URL to your Postgres connection string
npm run db:migrate     # applies migrations
npm run db:seed        # seeds the 4 starter worlds (idempotent)
npm run dev
```

Open http://localhost:3000. Sign up for an account, then browse the starter
worlds under **Worlds**, or create your own from **New World**.

## Deploying (Vercel + Prisma Postgres, free tier)

1. Create a free database at [console.prisma.io](https://console.prisma.io)
   (sign in with GitHub → new project → Postgres). Copy the **direct**
   connection string.
2. On [vercel.com/new](https://vercel.com/new), import this repo, pick the
   branch you want live, and add one environment variable:
   `DATABASE_URL` = the connection string from step 1.
3. Deploy. The `vercel-build` script (see `package.json`) runs
   `prisma migrate deploy` and the idempotent seed script automatically on
   every build, so there is nothing to run by hand — the first deploy creates
   the schema and the 4 starter worlds, and later deploys are no-ops for both.

`prisma/migrations/` was generated offline (`prisma migrate diff --from-empty
--to-schema`) against the Postgres provider, so the very first `migrate
deploy` creates every table from scratch.

## Project layout

- `prisma/schema.prisma` — data model. Many-to-many "pick from a list"
  relationships (skills on a class, effects on an item, etc.) are stored as
  JSON arrays of ids rather than join tables, since the UI only ever lets you
  select from existing entities — never type an id.
- `src/lib/gameEngine.ts` — stat sheets, condition checks, success-chance
  rolls, leveling, and combat resolution.
- `src/app/worlds/[slug]/edit/**` — the world builder (one route per entity
  type: races, classes, skills, items, effects, locations, NPCs, companions,
  interactions, creatures, dungeons/floors, events).
- `src/app/worlds/[slug]/play/**` — the play loop: character creation, the
  location "home" screen (NPCs, travel, dungeons, advancing time), NPC
  interactions, event resolution, dungeon floor combat, and the character
  sheet.
- `prisma/seed.ts` — builds the 4 starter worlds directly via Prisma.

## What's included vs. roadmap

This ships a complete single-player platform: accounts, the full
dropdown-driven world builder, the play loop (time progression, randomized
NPC encounters, stat-checked event choices, dungeon combat, leveling,
companions), and the community layer (browse/search/tags/ratings/comments/
favorites/duplicate/collaborators).

Deliberately out of scope for this version (each needs a real external
service, licensing, or a much bigger UI investment):

- Multiplayer (parties, arenas, shared-location encounters, chat)
- Real-money transactions / monetization
- AI-assisted world creation
- A licensed, searchable music/art library and animated combat sprites

The data model and world-builder patterns are built so these can be added
incrementally without a rewrite.
