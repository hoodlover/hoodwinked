/* ============================================================================
   Parlor game engine — pure (state, action) => state.

   This module is shared by the React client and the PartyKit server. Keep it
   free of React, the DOM, and any Node/Next.js APIs. Date.now() and Math.random()
   are intentionally used; both work the same in browsers and Cloudflare Workers.
   ========================================================================== */

/* ---- TUNABLES ------------------------------------------------------------ */
export const TOTAL_ROUNDS = 5;
export const POINTS_PER_VOTE = 100;
export const WRITING_SECONDS = 60;
export const VOTING_SECONDS = 30;

export const PROMPTS = [
  "The worst possible name for a new cargo ship",
  "A rejected slogan for this year's family vacation",
  "Something you should never say to your GPS",
  "The real reason the Wi-Fi went down",
  "A terrible name for a worship band",
  "A bad theme for a kid's birthday party",
  "The worst superpower to be stuck with",
  "A rejected flavor of ice cream",
  "What the dog would say if it could talk for ten seconds",
  "A genuinely terrible motivational poster",
  "The least useful thing to pack for camping",
  "What's actually in the mystery container at the back of the fridge",
  "A rejected ride at the county fair",
  "The worst advice to give a brand-new driver",
  "What the cat is quietly plotting",
  "A bad name for a houseplant",
  "A children's book title that should never have been published",
  "The most awkward thing to find in your old yearbook",
  "What the GPS lady is really thinking",
  "A rejected name for a new crayon color",
  "The worst possible birthday gift from a distant relative",
  "A terrible piece of advice from a fortune cookie",
  "The hidden talent grandma is keeping secret",
  "A rejected feature for the next iPhone",
  "Why dad really took so long in the hardware store",
  "The actual reason traffic is stopped on the highway",
  "A bad name for a peewee soccer team",
  "What the dishwasher is plotting late at night",
  "A rejected slogan for the local DMV",
  "The strangest thing you've found in a hotel room",
  "What the smoke alarm has been brooding about",
  "A rejected name for a new bug spray",
  "The worst possible thing to whisper at a funeral",
  "A genuinely cursed sandwich",
  "What the Roomba is muttering under its breath",
  "A rejected name for a hurricane",
  "The most unhelpful thing on a job interview résumé",
  "A bad password your uncle insists is secure",
  "What's playing on the radio in the elevator to hell"
];

export const COLORS = [
  "#FFC15E", "#FF5E78", "#5BD1B7", "#8E9BFF",
  "#FF9447", "#C0E84B", "#FF82D6", "#57C7FF"
];

/* ---- TYPES --------------------------------------------------------------- */
export type Phase = "lobby" | "writing" | "voting" | "reveal" | "scoreboard" | "gameover";
export type Mode = "classic" | "quiplash";

export type QuipPrompt = {
  id: string;
  text: string;
  writers: [string, string];
  answers: Record<string, string>;
};

export type Player = {
  id: string;
  name: string;
  color: string;
  score: number;
};

export type State = {
  phase: Phase;
  roomCode: string;
  players: Record<string, Player>;
  round: number;
  totalRounds: number;
  prompt: string | null;
  usedPrompts: string[];
  answers: Record<string, string>;
  votes: Record<string, string>;
  revealOrder: string[];
  revealIndex: number;
  lastPoints: Record<string, number>;
  phaseDeadline: number | null;
  typing: Record<string, number>;
  mode: Mode;
  quipPrompts: QuipPrompt[];
  quipIndex: number;
  quipVotes: Record<string, Record<string, string>>;
  _counts?: Record<string, number>;
};

export type Action =
  | { type: "JOIN"; id: string; name: string }
  | { type: "START_GAME" }
  | { type: "SUBMIT_ANSWER"; playerId: string; text: string }
  | { type: "FORCE_VOTING" }
  | { type: "VOTE"; voterId: string; ownerId: string }
  | { type: "FORCE_REVEAL" }
  | { type: "NEXT_REVEAL" }
  | { type: "NEXT_ROUND" }
  | { type: "PLAY_AGAIN" }
  | { type: "RESET" }
  | { type: "TYPING"; playerId: string; at: number }
  | { type: "TOGGLE_MODE" }
  | { type: "SUBMIT_QUIP"; promptId: string; playerId: string; text: string }
  | { type: "VOTE_QUIP"; promptId: string; voterId: string; ownerId: string }
  | { type: "NEXT_QUIP" };

