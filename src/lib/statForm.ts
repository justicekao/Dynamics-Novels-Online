import { ALL_STATS } from "@/lib/constants";

export function statModifiersFromForm(formData: FormData): string {
  const out: Record<string, number> = {};
  for (const stat of ALL_STATS) {
    const raw = formData.get(`stat_${stat}`);
    const n = Number(raw || 0);
    if (n !== 0) out[stat] = n;
  }
  return JSON.stringify(out);
}

export function parseStatModifiers(raw: string): Record<string, number> {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
