export function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function parseJsonObject<T extends Record<string, unknown> = Record<string, unknown>>(
  raw: string,
): T {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? v : ({} as T);
  } catch {
    return {} as T;
  }
}

export function parseJsonAny<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function conditionsFromForm(formData: FormData, name: string) {
  const count = Number(formData.get(`${name}_count`) || 0);
  const out: { type: string; targetId?: string; value?: number }[] = [];
  for (let i = 0; i < count; i++) {
    const type = String(formData.get(`${name}_${i}_type`) || "");
    if (!type) continue;
    if (type === "LEVEL_AT_LEAST") {
      out.push({ type, value: Number(formData.get(`${name}_${i}_value`) || 0) });
    } else {
      const targetId = String(formData.get(`${name}_${i}_targetId`) || "");
      if (!targetId) continue;
      out.push({ type, targetId });
    }
  }
  return JSON.stringify(out);
}

export function getMultiValues(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((v) => String(v))
    .filter(Boolean);
}
