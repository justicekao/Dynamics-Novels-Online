export const CORE_STATS = [
  "STR",
  "DEX",
  "CON",
  "INT",
  "WIS",
  "CHA",
  "LUCK",
  "MaxHP",
  "MaxMP",
  "Evasion",
  "FleeChance",
] as const;

export type CoreStat = (typeof CORE_STATS)[number];

export const ELEMENTS = ["Fire", "Water", "Earth", "Air", "Light", "Dark", "None"] as const;
export type Element = (typeof ELEMENTS)[number];

export const RESISTANCE_STATS = ELEMENTS.filter((e) => e !== "None").map(
  (e) => `${e}Resist` as const,
);

export const ALL_STATS = [...CORE_STATS, ...RESISTANCE_STATS];

export const DEFAULT_TERMINOLOGY = {
  timeUnit: "Year",
  timeUnitPlural: "Years",
  dungeon: "Dungeon",
  hunt: "Hunt",
  tavern: "Tavern",
  inn: "Inn",
  race: "Race",
  class: "Class",
  npc: "NPC",
  companion: "Companion",
  location: "Location",
  skill: "Skill",
  item: "Item",
  creature: "Creature",
} as const;

export type Terminology = typeof DEFAULT_TERMINOLOGY;

export function parseTerminology(raw: string): Terminology {
  try {
    return { ...DEFAULT_TERMINOLOGY, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_TERMINOLOGY };
  }
}

export const EFFECT_KINDS = [
  "STAT_MODIFIER",
  "STATUS",
  "DAMAGE",
  "HEAL",
  "GRANT_TRAIT",
] as const;

export const STATUS_EFFECTS = ["Burn", "Freeze", "Charm", "Poison", "Stun", "Silence"] as const;

export const ITEM_TYPES = ["WEAPON", "ARMOR", "CONSUMABLE", "KEY", "MISC"] as const;

export const SKILL_TARGET_TYPES = [
  "SELF",
  "SINGLE_ENEMY",
  "ALL_ENEMIES",
  "SINGLE_ALLY",
  "ALL_ALLIES",
] as const;

export const SKILL_TYPES = ["ACTIVE", "PASSIVE"] as const;

export const UNLOCK_CONDITION_TYPES = [
  "HAS_ITEM",
  "HAS_TRAIT",
  "COMPLETED_EVENT",
  "LEVEL_AT_LEAST",
  "HAS_COMPANION",
] as const;

export const EVENT_CATEGORIES = ["LOCATION", "DUNGEON_FLOOR", "GLOBAL"] as const;

export const WORLD_VISIBILITY = ["PRIVATE", "PUBLIC"] as const;

export const INTERACTION_CHOICE_SLOTS = 4;
export const INTERACTION_OUTCOME_SLOTS = 3;
export const EVENT_CHOICE_SLOTS = 4;
export const SUCCESS_STAT_SLOTS = 3;

export const DEFAULT_BASE_STATS: Record<string, number> = {
  STR: 10,
  DEX: 10,
  CON: 10,
  INT: 10,
  WIS: 10,
  CHA: 10,
  LUCK: 10,
  MaxHP: 50,
  MaxMP: 20,
  Evasion: 5,
  FleeChance: 50,
};
