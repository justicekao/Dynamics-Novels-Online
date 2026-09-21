import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { DEFAULT_TERMINOLOGY } from "../src/lib/constants";

type Terminology = Record<keyof typeof DEFAULT_TERMINOLOGY, string>;

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "world"
  );
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await prisma.world.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

async function ensureSystemUser() {
  const username = "worldsmith";
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      email: "worldsmith@dynamicsnovels.example",
      username,
      passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
      avatarSeed: crypto.randomUUID().slice(0, 12),
      bio: "Curator of the starter example worlds.",
    },
  });
}

async function ensureTag(name: string) {
  return prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
}

interface WorldSpec {
  name: string;
  description: string;
  tags: string[];
  terminology: Partial<Terminology>;
}

async function createWorldShell(ownerId: string, spec: WorldSpec) {
  const slug = await uniqueSlug(`worldsmith-${spec.name}`);
  const world = await prisma.world.create({
    data: {
      ownerId,
      name: spec.name,
      description: spec.description,
      slug,
      visibility: "PUBLIC",
      isDefault: true,
      allowDuplication: true,
      terminology: JSON.stringify({ ...DEFAULT_TERMINOLOGY, ...spec.terminology }),
    },
  });
  for (const tagName of spec.tags) {
    const tag = await ensureTag(tagName);
    await prisma.worldTag.create({ data: { worldId: world.id, tagId: tag.id } });
  }
  return world;
}

