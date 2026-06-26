const PREFIX = "hoodwinked.solo.";

export function readScore<T extends object>(slug: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + slug);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ...fallback, ...(parsed as Partial<T>) };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function writeScore<T extends object>(slug: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + slug, JSON.stringify(value));
  } catch {}
}

export function clearScore(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + slug);
  } catch {}
}
