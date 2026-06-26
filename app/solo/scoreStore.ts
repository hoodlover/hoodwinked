const PREFIX = "hoodwinked.solo.";
const PLAYER_KEY = `${PREFIX}player`;
const PLAYER_NAME_MAX = 24;

export function readPlayerName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(PLAYER_KEY) || "";
  } catch {
    return "";
  }
}

export function writePlayerName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = name.trim().slice(0, PLAYER_NAME_MAX);
    if (trimmed) window.localStorage.setItem(PLAYER_KEY, trimmed);
    else window.localStorage.removeItem(PLAYER_KEY);
  } catch {}
}

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