async function seedFantasy(ownerId: string) {
  const world = await createWorldShell(ownerId, {
    name: "The Shattered Reaches",
    description:
      "A starter fantasy world: three peoples, two callings, a haunted mine, and a village with a favor to ask. Fork it and build your own saga on top.",
    tags: ["fantasy", "starter", "adventure"],
    terminology: {},
  });

  const braveTrait = await prisma.trait.create({
    data: { worldId: world.id, name: "Brave", description: "Unshaken by danger.", statModifiers: "{}" },
  });
  const cursedTrait = await prisma.trait.create({
    data: { worldId: world.id, name: "Cursed", description: "Marked by dark magic.", statModifiers: "{}" },
  });

  const healEffect = await prisma.effectDefinition.create({
    data: {
      worldId: world.id,
      name: "Minor Heal",
      description: "Restores a little health.",
      kind: "HEAL",
      payload: JSON.stringify({ amount: 20 }),
    },
  });
  const fireDamageEffect = await prisma.effectDefinition.create({
    data: {
      worldId: world.id,
      name: "Firebolt Damage",
      description: "Scorches the target.",
      kind: "DAMAGE",
      payload: JSON.stringify({ element: "Fire", amount: 12 }),
    },
  });
  const braveGrant = await prisma.effectDefinition.create({
    data: {
      worldId: world.id,
      name: "Steel Your Nerve",
      description: "A chance to become Brave.",
      kind: "GRANT_TRAIT",
      payload: JSON.stringify({ traitId: braveTrait.id, chance: 60 }),
    },
  });

  const slash = await prisma.skill.create({
    data: {
      worldId: world.id,
      name: "Slash",
      description: "A basic sword strike.",
      type: "ACTIVE",
      element: "None",
      targetType: "SINGLE_ENEMY",
      basePower: 10,
      baseSuccessChance: 100,
    },
  });
  const firebolt = await prisma.skill.create({
    data: {
      worldId: world.id,
      name: "Firebolt",
      description: "Hurl a bolt of flame.",
      type: "ACTIVE",
      element: "Fire",
      targetType: "SINGLE_ENEMY",
      basePower: 14,
      baseSuccessChance: 90,
    },
  });
  await prisma.skillEffect.create({ data: { skillId: firebolt.id, effectId: fireDamageEffect.id } });

  const human = await prisma.race.create({
    data: { worldId: world.id, name: "Human", description: "Versatile and ambitious.", statModifiers: "{}" },
  });
  const elf = await prisma.race.create({
    data: {
      worldId: world.id,
      name: "Elf",
      description: "Graceful and keen-minded.",
      statModifiers: JSON.stringify({ DEX: 2, INT: 2, CON: -1 }),
    },
  });
  const dwarf = await prisma.race.create({
    data: {
      worldId: world.id,
      name: "Dwarf",
      description: "Stout and unyielding.",
      statModifiers: JSON.stringify({ CON: 3, STR: 1, DEX: -1 }),
    },
  });
  void human;
  void elf;
  void dwarf;

  const warrior = await prisma.class.create({
    data: {
      worldId: world.id,
      name: "Warrior",
      description: "Front-line fighter.",
      statModifiers: JSON.stringify({ STR: 3, CON: 2 }),
      startingSkillIds: JSON.stringify([slash.id]),
    },
  });
  const mage = await prisma.class.create({
    data: {
      worldId: world.id,
      name: "Mage",
      description: "Wields elemental magic.",
      statModifiers: JSON.stringify({ INT: 3, MaxMP: 10 }),
      startingSkillIds: JSON.stringify([firebolt.id]),
    },
  });
  void warrior;
  void mage;

  const sword = await prisma.item.create({
    data: {
      worldId: world.id,
      name: "Rusty Sword",
      description: "Better than fists.",
      type: "WEAPON",
      element: "None",
      statModifiers: JSON.stringify({ STR: 1 }),
    },
  });
  const potion = await prisma.item.create({
    data: { worldId: world.id, name: "Health Potion", description: "Restores health.", type: "CONSUMABLE" },
  });
  await prisma.itemEffect.create({ data: { itemId: potion.id, effectId: healEffect.id } });
  void sword;

  const townElder = await prisma.npc.create({
    data: {
      worldId: world.id,
      name: "Town Elder",
      description: "The weathered leader of Millhaven.",
      traitIds: JSON.stringify([cursedTrait.id]),
    },
  });
  const merchant = await prisma.npc.create({
    data: { worldId: world.id, name: "Wandering Merchant", description: "Sells odds and ends." },
  });

  const hound = await prisma.companion.create({
    data: {
      worldId: world.id,
      name: "Loyal Hound",
      description: "A faithful companion who fights at your side.",
      allowedClassIds: JSON.stringify([warrior.id]),
      initialSkillIds: JSON.stringify([slash.id]),
    },
  });
  void hound;

  const rat = await prisma.creature.create({
    data: {
      worldId: world.id,
      name: "Giant Rat",
      description: "A mine-dwelling pest, bigger than it should be.",
      stats: JSON.stringify({ STR: 6, CON: 8, MaxHP: 25 }),
      xpReward: 12,
    },
  });
  const bandit = await prisma.creature.create({
    data: {
      worldId: world.id,
      name: "Bandit",
      description: "Armed and desperate.",
      stats: JSON.stringify({ STR: 11, CON: 10, MaxHP: 40 }),
      xpReward: 25,
      lootItemIds: JSON.stringify([sword.id]),
    },
  });

  const millhaven = await prisma.location.create({
    data: {
      worldId: world.id,
      name: "Millhaven",
      description: "A quiet village at the edge of the wilds.",
      isStart: true,
      npcPoolIds: JSON.stringify([townElder.id, merchant.id]),
      companionPoolIds: JSON.stringify([hound.id]),
    },
  });
  const mineEntrance = await prisma.location.create({
    data: { worldId: world.id, name: "Old Mine Entrance", description: "A collapsed mine shaft, said to be haunted." },
  });
  const darkForest = await prisma.location.create({
    data: { worldId: world.id, name: "Dark Forest", description: "Twisted trees block out the sun." },
  });
  await prisma.locationConnection.create({ data: { worldId: world.id, fromId: millhaven.id, toId: mineEntrance.id } });
  await prisma.locationConnection.create({ data: { worldId: world.id, fromId: millhaven.id, toId: darkForest.id } });

  const mine = await prisma.dungeon.create({
    data: { worldId: world.id, locationId: mineEntrance.id, name: "The Old Mine", description: "Its depths are unknown." },
  });
  await prisma.dungeonFloor.create({
    data: { dungeonId: mine.id, order: 1, name: "Upper Tunnels", creatureIds: JSON.stringify([rat.id]) },
  });
  await prisma.dungeonFloor.create({
    data: { dungeonId: mine.id, order: 2, name: "Collapsed Vault", creatureIds: JSON.stringify([bandit.id]) },
  });

  const helpEvent = await prisma.event.create({
    data: {
      worldId: world.id,
      name: "A Stranger Asks for Help",
      description: "A shaken traveler stumbles into the village, begging for aid against bandits on the road.",
      category: "LOCATION",
      locationId: millhaven.id,
      probability: 0.5,
    },
  });
  await prisma.eventChoice.create({
    data: {
      eventId: helpEvent.id,
      text: "Agree to help",
      successStats: JSON.stringify([{ stat: "CHA", difficulty: 10 }]),
      resultTextSuccess: "You reassure the traveler and rally a few villagers to help.",
      resultTextFailure: "Your words fall flat, but you go anyway.",
      successEffectIds: JSON.stringify([braveGrant.id]),
    },
  });
  await prisma.eventChoice.create({
    data: { eventId: helpEvent.id, text: "Turn them away", resultTextSuccess: "You turn back to your business." },
  });

  return world;
}

