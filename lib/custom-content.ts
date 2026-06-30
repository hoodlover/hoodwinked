import type { FeudQuestion, PictureItem, TriviaQuestion, WheelPuzzle } from "./engine";

export type CustomContentDeck = {
  id: string;
  name: string;
  updatedAt: number;
  prompts: string[];
  trivia: TriviaQuestion[];
  feud: FeudQuestion[];
  picture: PictureItem[];
  wheel: WheelPuzzle[];
};

const CUSTOM_CONTENT_LIBRARY_KEY = "parlor:custom-content-library";
export const ACTIVE_CUSTOM_CONTENT_DECK_KEY = "parlor:active-custom-content-deck";
const CONTENT_SOURCE_KEY = "parlor:content-source";

export function emptyCustomContentDeck(name = "Untitled Deck"): CustomContentDeck {
  return {
    id: makeDeckId(),
    name,
    updatedAt: Date.now(),
    prompts: [],
    trivia: [],
    feud: [],
    picture: [],
    wheel: []
  };
}

export function makeDeckId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean);
}

export function normalizeCustomContentDeck(raw: unknown): CustomContentDeck | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<CustomContentDeck>;
  const id = cleanString(item.id) || makeDeckId();
  const name = cleanString(item.name) || "Untitled Deck";
  const updatedAt = typeof item.updatedAt === "number" && Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now();

  const trivia = Array.isArray(item.trivia)
    ? item.trivia
        .map((q, index) => {
          const question = q as Partial<TriviaQuestion>;
          const choices = cleanStringList(question.choices).slice(0, 4);
          const text = cleanString(question.text);
          if (!text || choices.length < 2) return null;
          const correctIndex = Number.isInteger(question.correctIndex)
            ? Math.max(0, Math.min(choices.length - 1, Number(question.correctIndex)))
            : 0;
          return {
            id: cleanString(question.id) || `${id}-t${index + 1}`,
            category: cleanString(question.category) || "Custom",
            text,
            choices,
            correctIndex
          } satisfies TriviaQuestion;
        })
        .filter((q): q is TriviaQuestion => !!q)
    : [];

  const feud = Array.isArray(item.feud)
    ? item.feud
        .map((q, index) => {
          const question = q as Partial<FeudQuestion>;
          const prompt = cleanString(question.prompt);
          const answers = Array.isArray(question.answers)
            ? question.answers
                .map((answer, answerIndex) => {
                  const entry = answer as { text?: unknown; points?: unknown; aliases?: unknown };
                  const text = cleanString(entry.text);
                  if (!text) return null;
                  const points = Number(entry.points);
                  return {
                    text,
                    points: Number.isFinite(points) ? Math.max(1, Math.round(points)) : Math.max(1, 40 - answerIndex * 5),
                    aliases: cleanStringList(entry.aliases)
                  };
                })
                .filter((answer): answer is { text: string; points: number; aliases: string[] } => !!answer)
            : [];
          if (!prompt || answers.length === 0) return null;
          const normalized: FeudQuestion = {
            id: cleanString(question.id) || `${id}-f${index + 1}`,
            prompt,
            answers
          };
          return normalized;
        })
        .filter(Boolean) as FeudQuestion[]
    : [];

  const picture = Array.isArray(item.picture)
    ? item.picture
        .map((pic, index) => {
          const entry = pic as Partial<PictureItem>;
          const answer = cleanString(entry.answer);
          const imagePrompt = cleanString(entry.imagePrompt);
          const src = cleanString(entry.src);
          if (!answer || (!imagePrompt && !src)) return null;
          const normalized: PictureItem = {
            id: cleanString(entry.id) || `${id}-p${index + 1}`,
            src: src || undefined,
            answer,
            hint: cleanString(entry.hint),
            aliases: cleanStringList(entry.aliases),
            imagePrompt,
            imageStatus: src ? "ready" as const : "idle" as const
          };
          return normalized;
        })
        .filter(Boolean) as PictureItem[]
    : [];

  const wheel = Array.isArray(item.wheel)
    ? item.wheel
        .map((puzzle, index) => {
          const entry = puzzle as Partial<WheelPuzzle>;
          const text = cleanString(entry.text).toUpperCase();
          if (!text) return null;
          return {
            id: cleanString(entry.id) || `${id}-w${index + 1}`,
            category: cleanString(entry.category) || "Custom",
            text
          } satisfies WheelPuzzle;
        })
        .filter((puzzle): puzzle is WheelPuzzle => !!puzzle)
    : [];

  return {
    id,
    name,
    updatedAt,
    prompts: cleanStringList(item.prompts),
    trivia,
    feud,
    picture,
    wheel
  };
}

export function loadCustomContentDecks(): CustomContentDeck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_CONTENT_LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCustomContentDeck).filter((deck): deck is CustomContentDeck => !!deck);
  } catch {
    return [];
  }
}

export function saveCustomContentDecks(decks: CustomContentDeck[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_CONTENT_LIBRARY_KEY, JSON.stringify(decks.map((deck) => ({ ...deck, updatedAt: Date.now() }))));
}

export function loadActiveCustomContentDeck(): CustomContentDeck | null {
  if (typeof window === "undefined") return null;
  if (window.localStorage.getItem(CONTENT_SOURCE_KEY) === "built-in") return null;
  return loadSelectedCustomContentDeck();
}

export function loadSelectedCustomContentDeck(): CustomContentDeck | null {
  if (typeof window === "undefined") return null;
  const activeId = window.localStorage.getItem(ACTIVE_CUSTOM_CONTENT_DECK_KEY);
  if (!activeId) return null;
  return loadCustomContentDecks().find((deck) => deck.id === activeId) ?? null;
}

export function setActiveCustomContentDeck(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) {
    window.localStorage.setItem(ACTIVE_CUSTOM_CONTENT_DECK_KEY, id);
    window.localStorage.setItem(CONTENT_SOURCE_KEY, "custom");
  } else {
    window.localStorage.setItem(CONTENT_SOURCE_KEY, "built-in");
  }
}

export function setBuiltInContentDeck() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONTENT_SOURCE_KEY, "built-in");
}
