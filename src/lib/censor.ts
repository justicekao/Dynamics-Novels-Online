const BAD_WORDS = ["fuck", "shit", "bitch", "asshole", "cunt", "bastard", "dick", "piss"];

export function censor(text: string) {
  let out = text;
  for (const w of BAD_WORDS) {
    const re = new RegExp(`\\b${w}\\w*`, "gi");
    out = out.replace(re, (m) => m[0] + "*".repeat(Math.max(m.length - 1, 1)));
  }
  return out;
}