/* ---- HELPERS ------------------------------------------------------------- */
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const makeRoomCode = () =>
  Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

export function pickPrompt(used: string[]): string {
  const pool = PROMPTS.filter((p) => !used.includes(p));
  const src = pool.length ? pool : PROMPTS;
  return src[Math.floor(Math.random() * src.length)];
}

export function pickPrompts(used: string[], n: number): string[] {
  const picked: string[] = [];
  const usedSet = new Set(used);
  const pool = PROMPTS.filter((p) => !usedSet.has(p));
  while (picked.length < n) {
    const src = pool.length ? pool : PROMPTS;
    const choice = src[Math.floor(Math.random() * src.length)];
    if (!picked.includes(choice)) picked.push(choice);
    if (picked.length === PROMPTS.length) break;
  }
  return picked;
}

export function buildQuipPrompts(playerIds: string[], used: string[]): QuipPrompt[] {
  const n = playerIds.length;
  if (n < 3) return [];
  const texts = pickPrompts(used, n);
  return texts.map((text, i) => {
    const a = playerIds[i % n];
    const b = playerIds[(i + 1) % n];
    return {
      id: `q${i}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      writers: [a, b] as [string, string],
      answers: {}
    };
  });
}

export const joinedIds = (s: State) => Object.keys(s.players);
export const deadline = (seconds: number) => Date.now() + seconds * 1000;

/* ---- INITIAL STATE ------------------------------------------------------- */
export function makeInitialState(): State {
  return {
    phase: "lobby",
    roomCode: makeRoomCode(),
    players: {},
    round: 0,
    totalRounds: TOTAL_ROUNDS,
    prompt: null,
    usedPrompts: [],
    answers: {},
    votes: {},
    revealOrder: [],
    revealIndex: 0,
    lastPoints: {},
    phaseDeadline: null,
    typing: {},
    mode: "classic",
    quipPrompts: [],
    quipIndex: 0,
    quipVotes: {}
  };
}

/* ---- REDUCER ------------------------------------------------------------- */
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "JOIN": {
      if (state.phase !== "lobby") return state;
      if (state.players[action.id]) return state;
      const color = COLORS[Object.keys(state.players).length % COLORS.length];
      return {
        ...state,
        players: {
          ...state.players,
          [action.id]: { id: action.id, name: action.name.trim() || "Player", color, score: 0 }
        }
      };
    }

    case "TOGGLE_MODE": {
      if (state.phase !== "lobby") return state;
      return { ...state, mode: state.mode === "classic" ? "quiplash" : "classic" };
    }

    case "START_GAME": {
      const ids = joinedIds(state);
      const min = state.mode === "quiplash" ? 3 : 2;
      if (ids.length < min) return state;
      if (state.mode === "quiplash") {
        const quipPrompts = buildQuipPrompts(ids, state.usedPrompts);
        return {
          ...state,
          phase: "writing",
          round: 1,
          prompt: null,
          usedPrompts: [...state.usedPrompts, ...quipPrompts.map((q) => q.text)],
          answers: {},
          votes: {},
          revealOrder: [],
          revealIndex: 0,
          lastPoints: {},
          phaseDeadline: deadline(WRITING_SECONDS),
          typing: {},
          quipPrompts,
          quipIndex: 0,
          quipVotes: {}
        };
      }
      const prompt = pickPrompt(state.usedPrompts);
      return {
        ...state,
        phase: "writing",
        round: 1,
        prompt,
        usedPrompts: [...state.usedPrompts, prompt],
        answers: {},
        votes: {},
        revealOrder: [],
        revealIndex: 0,
        lastPoints: {},
        phaseDeadline: deadline(WRITING_SECONDS),
        typing: {}
      };
    }

    case "SUBMIT_ANSWER": {
      if (state.phase !== "writing") return state;
      if (!state.players[action.playerId]) return state;
      const answers = { ...state.answers, [action.playerId]: action.text.trim() || "(blank)" };
      if (Object.keys(answers).length >= joinedIds(state).length) {
        return { ...state, answers, phase: "voting", votes: {}, phaseDeadline: deadline(VOTING_SECONDS) };
      }
      return { ...state, answers };
    }

    case "FORCE_VOTING": {
      if (state.phase !== "writing") return state;
      if (state.mode === "quiplash") {
        const quipPrompts = state.quipPrompts.map((q) => {
          const answers = { ...q.answers };
          q.writers.forEach((w) => {
            if (!answers[w]) answers[w] = "(no answer)";
          });
          return { ...q, answers };
        });
        return {
          ...state,
          quipPrompts,
          phase: "voting",
          quipIndex: 0,
          quipVotes: {},
          phaseDeadline: deadline(VOTING_SECONDS)
        };
      }
      const answers = { ...state.answers };
      joinedIds(state).forEach((id) => {
        if (!answers[id]) answers[id] = "(no answer)";
      });
      return { ...state, answers, phase: "voting", votes: {}, phaseDeadline: deadline(VOTING_SECONDS) };
    }

    case "VOTE": {
      if (state.phase !== "voting") return state;
      if (action.voterId === action.ownerId) return state;
      const votes = { ...state.votes, [action.voterId]: action.ownerId };
      if (Object.keys(votes).length >= joinedIds(state).length) {
        return tally({ ...state, votes });
      }
      return { ...state, votes };
    }

    case "FORCE_REVEAL": {
      if (state.phase !== "voting") return state;
      if (state.mode === "quiplash") return tallyQuip(state);
      return tally(state);
    }

    case "NEXT_REVEAL": {
      if (state.phase !== "reveal") return state;
      const next = state.revealIndex + 1;
      if (next >= state.revealOrder.length) return { ...state, phase: "scoreboard" };
      return { ...state, revealIndex: next };
    }

    case "NEXT_ROUND": {
      if (state.phase !== "scoreboard") return state;
      if (state.round >= state.totalRounds) return { ...state, phase: "gameover", phaseDeadline: null };
      if (state.mode === "quiplash") {
        const ids = joinedIds(state);
        const quipPrompts = buildQuipPrompts(ids, state.usedPrompts);
        return {
          ...state,
          phase: "writing",
          round: state.round + 1,
          prompt: null,
          usedPrompts: [...state.usedPrompts, ...quipPrompts.map((q) => q.text)],
          answers: {},
          votes: {},
          revealOrder: [],
          revealIndex: 0,
          lastPoints: {},
          phaseDeadline: deadline(WRITING_SECONDS),
          typing: {},
          quipPrompts,
          quipIndex: 0,
          quipVotes: {}
        };
      }
      const prompt = pickPrompt(state.usedPrompts);
      return {
        ...state,
        phase: "writing",
        round: state.round + 1,
        prompt,
        usedPrompts: [...state.usedPrompts, prompt],
        answers: {},
        votes: {},
        revealOrder: [],
        revealIndex: 0,
        lastPoints: {},
        phaseDeadline: deadline(WRITING_SECONDS),
        typing: {}
      };
    }

    case "PLAY_AGAIN": {
      const players: Record<string, Player> = {};
      Object.values(state.players).forEach((p) => (players[p.id] = { ...p, score: 0 }));
      return { ...makeInitialState(), roomCode: state.roomCode, players };
    }

    case "RESET":
      return makeInitialState();

    case "TYPING": {
      if (state.phase !== "writing") return state;
      if (!state.players[action.playerId]) return state;
      return { ...state, typing: { ...state.typing, [action.playerId]: action.at } };
    }

    case "SUBMIT_QUIP": {
      if (state.phase !== "writing" || state.mode !== "quiplash") return state;
      const quipPrompts = state.quipPrompts.map((q) => {
        if (q.id !== action.promptId) return q;
        if (!q.writers.includes(action.playerId)) return q;
        return { ...q, answers: { ...q.answers, [action.playerId]: action.text.trim() || "(blank)" } };
      });
      const allLocked = quipPrompts.every((q) => q.writers.every((w) => q.answers[w] != null));
      if (allLocked) {
        return {
          ...state,
          quipPrompts,
          phase: "voting",
          quipIndex: 0,
          quipVotes: {},
          phaseDeadline: deadline(VOTING_SECONDS)
        };
      }
      return { ...state, quipPrompts };
    }

    case "VOTE_QUIP": {
      if (state.phase !== "voting" || state.mode !== "quiplash") return state;
      const prompt = state.quipPrompts[state.quipIndex];
      if (!prompt || prompt.id !== action.promptId) return state;
      if (prompt.writers.includes(action.voterId)) return state;
      if (!prompt.writers.includes(action.ownerId)) return state;
      const promptVotes = { ...(state.quipVotes[prompt.id] ?? {}), [action.voterId]: action.ownerId };
      const quipVotes = { ...state.quipVotes, [prompt.id]: promptVotes };
      const eligible = joinedIds(state).filter((id) => !prompt.writers.includes(id));
      const allVoted = eligible.every((id) => promptVotes[id] != null);
      if (!allVoted) return { ...state, quipVotes };
      const nextIdx = state.quipIndex + 1;
      if (nextIdx < state.quipPrompts.length) {
        return {
          ...state,
          quipVotes,
          quipIndex: nextIdx,
          phaseDeadline: deadline(VOTING_SECONDS)
        };
      }
      return tallyQuip({ ...state, quipVotes });
    }

    case "NEXT_QUIP": {
      if (state.mode !== "quiplash") return state;
      if (state.phase === "voting") {
        const nextIdx = state.quipIndex + 1;
        if (nextIdx < state.quipPrompts.length) {
          return { ...state, quipIndex: nextIdx, phaseDeadline: deadline(VOTING_SECONDS) };
        }
        return tallyQuip(state);
      }
      if (state.phase === "reveal") {
        const nextIdx = state.quipIndex + 1;
        if (nextIdx < state.quipPrompts.length) {
          return { ...state, quipIndex: nextIdx };
        }
        return { ...state, phase: "scoreboard" };
      }
      return state;
    }

    default:
      return state;
  }
}

function tallyQuip(state: State): State {
  const counts: Record<string, number> = {};
  joinedIds(state).forEach((id) => (counts[id] = 0));
  state.quipPrompts.forEach((q) => {
    const promptVotes = state.quipVotes[q.id] ?? {};
    Object.values(promptVotes).forEach((ownerId) => {
      if (counts[ownerId] != null) counts[ownerId] += 1;
    });
  });
  const players: Record<string, Player> = {};
  const lastPoints: Record<string, number> = {};
  Object.values(state.players).forEach((p) => {
    const pts = counts[p.id] * POINTS_PER_VOTE;
    lastPoints[p.id] = pts;
    players[p.id] = { ...p, score: p.score + pts };
  });
  return {
    ...state,
    players,
    lastPoints,
    phase: "reveal",
    quipIndex: 0,
    phaseDeadline: null,
    _counts: counts
  };
}

function tally(state: State): State {
  const counts: Record<string, number> = {};
  joinedIds(state).forEach((id) => (counts[id] = 0));
  Object.values(state.votes).forEach((ownerId) => {
    if (counts[ownerId] != null) counts[ownerId] += 1;
  });
  const players: Record<string, Player> = {};
  const lastPoints: Record<string, number> = {};
  Object.values(state.players).forEach((p) => {
    const pts = counts[p.id] * POINTS_PER_VOTE;
    lastPoints[p.id] = pts;
    players[p.id] = { ...p, score: p.score + pts };
  });
  const order = Object.keys(state.answers).sort((a, b) => counts[a] - counts[b]);
  return {
    ...state,
    players,
    lastPoints,
    revealOrder: order,
    revealIndex: 0,
    phase: "reveal",
    phaseDeadline: null,
    _counts: counts
  };
}
