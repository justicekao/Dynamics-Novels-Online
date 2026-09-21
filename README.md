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
- Prisma 7 + SQLite (via `@prisma/adapter-better-sqlite3`)
- Cookie-based sessions (bcrypt-hashed passwords, no third-party auth)

## Getting started

```bash
npm install
cp .env.example .env
npm run db:migrate   # applies migrations, creates dev.db
npm run db:seed      # seeds the 4 starter worlds (idempotent)
npm run dev
```

Open http://localhost:3000. Sign up for an account, then browse the starter
worlds under **Worlds**, or create your own from **New World**.

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
