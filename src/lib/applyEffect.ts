import "server-only";
import { parseJsonObject } from "@/lib/json";
import { rollPercent, type StatSheet } from "@/lib/gameEngine";

export interface EffectApplication {
  logLine: string;
}

/**
 * Mutates `stats` and `traitIds` in place based on the effect's kind/payload.
 * STATUS effects are logged narratively but not simulated as ongoing ticks (MVP simplification).
 */
export function applyEffectToCharacter(
  effect: { name: string; kind: string; payload: string },
  stats: StatSheet,
  traitIds: string[],
): EffectApplication {
  const payload = parseJsonObject<{
    stat?: string;
    amount?: number;
    duration?: number;
    status?: string;
    chance?: number;
    element?: string;
    traitId?: string;
  }>(effect.payload);

  if (effect.kind === "STAT_MODIFIER" && payload.stat) {
    stats[payload.stat] = (stats[payload.stat] ?? 0) + (payload.amount ?? 0);
    return { logLine: `${effect.name}: ${payload.stat} ${payload.amount! >= 0 ? "+" : ""}${payload.amount}.` };
  }

  if (effect.kind === "HEAL") {
    const amount = payload.amount ?? 0;
    stats.HP = Math.min(stats.MaxHP ?? stats.HP ?? 0, (stats.HP ?? 0) + amount);
    return { logLine: `${effect.name}: healed ${amount} HP.` };
  }

  if (effect.kind === "DAMAGE") {
    const amount = payload.amount ?? 0;
    stats.HP = Math.max(0, (stats.HP ?? 0) - amount);
    return { logLine: `${effect.name}: took ${amount} ${payload.element ?? ""} damage.` };
  }

  if (effect.kind === "STATUS") {
    const chance = payload.chance ?? 100;
    if (rollPercent(chance)) {
      return { logLine: `${effect.name}: afflicted with ${payload.status} for ${payload.duration ?? 1} turns.` };
    }
    return { logLine: `${effect.name}: ${payload.status} did not take hold.` };
  }

  if (effect.kind === "GRANT_TRAIT" && payload.traitId) {
    const chance = payload.chance ?? 100;
    if (rollPercent(chance) && !traitIds.includes(payload.traitId)) {
      traitIds.push(payload.traitId);
      return { logLine: `${effect.name}: gained a new trait.` };
    }
    return { logLine: `${effect.name}: no change.` };
  }

  return { logLine: effect.name };
}