async function seedCell(ownerId: string) {
  const world = await createWorldShell(ownerId, {
    name: "Cytoplasm Chronicles",
    description:
      "Play as a molecule drifting through a living cell. Races are molecule types, skills are reactions, and time passes in milliseconds.",
    tags: ["sci-fi", "starter", "unconventional"],
    terminology: {
      timeUnit: "Millisecond",
      timeUnitPlural: "Milliseconds",
      race: "Molecule Type",
      class: "Enzyme Class",
      npc: "Molecule",
      companion: "Cofactor",
      location: "Compartment",
      dungeon: "Pathway",
      hunt: "Reaction Chain",
      skill: "Reaction",
      item: "Substrate",
      creature: "Pathogen",
    },
  });

  const atp = await prisma.race.create({
    data: { worldId: world.id, name: "ATP", description: "Energy currency of the cell.", statModifiers: JSON.stringify({ MaxMP: 10 }) },
  });
  const glucose = await prisma.race.create({
    data: { worldId: world.id, name: "Glucose", description: "A simple sugar, fuel for reactions.", statModifiers: JSON.stringify({ CON: 2 }) },
  });
  void atp;
  void glucose;

  const kinase = await prisma.class.create({
    data: { worldId: world.id, name: "Kinase", description: "Catalyzes phosphorylation.", statModifiers: JSON.stringify({ INT: 2 }) },
  });

  const phosphorylate = await prisma.skill.create({
    data: {
      worldId: world.id,
      name: "Phosphorylate",
      description: "Transfer a phosphate group to a target molecule.",
      basePower: 8,
    },
  });
  await prisma.class.update({ where: { id: kinase.id }, data: { startingSkillIds: JSON.stringify([phosphorylate.id]) } });

  const virus = await prisma.creature.create({
    data: {
      worldId: world.id,
      name: "Invading Virus",
      description: "A hostile pathogen hijacking the cell's machinery.",
      stats: JSON.stringify({ STR: 10, CON: 9, MaxHP: 30 }),
      xpReward: 18,
    },
  });

  const receptor = await prisma.npc.create({
    data: { worldId: world.id, name: "Membrane Receptor", description: "Docks signaling molecules." },
  });

  const cytoplasm = await prisma.location.create({
    data: {
      worldId: world.id,
      name: "Cytoplasm",
      description: "The gel-like interior of the cell, teeming with activity.",
      isStart: true,
      npcPoolIds: JSON.stringify([receptor.id]),
    },
  });
  const mitochondria = await prisma.location.create({
    data: { worldId: world.id, name: "Mitochondria", description: "The powerhouse of the cell." },
  });
  await prisma.locationConnection.create({ data: { worldId: world.id, fromId: cytoplasm.id, toId: mitochondria.id } });

  const golgi = await prisma.dungeon.create({
    data: { worldId: world.id, locationId: cytoplasm.id, name: "Golgi Pathway", description: "A processing and packaging route." },
  });
  await prisma.dungeonFloor.create({
    data: { dungeonId: golgi.id, order: 1, name: "cis-Golgi", creatureIds: JSON.stringify([virus.id]) },
  });

  const signalEvent = await prisma.event.create({
    data: {
      worldId: world.id,
      name: "A Signal Cascade Begins",
      description: "A hormone binds a nearby receptor, triggering a cascade of reactions.",
      category: "LOCATION",
      locationId: cytoplasm.id,
      probability: 0.5,
    },
  });
  await prisma.eventChoice.create({
    data: {
      eventId: signalEvent.id,
      text: "Join the cascade",
      successStats: JSON.stringify([{ stat: "INT", difficulty: 10 }]),
      resultTextSuccess: "You amplify the signal successfully.",
      resultTextFailure: "The cascade fizzles without you.",
    },
  });
  await prisma.eventChoice.create({ data: { eventId: signalEvent.id, text: "Drift onward", resultTextSuccess: "You continue drifting." } });

  return world;
}

