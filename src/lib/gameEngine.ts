import "server-only";
import { ALL_STATS, DEFAULT_BASE_STATS } from "@/lib/constants";
import { parseStatModifiers } from "@/lib/statForm";
import { parseJsonAny, parseJsonArray } from "@/lib/json";

export type StatSheet = Record<string, number>;

function addStats(base: StatSheet, mods: StatSheet) {
  for (const [k, v] of Object.entries(mods)) {
    base[k] = (base[k] ?? 0) + v;
  }
}

export function baseStatSheet(): StatSheet {
  const sheet: StatSheet = {};
  for (const s of ALL_STATS) sheet[s] = DEFAULT_BASE_STATS[s] ?? 0;
  return sheet;
}

export function buildStartingStats(raceMods: string, classMods: string): StatSheet {
  const sheet = baseStatSheet();
  addStats(sheet, parseStatModifiers(raceMods));
  addStats(sheet, parseStatModifiers(classMods));
  sheet.HP = sheet.MaxHP;
  sheet.MP = sheet.MaxMP;
  return sheet;
}

export type Condition = { type: string; targetId?: string; value?: number };

export interface CharacterState {
  level: number;
  stats: StatSheet;
  inventory: { itemId: string; qty: number }[];
  traitIds: string[];
  completedEventIds: string[];
  companions: { companionId: string; level: number; xp: number; unlockedSkillIds: string[] }[];
}

export function checkConditions(conditions: Condition[], character: CharacterState): boolean {
  for (const c of conditions) {
    if (c.type === "LEVEL_AT_LEAST") {
      if (character.level < (c.value ?? 0)) return false;
    } else if (c.type === "HAS_ITEM") {
      if (!character.inventory.some((i) => i.itemId === c.targetId && i.qty > 0)) return false;
    } else if (c.type === "HAS_TRAIT") {
      if (!character.traitIds.includes(c.targetId ?? "")) return false;
    } else if (c.type === "COMPLETED_EVENT") {
      if (!character.completedEventIds.includes(c.targetId ?? "")) return false;
    } else if (c.type === "HAS_COMPANION") {
      if (!character.companions.some((co) => co.companionId === c.targetId)) return false;
    }
  }
  return true;
}

export function parseConditions(raw: string): Condition[] {
  return parseJsonAny<Condition[]>(raw, []);
}

/** chance in [5,95] that a stat check against `difficulty` succeeds */
export function successChance(stat: number, difficulty: number): number {
  return Math.min(95, Math.max(5, 50 + (stat - difficulty) * 5));
}

export function rollPercent(chance: number): boolean {
  return Math.random() * 100 < chance;
}

export function xpForNextLevel(level: number): number {
  return level * 100;
}

/** Applies xp, leveling up (possibly multiple times), restoring HP/MP and growing stats slightly on each level. */
export function applyXp(stats: StatSheet, level: number, xp: number, gained: number) {
  let newXp = xp + gained;
  let newLevel = level;
  const log: string[] = [];
  while (newXp >= xpForNextLevel(newLevel)) {
    newXp -= xpForNextLevel(newLevel);
    newLevel += 1;
    stats.MaxHP = (stats.MaxHP ?? 0) + 8;
    stats.MaxMP = (stats.MaxMP ?? 0) + 3;
    stats.STR = (stats.STR ?? 0) + 1;
    stats.DEX = (stats.DEX ?? 0) + 1;
    stats.CON = (stats.CON ?? 0) + 1;
    stats.HP = stats.MaxHP;
    stats.MP = stats.MaxMP;
    log.push(`Reached level ${newLevel}!`);
  }
  return { level: newLevel, xp: newXp, log };
}

export interface CombatCreature {
  name: string;
  stats: StatSheet;
  xpReward: number;
  lootItemIds: string[];
  element: string;
}

export function resolveCombat(playerStats: StatSheet, creature: CombatCreature) {
  const log: string[] = [];
  let playerHP = playerStats.HP ?? playerStats.MaxHP ?? 1;
  let creatureHP = creature.stats.MaxHP ?? creature.stats.HP ?? 20;
  const playerAtk = Math.max(1, playerStats.STR ?? 5);
  const playerDef = Math.max(0, playerStats.CON ?? 5);
  const creatureAtk = Math.max(1, creature.stats.STR ?? 5);
  const creatureDef = Math.max(0, creature.stats.CON ?? 5);
  const evasion = Math.min(60, Math.max(0, playerStats.Evasion ?? 5));

  let rounds = 0;
  while (playerHP > 0 && creatureHP > 0 && rounds < 40) {
    rounds += 1;
    const playerDmg = Math.max(1, playerAtk - Math.floor(creatureDef / 2));
    creatureHP -= playerDmg;
    log.push(`You hit ${creature.name} for ${playerDmg}.`);
    if (creatureHP <= 0) break;

    if (rollPercent(evasion)) {
      log.push(`${creature.name} attacks, but you evade.`);
      continue;
    }
    const creatureDmg = Math.max(1, creatureAtk - Math.floor(playerDef / 2));
    playerHP -= creatureDmg;
    log.push(`${creature.name} hits you for ${creatureDmg}.`);
  }

  const won = creatureHP <= 0 && playerHP > 0;
  playerStats.HP = Math.max(won ? playerHP : Math.max(1, Math.floor((playerStats.MaxHP ?? 1) * 0.25)), 0);

  return { won, log, xpReward: won ? creature.xpReward : 0, lootItemIds: won ? creature.lootItemIds : [] };
}

function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic shuffle/pick keyed by `seed`, so options stay stable until the seed changes (e.g. time advances). */
export function seededPick<T>(items: T[], count: number, seed: string): T[] {
  const rand = mulberry32(hashSeed(seed));
  const pool = [...items];
  const picked: T[] = [];
  while (pool.length && picked.length < count) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

export function effectivePlayerStat(stats: StatSheet, stat: string): number {
  return stats[stat] ?? 0;
}

export function inventoryFromRaw(raw: string): { itemId: string; qty: number }[] {
  return parseJsonAny(raw, []);
}

export function companionsFromRaw(
  raw: string,
): { companionId: string; level: number; xp: number; unlockedSkillIds: string[] }[] {
  return parseJsonAny(raw, []);
}

export function pushLog(raw: string, lines: string[]): string {
  const existing = parseJsonAny<string[]>(raw, []);
  const next = [...existing, ...lines].slice(-40);
  return JSON.stringify(next);
}

export function characterStateFrom(character: {
  level: number;
  stats: string;
  inventory: string;
  traitIds: string;
  completedEventIds: string;
  companions: string;
}): CharacterState {
  return {
    level: character.level,
    stats: parseJsonAny<StatSheet>(character.stats, {}),
    inventory: inventoryFromRaw(character.inventory),
    traitIds: parseJsonArray(character.traitIds),
    completedEventIds: parseJsonArray(character.completedEventIds),
    companions: companionsFromRaw(character.companions),
  };
}