async function seedSciFi(ownerId: string) {
  const world = await createWorldShell(ownerId, {
    name: "Void Frontier",
    description:
      "A far-future space opera starter: alien species, derelict ships to raid, and bounties to collect across the sectors.",
    tags: ["sci-fi", "starter", "space"],
    terminology: {
      race: "Species",
      dungeon: "Derelict",
      hunt: "Bounty",
      location: "Sector",
      creature: "Xeno",
      companion: "Droid",
    },
  });

  const human = await prisma.race.create({ data: { worldId: world.id, name: "Human", description: "Adaptable spacefarers." } });
  const zex = await prisma.race.create({
    data: { worldId: world.id, name: "Zex'thari", description: "A cunning alien species.", statModifiers: JSON.stringify({ INT: 2, CHA: 1 }) },
  });
  void human;
  void zex;

  const pilot = await prisma.class.create({
    data: { worldId: world.id, name: "Pilot", description: "Skilled at ship combat and evasion.", statModifiers: JSON.stringify({ DEX: 3, Evasion: 5 }) },
  });

  const blaster = await prisma.skill.create({
    data: { worldId: world.id, name: "Blaster Shot", description: "Fire a plasma blaster.", basePower: 11 },
  });
  await prisma.class.update({ where: { id: pilot.id }, data: { startingSkillIds: JSON.stringify([blaster.id]) } });

  const rifle = await prisma.item.create({
    data: { worldId: world.id, name: "Plasma Rifle", description: "Standard-issue sidearm.", type: "WEAPON", statModifiers: JSON.stringify({ STR: 1 }) },
  });

  const wraith = await prisma.creature.create({
    data: {
      worldId: world.id,
      name: "Void Wraith",
      description: "A predator that hunts derelict wrecks.",
      stats: JSON.stringify({ STR: 12, CON: 9, MaxHP: 35 }),
      xpReward: 22,
      lootItemIds: JSON.stringify([rifle.id]),
    },
  });

  const droid = await prisma.companion.create({
    data: { worldId: world.id, name: "Astromech Droid", description: "A resourceful astromech that patches you up.", allowedClassIds: JSON.stringify([pilot.id]) },
  });
  void droid;

  const dockhand = await prisma.npc.create({ data: { worldId: world.id, name: "Dockhand", description: "Works the starport bay." } });

  const starport = await prisma.location.create({
    data: { worldId: world.id, name: "Starport", description: "A bustling hub at the edge of known space.", isStart: true, npcPoolIds: JSON.stringify([dockhand.id]), companionPoolIds: JSON.stringify([droid.id]) },
  });
  const belt = await prisma.location.create({ data: { worldId: world.id, name: "Asteroid Belt", description: "Scattered rock and old wrecks." } });
  await prisma.locationConnection.create({ data: { worldId: world.id, fromId: starport.id, toId: belt.id } });

  const freighter = await prisma.dungeon.create({
    data: { worldId: world.id, locationId: starport.id, name: "Wrecked Freighter", description: "A derelict ship, drifting and dark." },
  });
  await prisma.dungeonFloor.create({ data: { dungeonId: freighter.id, order: 1, name: "Cargo Hold", creatureIds: JSON.stringify([wraith.id]) } });

  const bountyEvent = await prisma.event.create({
    data: {
      worldId: world.id,
      name: "A Bounty Posting",
      description: "A terminal flickers with a new bounty: a smuggler is hiding somewhere in the belt.",
      category: "LOCATION",
      locationId: starport.id,
      probability: 0.5,
    },
  });
  await prisma.eventChoice.create({
    data: {
      eventId: bountyEvent.id,
      text: "Take the bounty",
      successStats: JSON.stringify([{ stat: "DEX", difficulty: 10 }]),
      resultTextSuccess: "You track the smuggler down and collect the bounty.",
      resultTextFailure: "The trail goes cold.",
    },
  });
  await prisma.eventChoice.create({ data: { eventId: bountyEvent.id, text: "Ignore it", resultTextSuccess: "Not worth the fuel." } });

  return world;
}

async function seedRealityShow(ownerId: string) {
  const world = await createWorldShell(ownerId, {
    name: "Isle of Rivals",
    description:
      "A starter world inspired by reality dating competitions. Days pass instead of years, confrontations replace dungeons, and tactics replace skills.",
    tags: ["drama", "starter", "romance"],
    terminology: {
      timeUnit: "Day",
      timeUnitPlural: "Days",
      race: "Persona",
      class: "Archetype",
      npc: "Contestant",
      companion: "Ally",
      location: "Set",
      dungeon: "Confrontation",
      hunt: "Challenge",
      skill: "Tactic",
      creature: "Rival",
    },
  });

  const charmer = await prisma.race.create({
    data: { worldId: world.id, name: "The Charmer", description: "Effortlessly likable.", statModifiers: JSON.stringify({ CHA: 3 }) },
  });
  void charmer;

  const strategist = await prisma.class.create({
    data: { worldId: world.id, name: "Strategist", description: "Plays the social game with precision.", statModifiers: JSON.stringify({ INT: 2, CHA: 1 }) },
  });

  const flirt = await prisma.skill.create({ data: { worldId: world.id, name: "Flirt", description: "Turn on the charm.", basePower: 6 } });
  await prisma.class.update({ where: { id: strategist.id }, data: { startingSkillIds: JSON.stringify([flirt.id]) } });

  const rival = await prisma.creature.create({
    data: {
      worldId: world.id,
      name: "Catty Rival",
      description: "Determined to steal your spotlight (and your love interest).",
      stats: JSON.stringify({ STR: 8, CON: 8, MaxHP: 25 }),
      xpReward: 15,
    },
  });

  const castmate = await prisma.npc.create({ data: { worldId: world.id, name: "Fellow Contestant", description: "Another hopeful on the island." } });
  const ally = await prisma.companion.create({
    data: { worldId: world.id, name: "Alliance Partner", description: "Has your back in the house.", allowedClassIds: JSON.stringify([strategist.id]) },
  });
  void ally;

  const beachCamp = await prisma.location.create({
    data: { worldId: world.id, name: "Beach Camp", description: "Where the cast lounges between challenges.", isStart: true, npcPoolIds: JSON.stringify([castmate.id]) },
  });
  const villa = await prisma.location.create({ data: { worldId: world.id, name: "The Villa", description: "Shared living quarters, full of gossip." } });
  await prisma.locationConnection.create({ data: { worldId: world.id, fromId: beachCamp.id, toId: villa.id } });

  const bonfire = await prisma.dungeon.create({
    data: { worldId: world.id, locationId: beachCamp.id, name: "Bonfire Confrontation", description: "Tensions boil over at the fire pit." },
  });
  await prisma.dungeonFloor.create({ data: { dungeonId: bonfire.id, order: 1, name: "The Fire Pit", creatureIds: JSON.stringify([rival.id]) } });

  const gossipEvent = await prisma.event.create({
    data: {
      worldId: world.id,
      name: "Juicy Gossip",
      description: "A fellow contestant pulls you aside with some spicy intel.",
      category: "LOCATION",
      locationId: beachCamp.id,
      probability: 0.5,
    },
  });
  await prisma.eventChoice.create({
    data: {
      eventId: gossipEvent.id,
      text: "Play along",
      successStats: JSON.stringify([{ stat: "CHA", difficulty: 10 }]),
      resultTextSuccess: "You navigate the drama like a pro.",
      resultTextFailure: "You accidentally make it worse.",
    },
  });
  await prisma.eventChoice.create({ data: { eventId: gossipEvent.id, text: "Stay out of it", resultTextSuccess: "Not your circus." } });

  return world;
}

async function main() {
  const owner = await ensureSystemUser();
  const existingDefaults = await prisma.world.count({ where: { ownerId: owner.id, isDefault: true } });
  if (existingDefaults > 0) {
    console.log(`Skipping seed: ${existingDefaults} default world(s) already exist for ${owner.username}.`);
    return;
  }

  const fantasy = await seedFantasy(owner.id);
  const cell = await seedCell(owner.id);
  const sciFi = await seedSciFi(owner.id);
  const reality = await seedRealityShow(owner.id);

  console.log("Seeded worlds:");
  for (const w of [fantasy, cell, sciFi, reality]) {
    console.log(`  - ${w.name} -> /worlds/${w.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
