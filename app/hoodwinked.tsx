"use client";

import React, { useReducer, useState, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { usePartySocket } from "partysocket/react";
import {
  ALL_MODES,
  FEUD_GUESS_SECONDS,
  PICTURE_GUESS_SECONDS,
  POINTS_PER_VOTE,
  TRIVIA_ANSWER_SECONDS,
  VOTING_SECONDS,
  WHEEL_GUESS_SECONDS,
  WHEEL_LETTER_BUDGET,
  feudAnswerPoints,
  WRITING_SECONDS,
  joinedIds,
  makeInitialState,
  makeRoomCode,
  matchesAnswer,
  normalizeAvatarId,
  reducer,
  requiredPlayersForMode,
  wheelCanGuessLetter,
  wheelLettersSpent,
  type Action,
  type FeudAnswer,
  type Mode,
  type Phase,
  type Player,
  type State
} from "@/lib/engine";
import type { HostAccess } from "@/lib/host-access";
import { hapticReveal, hapticWin } from "./solo/haptics";
import WelcomeIntro from "./WelcomeIntro";

/* ============================================================================
   HOODWINKED — Fool the room. Win the night.
   ----------------------------------------------------------------------------
   Single big client component. The pure (state, action) => state reducer lives
   in lib/engine.ts and is shared with the PartyKit server in party/hoodwinked.ts
   so the same game logic runs in both places.

   This component has three modes, picked by URL params:
     /            → ParlorLanding ("Start a room" button)
     /?local=1    → LocalParlor (single-screen prototype with fake phones)
     /?room=XYZ   → MultiplayerParlor (WebSocket transport via PartyKit)
   ========================================================================== */

const BOT_ANSWERS = [
  "a goose, somehow", "tax season", "the smaller spoon", "regret",
  "Brian from accounting", "a damp sock", "vibes", "the third option",
  "an unscheduled nap", "louder", "Tuesday's revenge", "a haunted minivan"
];

/* ---- PALETTE ------------------------------------------------------------- */
const C = {
  bg: "#1f3320",
  bgDeep: "#13201a",
  surface: "#2d4a2d",
  surface2: "#3c5e3c",
  line: "#557555",
  gold: "#FFC15E",
  goldDim: "#C9923C",
  coral: "#FF7461",
  mint: "#A6E27A",
  cream: "#FBF3E4",
  creamDim: "#B9C3B0"
};

const HEAVY_TEXT_SHADOW = "0 8px 18px rgba(0,0,0,.72), 0 14px 34px rgba(0,0,0,.58), 0 0 10px rgba(0,0,0,.68)";

const PLAY_URL = "playhoodwinked.com";
// Surfaced from package.json via next.config.ts -> env.NEXT_PUBLIC_APP_VERSION.
// Fallback "0.0.0" only protects SSR if the env var is missing at build time.
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

const AVATAR_FILES = [
  "01-victoria.webp",
  "02-edgar.webp",
  "03-bram.webp",
  "04-oscar.webp",
  "05-clara.webp",
  "06-felix.webp",
  "07-victor.webp",
  "08-violet.webp",
  "09-milo.webp",
  "10-agatha.webp",
  "11-lucian.webp",
  "12-sabine.webp",
  "13-helena.webp",
  "14-rufus.webp",
  "15-gideon.webp",
  "16-raven.webp",
  "17-silas.webp",
  "18-ivy.webp",
  "19-atlas.webp",
  "20-selene.webp",
  "21-bianca.webp",
  "22-basil.webp",
  "23-daisy.webp",
  "24-jasper.webp",
  "25-ophelia.webp",
  "26-theo.webp",
  "27-miles.webp",
  "28-eleanor.webp",
  "29-malcolm.webp",
  "30-andre.webp",
  "31-calvin.webp",
  "32-darius.webp",
  "33-marcus.webp",
  "34-isaiah.webp",
  "35-khalil.webp",
  "36-zane.webp",
  "37-kwame.webp",
  "38-lionel.webp",
  "39-devon.webp",
  "40-nolan.webp",
  "41-grant.webp",
  "42-ellis.webp",
  "43-terrence.webp",
  "44-jordan.webp",
  "45-cole.webp",
  "46-nico.webp",
  "47-solomon.webp",
  "48-asher.webp",
  "49-leon.webp",
  "50-damon.webp",
  "51-emmett.webp",
  "52-jaylen.webp",
  "53-winston.webp",
  "54-curtis.webp",
  "55-bryce.webp",
  "56-roman.webp",
  "57-yumi.webp",
  "58-samir.webp",
  "59-rafael.webp",
  "60-arjun.webp",
  "61-mei.webp",
  "62-omar.webp",
  "63-maya.webp",
  "64-nadia.webp",
  "65-aisha.webp",
  "66-hiro.webp",
  "67-kenji.webp",
  "68-diego.webp",
  "69-amara.webp",
  "70-sophia.webp",
  "71-lin.webp",
  "72-raj.webp",
  "73-akira.webp",
  "74-mateo.webp",
  "75-lina.webp",
  "76-carlos.webp",
  "77-anton.webp",
  "78-haruto.webp",
  "79-reyes.webp",
  "80-nia.webp",
  "81-hana.webp",
  "82-amir.webp",
  "83-marco.webp",
  "84-leila.webp",
  "icon-001.webp",
  "icon-003.webp",
  "icon-006.webp",
  "icon-008.webp",
  "icon-011.webp",
  "icon-015.webp",
  "icon-016.webp",
  "icon-017.webp",
  "icon-021.webp",
  "icon-023.webp",
  "icon-026.webp",
  "icon-027.webp"
] as const;

const AVATAR_DEAL_SIZE = 9;

type AvatarOption = {
  id: string;
  label: string;
  src: string;
};

function toAvatarLabel(file: string): string {
  const base = file.replace(/\.(webp|png|jpg|jpeg)$/i, "").replace(/^\d+-/, "").replace(/^icon-/, "Mystery ");
  return base
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const AVATAR_OPTIONS: AvatarOption[] = AVATAR_FILES.map((file) => ({
  id: file.replace(/\.(webp|png|jpg|jpeg)$/i, ""),
  label: toAvatarLabel(file),
  src: `/avatars/${file}`
}));

function initialAvatarDeal(selectedId?: string): AvatarOption[] {
  const selected = AVATAR_OPTIONS.find((option) => option.id === selectedId);
  const deal = AVATAR_OPTIONS
    .filter((option) => option.id !== selected?.id)
    .slice(0, selected ? AVATAR_DEAL_SIZE - 1 : AVATAR_DEAL_SIZE);
  return selected ? [selected, ...deal] : deal;
}

function dealAvatars(selectedId?: string): AvatarOption[] {
  const selected = AVATAR_OPTIONS.find((option) => option.id === selectedId);
  const pool = AVATAR_OPTIONS.filter((option) => option.id !== selected?.id);

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const deal = pool.slice(0, selected ? AVATAR_DEAL_SIZE - 1 : AVATAR_DEAL_SIZE);
  return selected ? [selected, ...deal] : deal;
}

/* ---- MODE INFO ----------------------------------------------------------- */
const MODE_INFO: Record<Mode, { label: string; code: string; blurb: string; min: number; icon: string }> = {
  classic: {
    label: "The Setup",
    code: "01",
    blurb: "Everyone answers the same prompt. Vote for your favorite.",
    min: 2,
    icon: "/mode-icons/the-setup.webp"
  },
  quiplash: {
    label: "Two-Faced",
    code: "02",
    blurb: "Each prompt is given to two players. Everyone else votes between the answers.",
    min: 3,
    icon: "/mode-icons/two-faced.webp"
  },
  trivia: {
    label: "The Score",
    code: "03",
    blurb: "Tap the correct multiple-choice answer. Faster = more points.",
    min: 2,
    icon: "/mode-icons/the-score.webp"
  },
  picture: {
    label: "Now You See Me",
    code: "04",
    blurb: "Guess the image as it reveals. First correct guess wins.",
    min: 2,
    icon: "/mode-icons/now-you-see-me.webp"
  },
  wheel: {
    label: "Letter Heist",
    code: "05",
    blurb: "Guess letters to reveal the puzzle, then solve it for bonus points.",
    min: 2,
    icon: "/mode-icons/letter-heist.webp"
  },
  feud: {
    label: "The Usual Suspects",
    code: "06",
    blurb: "Guess the top survey answers. Higher-ranked answers = more points.",
    min: 2,
    icon: "/mode-icons/the-usual-suspects.webp"
  }
};

/* ---- PERSISTED NAMES ----------------------------------------------------- */
const NAMES_KEY = "parlor:names";
const AVATARS_KEY = "parlor:avatars";

function readSavedNames(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(NAMES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function readSavedName(deviceId: string): string {
  return readSavedNames()[deviceId] ?? "";
}

function saveName(deviceId: string, name: string) {
  if (typeof window === "undefined") return;
  try {
    const all = readSavedNames();
    all[deviceId] = name;
    localStorage.setItem(NAMES_KEY, JSON.stringify(all));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

function readSavedAvatars(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(AVATARS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function readSavedAvatar(deviceId: string): string {
  return normalizeAvatarId(readSavedAvatars()[deviceId]);
}

function saveAvatar(deviceId: string, avatar: string) {
  if (typeof window === "undefined") return;
  try {
    const all = readSavedAvatars();
    all[deviceId] = normalizeAvatarId(avatar);
    localStorage.setItem(AVATARS_KEY, JSON.stringify(all));
  } catch {
    // localStorage unavailable - silently ignore
  }
}

/* ---- AUDIO --------------------------------------------------------------- */
let audioCtx: AudioContext | null = null;
let audioMuted = false;
let audioVolume = 1; // 0..1 scalar applied on top of per-sound gain
let currentVoiceAudio: HTMLAudioElement | null = null;
const VOICE_FETCH_TIMEOUT_MS = 12_000;
const VOICE_FALLBACK_TIMEOUT_MS = 8_000;
const FEUD_NUMBER_ONE_ANSWER_PAUSE_MS = 1_350;

function stopFeudVoice() {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  if (!currentVoiceAudio) return;
  currentVoiceAudio.pause();
  currentVoiceAudio.src = "";
  currentVoiceAudio = null;
}

const setAudioMuted = (v: boolean) => {
  audioMuted = v;
};

const setAudioVolume = (v: number) => {
  audioVolume = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 1));
  if (currentVoiceAudio) currentVoiceAudio.volume = audioVolume;
};
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.16) {
  if (audioMuted || audioVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  const peak = gain * audioVolume;
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(peak, t0 + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function playLockSound() {
  playTone(660, 0, 0.12, "triangle");
  playTone(880, 0.07, 0.18, "triangle");
}

function playRevealSound() {
  [523, 659, 784].forEach((f) => playTone(f, 0, 0.45, "sine", 0.1));
  playTone(1046, 0.15, 0.4, "sine", 0.09);
}

function playRevealTick() {
  playTone(1568, 0, 0.09, "triangle", 0.08);
  playTone(2093, 0.015, 0.12, "sine", 0.045);
  playTone(3136, 0.035, 0.08, "sine", 0.025);
}

function speakBrowserVoice(text: string, onDone: () => void) {
  const finishOnce = (() => {
    let done = false;
    return () => {
      if (done) return;
      done = true;
      window.setTimeout(onDone, 260);
    };
  })();

  if (audioMuted || audioVolume <= 0 || typeof window === "undefined" || !("speechSynthesis" in window)) {
    window.setTimeout(onDone, 650);
    return;
  }
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 0.9;
    utterance.volume = 0.95 * audioVolume;
    const fallbackTimer = window.setTimeout(finishOnce, Math.max(VOICE_FALLBACK_TIMEOUT_MS, text.length * 65));
    const finish = () => {
      window.clearTimeout(fallbackTimer);
      finishOnce();
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    window.setTimeout(onDone, 650);
  }
}

async function speakFeudAnswer(text: string, onDone: () => void) {
  if (audioMuted || typeof window === "undefined") {
    window.setTimeout(onDone, 650);
    return;
  }

  let timeoutId: number | null = null;
  try {
    stopFeudVoice();
    const controller = new AbortController();
    timeoutId = window.setTimeout(() => controller.abort(), VOICE_FETCH_TIMEOUT_MS);
    const response = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });
    if (timeoutId != null) window.clearTimeout(timeoutId);
    if (!response.ok) throw new Error("Voice API unavailable");

    const blob = await response.blob();
    const src = URL.createObjectURL(blob);
    const audio = new Audio(src);
    audio.volume = audioVolume;
    currentVoiceAudio = audio;
    const finishOnce = (() => {
      let done = false;
      return () => {
        if (done) return;
        done = true;
        if (currentVoiceAudio === audio) currentVoiceAudio = null;
        URL.revokeObjectURL(src);
        window.setTimeout(onDone, 160);
      };
    })();
    const playbackTimer = window.setTimeout(finishOnce, Math.max(VOICE_FALLBACK_TIMEOUT_MS, text.length * 75));
    const finish = () => {
      window.clearTimeout(playbackTimer);
      finishOnce();
    };
    audio.onended = finish;
    audio.onerror = finish;
    await audio.play();
  } catch (error) {
    if (timeoutId != null) window.clearTimeout(timeoutId);
    if (process.env.NODE_ENV !== "production") console.warn("Feud voice fallback:", error);
    speakBrowserVoice(text, onDone);
  }
}

function playWinSound() {
  const arp = [523, 659, 784, 1046];
  arp.forEach((f, i) => playTone(f, i * 0.09, 0.4, "triangle", 0.13));
  [523, 659, 784, 1046].forEach((f) => playTone(f, 0.4, 1.1, "sine", 0.06));
}

/* ---- THE REDUCER moved to lib/parlor/engine.ts so the PartyKit server can share it ---- */

/* ============================================================================
   PRESENTATION
   ========================================================================== */

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Inter:wght@400;500;600;700&display=swap');
.parlor-root *{box-sizing:border-box;}
.parlor-root .disp{font-family:'Bricolage Grotesque',system-ui,sans-serif;}
.parlor-root .body{font-family:'Inter',system-ui,sans-serif;}
.parlor-root .flex{display:flex;}
.parlor-root .flex-col{flex-direction:column;}
.parlor-root .flex-wrap{flex-wrap:wrap;}
.parlor-root .items-center{align-items:center;}
.parlor-root .justify-between{justify-content:space-between;}
.parlor-root .justify-center{justify-content:center;}
@keyframes parlor-twinkle{0%,100%{opacity:.35;}50%{opacity:1;}}
@keyframes parlor-popin{0%{transform:scale(.85);opacity:0;}100%{transform:scale(1);opacity:1;}}
@keyframes parlor-x-flash{0%{opacity:0;filter:drop-shadow(0 16px 28px rgba(0,0,0,.65)) brightness(1.4);}100%{opacity:1;filter:drop-shadow(0 16px 28px rgba(0,0,0,.65)) brightness(1);}}
@keyframes parlor-fadeup{0%{transform:translateY(10px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes parlor-glow{0%,100%{box-shadow:0 0 0 0 rgba(255,193,94,0);}50%{box-shadow:0 0 22px 2px rgba(255,193,94,.45);}}
@keyframes parlor-fall{0%{transform:translate3d(0,-12vh,0) rotate(0deg);opacity:0;}10%{opacity:1;}100%{transform:translate3d(var(--dx,0),110vh,0) rotate(var(--rot,540deg));opacity:1;}}
@keyframes parlor-stage-drop{0%{transform:translateY(-60px) scale(.7);letter-spacing:14px;filter:blur(6px);opacity:0;}55%{transform:translateY(8px) scale(1.06);letter-spacing:0;filter:blur(0);opacity:1;}75%{transform:translateY(-4px) scale(.99);}100%{transform:translateY(0) scale(1);opacity:1;}}
@keyframes parlor-pin-in{0%{transform:translateY(12px) rotate(calc(var(--rot,0deg) - 7deg)) scale(.92);opacity:0;}68%{transform:translateY(-2px) rotate(calc(var(--rot,0deg) + 2deg)) scale(1.02);opacity:1;}100%{transform:translateY(0) rotate(var(--rot,0deg)) scale(1);opacity:1;}}
@keyframes parlor-pill-shine{0%{transform:translateX(-140%) skewX(-18deg);opacity:0;}18%{opacity:.65;}48%{opacity:.32;}100%{transform:translateX(190%) skewX(-18deg);opacity:0;}}
@keyframes parlor-letter-turn-left{0%{transform:perspective(700px) rotateY(-92deg);opacity:.28;filter:brightness(.72);}58%{transform:perspective(700px) rotateY(9deg);opacity:1;filter:brightness(1.1);}100%{transform:perspective(700px) rotateY(0deg);opacity:1;filter:brightness(1);}}
.parlor-root .stagedrop{animation:parlor-stage-drop .9s cubic-bezier(.22,1.18,.36,1) both;}
.parlor-root .letter-flip{animation:parlor-letter-turn-left 1.03s cubic-bezier(.2,.8,.2,1) both;transform-origin:left center;backface-visibility:hidden;}
@keyframes parlor-typing{0%,80%,100%{transform:translateY(0);opacity:.4;}40%{transform:translateY(-3px);opacity:1;}}
.parlor-root .typing-dot{display:inline-block;width:4px;height:4px;border-radius:999px;margin:0 1px;animation:parlor-typing 1s infinite ease-in-out;}
@keyframes parlor-streak{0%{transform:scale(1);text-shadow:0 0 0 transparent;}30%{transform:scale(1.22);text-shadow:0 0 22px var(--glow,#FFC15E);}70%{transform:scale(1.22);text-shadow:0 0 22px var(--glow,#FFC15E);}100%{transform:scale(1);text-shadow:0 0 0 transparent;}}
.parlor-root .streak{animation:parlor-streak 1.8s ease-out 1 both;display:inline-block;}
.parlor-root .suspect-pins{display:block;}
.parlor-root .suspect-card{animation:parlor-pin-in .55s cubic-bezier(.22,1.18,.36,1) both;transform-origin:50% 0;}
.parlor-root .mode-chip:hover{transform:scale(1.12) !important;z-index:6 !important;box-shadow:0 22px 44px rgba(0,0,0,.42),0 0 0 1px rgba(255,193,94,.28) !important;border-color:${C.gold} !important;}
.parlor-root .waiting-pill{position:relative;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;border-radius:999px;padding:8px 20px;background:rgba(10,19,14,.42);border:1px solid rgba(255,193,94,.22);box-shadow:0 14px 32px rgba(0,0,0,.3), inset 0 0 0 1px rgba(255,255,255,.05);}
.parlor-root .waiting-pill::after{content:"";position:absolute;inset:-20% auto -20% -40%;width:45%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);animation:parlor-pill-shine 2.9s ease-in-out infinite;}
.parlor-root .landing-suspect-pins{display:block;}
@media (max-width: 760px) {
  .parlor-root .board-header { flex-wrap: wrap; gap: 8px; row-gap: 10px; }
  .parlor-root .board-header img { max-width: min(96px, 22vw) !important; height: auto !important; }
}
@media (max-width: 640px) {
  .parlor-root .phones-row { display: none !important; }
  .parlor-root .board-inner { padding: 8px 4px !important; }
  .parlor-root .board-wrap { padding: 12px !important; border-radius: 16px !important; }
  .parlor-root .suspect-pins { display: none !important; }
  .parlor-root .landing-suspect-pins { display: none !important; }
  .parlor-root .header-room-block { display: none !important; }
  .parlor-root .header-mute-desktop { display: none !important; }
  .parlor-root .header-mute-mobile { display: inline-flex !important; }
  .parlor-root .header-title { font-size: clamp(18px, 5.4vw, 22px) !important; letter-spacing: .5px !important; }
  .parlor-root .header-tagline { font-size: 9px !important; letter-spacing: 1.4px !important; line-height: 1.25 !important; }
  .parlor-root .mode-chip-code { display: none !important; }
  .parlor-root .mode-chip-meta { justify-content: center !important; font-size: 9px !important; padding: 5px 2px 1px !important; }
  .parlor-root .lobby-entry-line { font-size: 12px !important; }
  .parlor-root .lobby-room-code { font-size: clamp(44px, 14vw, 84px) !important; letter-spacing: clamp(3px, 1.2vw, 6px) !important; }
  .parlor-root .lobby-mode-blurb { font-size: 13px !important; line-height: 1.3 !important; margin: 0 auto 12px !important; padding: 0 4px !important; }
  .parlor-root .lobby-mode-grid { gap: 8px !important; margin: 0 auto 14px !important; }
  .parlor-root .lobby-waiting-row { margin: 14px auto !important; }
  .parlor-root .lobby-waiting-row .waiting-pill { font-size: 14px !important; padding: 6px 14px !important; }
  .parlor-root .lobby-section { padding: 10px 0 4px !important; }
  .parlor-root .demo-add-fake-row { display: flex !important; }
}
.parlor-root .header-mute-mobile { display: none; }
.parlor-root .demo-add-fake-row { display: none; }
.parlor-root .bulb{animation:parlor-twinkle 2.4s ease-in-out infinite;}
.parlor-root .popin{animation:parlor-popin .32s cubic-bezier(.34,1.56,.64,1) both;}
.parlor-root .fadeup{animation:parlor-fadeup .35s ease both;}
.parlor-root .glow{animation:parlor-glow 2.2s ease-in-out infinite;}
@media (prefers-reduced-motion: reduce){
  .parlor-root .bulb,.parlor-root .popin,.parlor-root .fadeup,.parlor-root .glow,.parlor-root .stagedrop,.parlor-root .typing-dot,.parlor-root .streak,.parlor-root .suspect-card,.parlor-root .waiting-pill::after,.parlor-root .letter-flip{animation:none !important;}
}
`;

function Confetti({ count = 90, palette }: { count?: number; palette: string[] }) {
  const paletteKey = palette.join(",");
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const colors = paletteKey.split(",").filter(Boolean);
    // Client-only Math.random — runs once per palette change to avoid SSR hydration mismatch.
    const base = {
      colors,
      disableForReducedMotion: true,
      scalar: 1.05,
      ticks: 240,
      zIndex: 80
    };
    confetti({
      ...base,
      particleCount: Math.round(count * 0.45),
      spread: 72,
      startVelocity: 58,
      origin: { x: 0.14, y: 0.72 },
      angle: 48
    });
    window.setTimeout(() => {
      confetti({
        ...base,
        particleCount: Math.round(count * 0.45),
        spread: 72,
        startVelocity: 58,
        origin: { x: 0.86, y: 0.72 },
        angle: 132
      });
    }, 90);
    window.setTimeout(() => {
      confetti({
        ...base,
        particleCount: Math.round(count * 0.35),
        spread: 110,
        startVelocity: 38,
        origin: { x: 0.5, y: 0.34 }
      });
    }, 210);
    window.setTimeout(() => {
      confetti({
        ...base,
        particleCount: Math.round(count * 0.7),
        spread: 130,
        startVelocity: 18,
        gravity: 0.85,
        scalar: 0.78,
        origin: { x: 0.5, y: -0.08 }
      });
    }, 520);
  }, [count, paletteKey]);
  return null;
}

function Bulbs({ count = 14 }: { count?: number }) {
  return (
    <div className="flex justify-between" style={{ padding: "0 4px" }} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="bulb"
          style={{
            width: 9,
            height: 9,
            borderRadius: 999,
            background: C.gold,
            boxShadow: `0 0 8px ${C.gold}`,
            animationDelay: `${(i % 5) * 0.28}s`
          }}
        />
      ))}
    </div>
  );
}

function AvatarBadge({
  avatar,
  color,
  size = 28,
  selected = false
}: {
  avatar?: string;
  color: string;
  size?: number;
  selected?: boolean;
}) {
  const avatarId = normalizeAvatarId(avatar);
  const option = AVATAR_OPTIONS.find((a) => a.id === avatarId) ?? AVATAR_OPTIONS[0];
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: C.bgDeep,
        border: `2px solid ${selected ? C.gold : `${color}99`}`,
        boxShadow: selected ? `0 0 0 2px ${C.gold}55, 0 0 18px ${color}66` : `0 0 10px ${color}44`,
        overflow: "hidden"
      }}
      title={option.label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={option.src}
        alt=""
        width={size}
        height={size}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block"
        }}
      />
    </span>
  );
}

type SuspectPin = {
  option: AvatarOption;
  label: string;
  left: number;
  top: number;
  rotate: number;
  string: { angle: number; length: number; offset: number; color: string } | null;
  size: number;
  opacity: number;
  delay: number;
  zIndex: number;
};

type SuspectPinVariant = "board" | "landing";

const CASE_BOARD_LABELS = [
  "Suspect",
  "Bystander",
  "Alibi",
  "Witness",
  "Person of Interest",
  "Last Seen",
  "Lookout",
  "Inside Source",
  "Unknown",
  "Cleared?",
  "Red Herring",
  "Loose End",
  "Accomplice?",
  "Motive?",
  "Has Intel",
  "Question Again"
];

const CASE_BOARD_NAMES = [
  "Marlow",
  "Vega",
  "Knox",
  "Quinn",
  "Sloane",
  "Rook",
  "Vale",
  "Cross",
  "Mercer",
  "Nyx",
  "Hale",
  "Stone",
  "Blair",
  "Wren",
  "Fox",
  "Ash"
];

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let value = seed || 1;
  return () => {
    value = Math.imul(value ^ (value >>> 15), 1 | value);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function getSuspectPinZones(phase: Phase, variant: SuspectPinVariant) {
  if (variant === "landing") {
    return [
      { left: 4, top: 12, size: 158, zIndex: 2 },
      { left: 14, top: 29, size: 146, zIndex: 3 },
      { left: 84, top: 13, size: 152, zIndex: 2 },
      { left: 92, top: 30, size: 142, zIndex: 3 },
      { left: 7, top: 58, size: 148, zIndex: 2 },
      { left: 19, top: 75, size: 136, zIndex: 3 },
      { left: 80, top: 59, size: 150, zIndex: 2 },
      { left: 92, top: 76, size: 138, zIndex: 3 },
      { left: 30, top: 9, size: 124, zIndex: 1 },
      { left: 66, top: 10, size: 124, zIndex: 1 },
      { left: 35, top: 82, size: 118, zIndex: 1 },
      { left: 62, top: 82, size: 118, zIndex: 1 },
      { left: 2, top: 40, size: 122, zIndex: 1 },
      { left: 96, top: 43, size: 122, zIndex: 1 }
    ];
  }

  if (phase === "lobby") {
    return [
      { left: 9, top: 26, size: 172, zIndex: 2 },
      { left: 88, top: 25, size: 176, zIndex: 2 },
      { left: 7, top: 63, size: 168, zIndex: 2 },
      { left: 17, top: 75, size: 156, zIndex: 3 },
      { left: 84, top: 64, size: 172, zIndex: 2 },
      { left: 93, top: 77, size: 156, zIndex: 3 },
      { left: 18, top: 15, size: 142, zIndex: 1 },
      { left: 78, top: 15, size: 142, zIndex: 1 }
    ];
  }

  if (phase === "scoreboard" || phase === "gameover") {
    return [
      { left: 5, top: 16, size: 146, zIndex: 2 },
      { left: 94, top: 17, size: 150, zIndex: 2 },
      { left: 9, top: 68, size: 158, zIndex: 2 },
      { left: 19, top: 78, size: 140, zIndex: 3 },
      { left: 80, top: 67, size: 158, zIndex: 2 },
      { left: 92, top: 78, size: 140, zIndex: 3 },
      { left: 5, top: 42, size: 128, zIndex: 1 },
      { left: 95, top: 43, size: 128, zIndex: 1 }
    ];
  }

  return [
    { left: 6, top: 18, size: 132, zIndex: 1 },
    { left: 94, top: 19, size: 134, zIndex: 1 },
    { left: 8, top: 64, size: 150, zIndex: 2 },
    { left: 18, top: 76, size: 138, zIndex: 3 },
    { left: 82, top: 64, size: 150, zIndex: 2 },
    { left: 92, top: 77, size: 138, zIndex: 3 },
    { left: 4, top: 43, size: 120, zIndex: 1 },
    { left: 96, top: 44, size: 120, zIndex: 1 }
  ];
}

function buildSuspectPins(seedKey: string, phase: Phase, variant: SuspectPinVariant): SuspectPin[] {
  const rand = seededRandom(hashString(seedKey));
  const zones = getSuspectPinZones(phase, variant);
  const opacityBase = variant === "landing" ? 0.27 : phase === "lobby" ? 0.22 : 0.17;
  const opacityJitter = variant === "landing" ? 0.1 : 0.07;
  const pool = [...AVATAR_OPTIONS];

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return zones.map((zone, i) => {
    const hasString = rand() > (variant === "landing" ? 0.72 : 0.78);
    return {
      option: pool[i % pool.length],
      label: `${CASE_BOARD_LABELS[Math.floor(rand() * CASE_BOARD_LABELS.length)]}: ${CASE_BOARD_NAMES[Math.floor(rand() * CASE_BOARD_NAMES.length)]}`,
      left: zone.left + (rand() * 5 - 2.5),
      top: zone.top + (rand() * 5 - 2.5),
      rotate: rand() * 34 - 17,
      string: hasString
        ? {
            angle: rand() * 86 - 43,
            length: zone.size * (0.42 + rand() * 0.42),
            offset: rand() * 16 - 8,
            color: rand() > 0.35 ? "#b3221f" : "#d8b35b"
          }
        : null,
      size: zone.size + Math.round(rand() * 10 - 5),
      opacity: opacityBase + rand() * opacityJitter,
      delay: i * 55,
      zIndex: zone.zIndex
    };
  });
}

function SuspectPins({ state, variant = "board" }: { state: State; variant?: SuspectPinVariant }) {
  const seedKey = `${variant}-${state.roomCode}-${state.mode}-${state.phase}-${state.round}-${Object.keys(state.players).length}`;
  const pins = useMemo(() => buildSuspectPins(seedKey, state.phase, variant), [seedKey, state.phase, variant]);

  return (
    <div className="suspect-pins" aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {pins.map((pin, i) => (
        <div
          key={`${pin.option.id}-${i}-${seedKey}`}
          style={{
            position: "absolute",
            left: `${pin.left}%`,
            top: `${pin.top}%`,
            width: pin.size,
            opacity: pin.opacity,
            zIndex: pin.zIndex
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bluepin.webp"
            alt=""
            width={20}
            height={20}
            style={{
              position: "absolute",
              left: "50%",
              top: -10,
              width: 20,
              height: 20,
              transform: "translateX(-50%) rotate(-12deg)",
              objectFit: "contain",
              filter: "drop-shadow(0 2px 3px rgba(0,0,0,.45))",
              zIndex: 2
            }}
          />
          {pin.string && (
            <span
              style={{
                position: "absolute",
                left: `calc(50% + ${pin.string.offset}px)`,
                top: 0,
                width: pin.string.length,
                height: 2,
                background: pin.string.color,
                borderRadius: 999,
                boxShadow: "0 1px 2px rgba(0,0,0,.35)",
                opacity: 0.72,
                transform: `rotate(${pin.string.angle}deg)`,
                transformOrigin: "0 50%",
                zIndex: 1
              }}
            />
          )}
          <div
            className="suspect-card"
            style={{
              position: "relative",
              width: "100%",
              padding: "6px 6px 13px",
              background: "linear-gradient(180deg, rgba(251,243,228,.92), rgba(218,204,174,.86))",
              border: "1px solid rgba(42,28,16,.28)",
              borderRadius: 4,
              boxShadow: "0 12px 28px rgba(0,0,0,.32)",
              transform: `rotate(${pin.rotate}deg)`,
              ["--rot" as string]: `${pin.rotate}deg`,
              animationDelay: `${pin.delay}ms`
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pin.option.src}
              alt=""
              width={pin.size}
              height={pin.size}
              draggable={false}
              style={{
                display: "block",
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                borderRadius: 2,
                filter: "sepia(.16) contrast(.98) saturate(.86)"
              }}
            />
            <div
              className="body"
              style={{
                position: "absolute",
                left: 7,
                right: 7,
                bottom: 3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "#2b2118",
                fontSize: 7,
                fontWeight: 800,
                letterSpacing: 0.8,
                textAlign: "center",
                textTransform: "uppercase"
              }}
            >
              {pin.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LandingSuspectPins() {
  const pins = useMemo(() => buildSuspectPins("landing-home", "lobby", "landing"), []);
  return (
    <div className="landing-suspect-pins" aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {pins.map((pin, i) => (
        <div
          key={`${pin.option.id}-landing-${i}`}
          style={{
            position: "absolute",
            left: `${pin.left}%`,
            top: `${pin.top}%`,
            width: pin.size,
            opacity: pin.opacity,
            transform: "translate(-50%, -50%)",
            zIndex: pin.zIndex
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bluepin.webp"
            alt=""
            width={24}
            height={24}
            style={{
              position: "absolute",
              left: "50%",
              top: -12,
              width: 24,
              height: 24,
              transform: "translateX(-50%) rotate(-12deg)",
              objectFit: "contain",
              filter: "drop-shadow(0 2px 3px rgba(0,0,0,.45))",
              zIndex: 2
            }}
          />
          {pin.string && (
            <span
              style={{
                position: "absolute",
                left: `calc(50% + ${pin.string.offset}px)`,
                top: 0,
                width: pin.string.length,
                height: 2,
                background: pin.string.color,
                borderRadius: 999,
                boxShadow: "0 1px 2px rgba(0,0,0,.35)",
                opacity: 0.72,
                transform: `rotate(${pin.string.angle}deg)`,
                transformOrigin: "0 50%",
                zIndex: 1
              }}
            />
          )}
          <div
            className="suspect-card"
            style={{
              position: "relative",
              width: "100%",
              padding: "7px 7px 16px",
              background: "linear-gradient(180deg, rgba(251,243,228,.94), rgba(218,204,174,.88))",
              border: "1px solid rgba(42,28,16,.28)",
              borderRadius: 4,
              boxShadow: "0 18px 38px rgba(0,0,0,.34)",
              transform: `rotate(${pin.rotate}deg)`,
              ["--rot" as string]: `${pin.rotate}deg`,
              animationDelay: `${pin.delay}ms`
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pin.option.src}
              alt=""
              width={pin.size}
              height={pin.size}
              draggable={false}
              style={{
                display: "block",
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                borderRadius: 2,
                filter: "sepia(.16) contrast(.98) saturate(.86)"
              }}
            />
            <div
              className="body"
              style={{
                position: "absolute",
                left: 8,
                right: 8,
                bottom: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "#2b2118",
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: 0.8,
                textAlign: "center",
                textTransform: "uppercase"
              }}
            >
              {pin.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LetterHeistBoard({
  text,
  revealed,
  solved = false
}: {
  text: string;
  revealed: Set<string>;
  solved?: boolean;
}) {
  const words = text.split(" ");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px 20px",
        width: "fit-content",
        maxWidth: "calc(100% - 24px)",
        margin: "0 auto 18px",
        padding: "14px",
        borderRadius: 12,
        background: `linear-gradient(180deg, ${C.bgDeep} 0%, rgba(19,32,26,.82) 100%)`,
        border: `1px solid ${C.goldDim}88`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.05), 0 18px 34px rgba(0,0,0,.32)",
        perspective: 900
      }}
    >
      {words.map((word, wordIndex) => (
        <div
          key={`${word}-${wordIndex}`}
          style={{
            display: "flex",
            gap: 4,
            padding: "2px 0"
          }}
        >
          {word.split("").map((ch, i) => {
            const visible = solved || revealed.has(ch.toUpperCase());
            return (
              <span
                key={`${wordIndex}-${i}-${ch}`}
                className={visible ? "letter-flip" : undefined}
                style={{
                  width: "clamp(26px, 4.1vw, 54px)",
                  height: "clamp(34px, 5vw, 68px)",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 4,
                  border: `2px solid ${visible ? "#fbfbf4" : "rgba(251,243,228,.72)"}`,
                  background: visible
                    ? "linear-gradient(180deg, #fffef8 0%, #e8e3d4 100%)"
                    : "linear-gradient(180deg, #f7f2e8 0%, #d8cfbc 100%)",
                  color: visible ? "#202020" : "transparent",
                  fontSize: "clamp(20px, 3.3vw, 44px)",
                  fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontWeight: 900,
                  letterSpacing: 0,
                  lineHeight: 1,
                  textTransform: "uppercase",
                  boxShadow: visible
                    ? "inset 0 -4px 0 rgba(0,0,0,.13), 0 0 18px rgba(255,255,255,.22)"
                    : "inset 0 -4px 0 rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.08)",
                  textShadow: visible ? "0 1px 0 rgba(255,255,255,.65)" : "none"
                }}
              >
                {visible ? ch : ch}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ModeBlurb({ text }: { text: string }) {
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map((part) => part.trim()) ?? [text];

  return (
    <>
      {sentences.map((sentence, i) => (
        <React.Fragment key={`${sentence}-${i}`}>
          {i > 0 && <br />}
          {sentence}
        </React.Fragment>
      ))}
    </>
  );
}

function getFeudFirstHits(state: State) {
  const hits: Record<number, { player: Player; points: number; at: number }> = {};
  const q = state.feud.questions[state.round - 1];
  if (!q) return hits;
  const allMatches: { pid: string; at: number; idx: number }[] = [];
  Object.entries(state.feud.guesses).forEach(([pid, arr]) => {
    arr.forEach((g) => {
      if (g.matchIndex != null) allMatches.push({ pid, at: g.at, idx: g.matchIndex });
    });
  });
  allMatches.sort((a, b) => a.at - b.at);
  allMatches.forEach((m) => {
    if (hits[m.idx]) return;
    const player = state.players[m.pid];
    if (!player) return;
    hits[m.idx] = {
      player,
      points: feudAnswerPoints(q, m.idx),
      at: m.at
    };
  });
  return hits;
}

function FeudBoardRow({
  rank,
  answer,
  points,
  hit,
  revealed,
  delay = 0
}: {
  rank: number;
  answer: FeudAnswer;
  points: number;
  hit?: { player: Player; points: number };
  revealed: boolean;
  delay?: number;
}) {
  return (
    <div
      className={revealed ? "popin" : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: "82px minmax(0, 1fr) 100px",
        alignItems: "center",
        minHeight: 70,
        borderRadius: 7,
        border: "2px solid rgba(245,242,232,.75)",
        background: revealed
          ? "linear-gradient(180deg, #1f65b8 0%, #0b3f86 100%)"
          : "linear-gradient(180deg, #123a6f 0%, #082a54 100%)",
        boxShadow: "inset 0 0 0 2px rgba(0,0,0,.35), 0 8px 18px rgba(0,0,0,.32)",
        overflow: "hidden",
        animationDelay: `${delay}ms`
      }}
    >
      <div
        className="disp"
        style={{
          color: C.gold,
          fontSize: 26,
          fontWeight: 900,
          textAlign: "center",
          textShadow: "0 2px 3px rgba(0,0,0,.55)"
        }}
      >
        {rank}
      </div>
      <div style={{ minWidth: 0, padding: "7px 12px", textAlign: "left" }}>
        <div
          className="disp"
          style={{
            color: revealed ? C.cream : "rgba(251,243,228,.55)",
            fontSize: "clamp(19px, 2.8vw, 38px)",
            fontWeight: 900,
            letterSpacing: revealed ? 0.5 : 6,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: revealed ? "0 2px 4px rgba(0,0,0,.65)" : "none"
          }}
        >
          {revealed ? answer.text : "-----"}
        </div>
        {hit && (
          <div className="flex items-center" style={{ gap: 7, marginTop: 4 }}>
            <AvatarBadge avatar={hit.player.avatar} color={hit.player.color} size={28} />
            <span className="body" style={{ color: C.cream, fontSize: 14, fontWeight: 800 }}>
              {hit.player.name}
            </span>
            <span className="disp" style={{ color: C.mint, fontSize: 14, fontWeight: 900 }}>
              +{hit.points}
            </span>
          </div>
        )}
      </div>
      <div
        className="disp"
        style={{
          display: "grid",
          placeItems: "center",
          height: "100%",
          borderLeft: "2px solid rgba(245,242,232,.55)",
          background: "linear-gradient(180deg, #2f7cd8 0%, #104b9b 100%)",
          color: revealed ? C.cream : C.gold,
          fontSize: 32,
          fontWeight: 900,
          textShadow: "0 2px 4px rgba(0,0,0,.6)"
        }}
      >
        {revealed ? points : hit ? hit.points : "—"}
      </div>
    </div>
  );
}

function BrandLogo({
  size = 120,
  compact = false,
  responsive = false
}: {
  size?: number;
  compact?: boolean;
  responsive?: boolean;
}) {
  return (
    // Static public asset; next/image optimization adds little for this small app shell logo.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/hwlogo.png"
      alt="Hoodwinked"
      width={size}
      height={size}
      style={{
        display: "block",
        width: responsive ? `min(${size}px, 58vw)` : size,
        height: "auto",
        objectFit: "contain",
        margin: compact ? 0 : "0 auto",
        filter: "drop-shadow(0 14px 26px rgba(0,0,0,.38))"
      }}
    />
  );
}

function GoogleGlyph({ size = 18 }: { size?: number }) {
  // Official multi-color "G" mark. Inline SVG keeps the brand asset off the
  // network and avoids cache invalidation when we redeploy.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      style={{ flex: "0 0 auto" }}
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function AudioControl({
  muted,
  onToggleMute,
  volume,
  onVolumeChange,
  className,
  iconSize = 16
}: {
  muted: boolean;
  onToggleMute: () => void;
  volume: number;
  onVolumeChange: (next: number) => void;
  className?: string;
  iconSize?: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (event: MouseEvent | TouchEvent) => {
      const node = wrapperRef.current;
      if (!node) return;
      if (event.target instanceof Node && !node.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  const pct = Math.round(volume * 100);
  const effectivelyMuted = muted || volume <= 0;

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Sound settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Sound settings"
        suppressHydrationWarning
        style={{
          background: "none",
          border: "none",
          color: effectivelyMuted ? C.creamDim : C.gold,
          cursor: "pointer",
          fontSize: iconSize,
          padding: 4,
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center"
        }}
      >
        <span suppressHydrationWarning>{effectivelyMuted ? "🔇" : "🔊"}</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Sound settings"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 60,
            minWidth: 220,
            padding: 12,
            borderRadius: 10,
            background: `linear-gradient(180deg, ${C.surface}, ${C.bgDeep})`,
            border: `1px solid ${C.line}`,
            boxShadow: "0 18px 36px rgba(0,0,0,.45)"
          }}
        >
          <div style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.2, fontSize: 10, textTransform: "uppercase", marginBottom: 8 }}>
            Sound
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={muted}
              style={{
                border: `1px solid ${muted ? C.coral : C.line}`,
                background: muted ? "rgba(207,79,69,.2)" : "rgba(9,19,14,.5)",
                color: muted ? "#ffd2ce" : C.cream,
                borderRadius: 8,
                padding: "6px 10px",
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: 1,
                cursor: "pointer"
              }}
            >
              {muted ? "Muted" : "Mute"}
            </button>
            <div style={{ color: C.creamDim, fontSize: 11, fontWeight: 800, letterSpacing: 1, marginLeft: "auto" }}>
              {pct}%
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={pct}
            onChange={(event) => onVolumeChange(Math.max(0, Math.min(100, Number(event.target.value))) / 100)}
            aria-label="Volume"
            style={{ width: "100%", accentColor: C.gold }}
          />
        </div>
      )}
    </div>
  );
}

/* ---- THE BOARD (the TV / shared screen) ---------------------------------- */
function Board({
  state,
  dispatch,
  muted,
  onToggleMute,
  volume,
  onVolumeChange,
  allowSinglePlayerStart = false
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  muted: boolean;
  onToggleMute: () => void;
  volume: number;
  onVolumeChange: (next: number) => void;
  allowSinglePlayerStart?: boolean;
}) {
  const players = Object.values(state.players);
  const submittedCount = Object.keys(state.answers).length;
  const votedCount = Object.keys(state.votes).length;

  const [now, setNow] = useState(() => Date.now());
  const expired = useRef<number | null>(null);
  useEffect(() => {
    if (!state.phaseDeadline) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.phaseDeadline]);

  useEffect(() => {
    if (!state.phaseDeadline) return;
    if (now < state.phaseDeadline) return;
    if (expired.current === state.phaseDeadline) return;
    expired.current = state.phaseDeadline;
    if (state.phase === "writing") dispatch({ type: "FORCE_VOTING" });
    else if (state.phase === "voting") dispatch({ type: "FORCE_REVEAL" });
  }, [now, state.phaseDeadline, state.phase, dispatch]);

  const phaseTotal =
    state.phase === "writing"
      ? state.mode === "trivia"
        ? TRIVIA_ANSWER_SECONDS
        : state.mode === "picture"
          ? PICTURE_GUESS_SECONDS
          : state.mode === "wheel"
            ? WHEEL_GUESS_SECONDS
            : state.mode === "feud"
              ? FEUD_GUESS_SECONDS
              : WRITING_SECONDS
      : state.phase === "voting"
        ? VOTING_SECONDS
        : 0;
  const remaining = state.phaseDeadline ? Math.max(0, state.phaseDeadline - now) : 0;
  const remainingPct = phaseTotal ? (remaining / (phaseTotal * 1000)) * 100 : 0;
  const remainingSec = Math.ceil(remaining / 1000);
  const lowTime = remaining > 0 && remaining < 10_000;

  const [introRound, setIntroRound] = useState<number | null>(null);
  const feudIntroKey = useRef<string | null>(null);
  useEffect(() => {
    if (state.phase !== "writing") return;
    // Drive a timed UI flow off the round transition; cleared by setTimeout below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIntroRound(state.round);
    const id = setTimeout(() => setIntroRound(null), 1400);
    return () => clearTimeout(id);
  }, [state.phase, state.round]);
  const introVisible = state.phase === "writing" && introRound === state.round;

  const dispatchRef = useRef(dispatch);
  useEffect(() => { dispatchRef.current = dispatch; }, [dispatch]);
  const feudQ = state.mode === "feud" ? state.feud.questions[state.round - 1] : null;
  const feudQKey = feudQ ? `${state.roomCode}-${state.round}-${feudQ.id}` : null;
  const feudPrompt = feudQ?.prompt;
  useEffect(() => {
    if (state.phase !== "writing" || state.mode !== "feud" || state.phaseDeadline) return;
    if (!feudQKey || !feudPrompt) return;
    if (feudIntroKey.current === feudQKey) return;
    feudIntroKey.current = feudQKey;
    speakFeudAnswer(`Okay... 100 people surveyed... ${feudPrompt}`, () => {
      dispatchRef.current({ type: "START_FEUD_COUNTDOWN" });
    });
    return () => stopFeudVoice();
  }, [state.phase, state.mode, state.phaseDeadline, feudQKey, feudPrompt]);

  return (
    <div
      className="board-wrap"
      style={{
        background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)`,
        border: `1px solid ${C.line}`,
        borderRadius: 22,
        padding: 28,
        boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <Bulbs />
      <SuspectPins state={state} />
      <div className="board-inner" style={{ padding: "20px 18px 12px", position: "relative", zIndex: 1 }}>
        <div className="flex items-center justify-between board-header" style={{ marginBottom: 14 }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <BrandLogo size={210} compact />
            <div>
              <div className="disp header-title" style={{ fontSize: "clamp(20px, 5.4vw, 34px)", fontWeight: 800, color: C.gold, letterSpacing: 1, textShadow: HEAVY_TEXT_SHADOW, overflowWrap: "anywhere" }}>
                HOODWINKED
              </div>
              <div className="body header-tagline" style={{ color: C.creamDim, fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", textShadow: HEAVY_TEXT_SHADOW }}>
                Fool the room. Win the night.
              </div>
            </div>
            <AudioControl
              muted={muted}
              onToggleMute={onToggleMute}
              volume={volume}
              onVolumeChange={onVolumeChange}
              className="header-mute-mobile"
              iconSize={18}
            />
          </div>
          {state.phase !== "lobby" && state.phase !== "gameover" && (
            <div
              className="flex items-center"
              style={{
                padding: 8,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                background: `${C.bgDeep}88`,
                boxShadow: "0 10px 24px rgba(0,0,0,.22)"
              }}
            >
              {/* Generated mode card includes the name, so the visible text is intentionally compact. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={MODE_INFO[state.mode].icon}
                alt={MODE_INFO[state.mode].label}
                width={64}
                height={66}
                style={{
                  width: 130,
                  height: 135,
                  objectFit: "cover",
                  borderRadius: 7,
                  border: `1px solid ${C.gold}55`,
                  display: "block"
                }}
              />
            </div>
          )}
          {state.phase !== "lobby" && state.phase !== "gameover" && (
            <div className="body" style={{ color: C.creamDim, fontSize: 16, fontWeight: 700, textShadow: HEAVY_TEXT_SHADOW }}>
              Round {state.round} / {state.totalRounds}
            </div>
          )}
          <div className="flex items-center header-room-block" style={{ gap: 10 }}>
            <AudioControl
              muted={muted}
              onToggleMute={onToggleMute}
              volume={volume}
              onVolumeChange={onVolumeChange}
              className="header-mute-desktop"
              iconSize={16}
            />
            {state.phase !== "lobby" && state.phase !== "gameover" && (
              <button
                onClick={() => {
                  if (typeof window !== "undefined" && !window.confirm("Start a new game for everyone?")) return;
                  dispatch({ type: "PLAY_AGAIN" });
                }}
                aria-label="Start a new game"
                title="Start a new game"
                style={iconBtn}
              >
                ↺
              </button>
            )}
            <div className="body" style={{ color: C.creamDim, fontSize: 15, textShadow: HEAVY_TEXT_SHADOW }}>
              Room <b style={{ color: C.cream, letterSpacing: 3 }}>{state.roomCode}</b>
            </div>
          </div>
        </div>

        {state.phaseDeadline && (state.phase === "writing" || state.phase === "voting") && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                height: 6,
                background: C.bgDeep,
                borderRadius: 999,
                overflow: "hidden",
                border: `1px solid ${C.line}`
              }}
            >
              <div
                style={{
                  width: `${remainingPct}%`,
                  height: "100%",
                  background: lowTime ? C.coral : C.gold,
                  boxShadow: lowTime ? `0 0 10px ${C.coral}` : `0 0 8px ${C.gold}66`,
                  transition: "width .25s linear"
                }}
              />
            </div>
            <div
              className="body"
              style={{
                marginTop: 4,
                textAlign: "right",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                color: lowTime ? C.coral : C.creamDim
              }}
            >
              {remainingSec}s
            </div>
          </div>
        )}

        {state.phase === "lobby" && (
          <div className="popin lobby-section" style={{ textAlign: "center", padding: "26px 0 18px" }}>
            <div className="body lobby-entry-line" style={{ color: C.creamDim, fontSize: 16, fontWeight: 800, marginBottom: 8, textShadow: HEAVY_TEXT_SHADOW }}>
              Go to <span style={{ color: C.cream, fontWeight: 800 }}>{PLAY_URL}</span> and enter code
            </div>
            <div
              className="disp lobby-room-code"
              style={{
                fontSize: "clamp(56px, 16vw, 104px)",
                fontWeight: 800,
                color: C.gold,
                letterSpacing: "clamp(4px, 1.5vw, 8px)",
                lineHeight: 1,
                textShadow: HEAVY_TEXT_SHADOW
              }}
            >
              {state.roomCode}
            </div>
            <div
              className="flex flex-wrap justify-center lobby-waiting-row"
              style={{ gap: 10, margin: "24px auto", maxWidth: 760 }}
            >
              {players.length === 0 && (
                <span className="body waiting-pill" style={{ color: C.cream, fontSize: 18, fontWeight: 900, textShadow: HEAVY_TEXT_SHADOW }}>
                  Waiting for players…
                </span>
              )}
              {players.map((p) => (
                <span
                  key={p.id}
                  className="popin"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: C.surface2,
                    border: `1px solid ${C.line}`,
                    borderRadius: 999,
                    padding: "8px 16px"
                  }}
                >
                  <AvatarBadge avatar={p.avatar} color={p.color} size={72} />
                  <span className="body" style={{ color: C.cream, fontWeight: 600 }}>
                    {p.name}
                  </span>
                </span>
              ))}
            </div>
            <div
              className="lobby-mode-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 18,
                margin: "0 auto 28px",
                maxWidth: 900,
                overflow: "visible"
              }}
            >
              {ALL_MODES.map((m) => {
                const info = MODE_INFO[m];
                const active = state.mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => dispatch({ type: "SET_MODE", mode: m })}
                    className={`disp mode-chip${active ? " active" : ""}`}
                    style={modeChip(active)}
                  >
                    {/* Generated mode card includes the name, so the visible label is for accessibility only. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={info.icon}
                      alt={info.label}
                      width={384}
                      height={400}
                      style={{
                        width: "100%",
                        aspectRatio: "24 / 25",
                        height: "auto",
                        display: "block",
                        objectFit: "cover",
                        borderRadius: 7,
                        border: `1px solid ${active ? C.gold : "rgba(251,243,228,.14)"}`,
                        boxShadow: active ? `0 0 0 2px ${C.gold}55, 0 14px 26px rgba(0,0,0,.36)` : "0 8px 18px rgba(0,0,0,.22)"
                      }}
                    />
                    <div
                      className="body mode-chip-meta"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        width: "100%",
                        color: active ? C.gold : C.creamDim,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: 1.1,
                        padding: "8px 2px 2px"
                      }}
                    >
                      <span className="mode-chip-code">{info.code}</span>
                      <span>{info.min}+ players</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div
              className="disp lobby-mode-blurb"
              style={{
                color: C.cream,
                fontSize: "clamp(20px, 2.2vw, 30px)",
                fontWeight: 800,
                lineHeight: 1.35,
                maxWidth: 900,
                margin: "0 auto 20px",
                textShadow: "0 4px 16px rgba(0,0,0,.82), 0 2px 4px rgba(0,0,0,.94), 0 0 22px rgba(255,193,94,.28)"
              }}
            >
              <ModeBlurb text={MODE_INFO[state.mode].blurb} />
            </div>
            {(() => {
              const normalMin = MODE_INFO[state.mode].min;
              const min = requiredPlayersForMode(state.mode, allowSinglePlayerStart);
              const enabled = players.length >= min;
              const soloTest = allowSinglePlayerStart && players.length === 1 && min === 1 && normalMin > 1;
              return (
                <button
                  onClick={() => dispatch({ type: "START_GAME", allowSinglePlayer: soloTest })}
                  disabled={!enabled}
                  className="disp"
                  style={hostBtn(enabled)}
                >
                  {enabled ? (soloTest ? "Start solo test" : "Start the show") : `Need ${min}+ players`}
                </button>
              );
            })()}
          </div>
        )}

        {state.phase === "writing" && introVisible && (
          <div className="popin" style={{ textAlign: "center", padding: "60px 0 70px" }}>
            <div
              className="body"
              style={{
                color: C.creamDim,
                letterSpacing: 6,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 12
              }}
            >
              ROUND
            </div>
            <div
              key={state.round}
              className="disp stagedrop"
              style={{
                fontSize: 92,
                fontWeight: 800,
                color: C.gold,
                lineHeight: 1,
                letterSpacing: 2
              }}
            >
              {state.round}
              <span style={{ color: C.creamDim, fontSize: 44, fontWeight: 600 }}>
                {" "}
                / {state.totalRounds}
              </span>
            </div>
          </div>
        )}

        {state.phase === "writing" && !introVisible && state.mode === "classic" && (
          <div className="fadeup" style={{ textAlign: "center", padding: "10px 0" }}>
            <div
              className="body"
              style={{ color: C.coral, fontWeight: 700, letterSpacing: 2, fontSize: 12, marginBottom: 10 }}
            >
              FILL IN THE BLANK
            </div>
            <div
              key={state.round}
              className="disp stagedrop"
              style={{
                fontSize: "clamp(26px, 5vw, 44px)",
                fontWeight: 800,
                color: C.cream,
                lineHeight: 1.15,
                maxWidth: 860,
                margin: "0 auto",
                textShadow: HEAVY_TEXT_SHADOW
              }}
            >
              {state.prompt}
            </div>
            <div className="flex flex-wrap justify-center" style={{ gap: 10, marginTop: 22 }}>
              {players.map((p) => {
                const done = state.answers[p.id] != null;
                const isTyping = !done && (state.typing[p.id] ?? 0) + 1500 > now;
                return (
                  <span key={p.id} className="flex items-center" style={{ gap: 7 }}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        background: done ? p.color : "transparent",
                        border: `2px solid ${p.color}`,
                        boxShadow: done ? `0 0 10px ${p.color}` : "none"
                      }}
                    />
                    <span
                      className="body"
                      style={{ color: done ? C.cream : C.creamDim, fontWeight: 600, fontSize: 13 }}
                    >
                      {p.name}
                    </span>
                    {isTyping && (
                      <span aria-label="typing" style={{ marginLeft: 2 }}>
                        <span
                          className="typing-dot"
                          style={{ background: p.color, animationDelay: "0s" }}
                        />
                        <span
                          className="typing-dot"
                          style={{ background: p.color, animationDelay: ".15s" }}
                        />
                        <span
                          className="typing-dot"
                          style={{ background: p.color, animationDelay: ".3s" }}
                        />
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
            <div className="body" style={{ color: C.creamDim, marginTop: 18, fontSize: 13 }}>
              {submittedCount} / {players.length} locked in
            </div>
            <button onClick={() => dispatch({ type: "FORCE_VOTING" })} className="body" style={ghostBtn}>
              Skip ahead →
            </button>
          </div>
        )}

        {state.phase === "writing" && !introVisible && state.mode === "quiplash" && (() => {
          const totalAnswers = state.quipPrompts.reduce(
            (n, q) => n + q.writers.filter((w) => q.answers[w] != null).length,
            0
          );
          const needed = state.quipPrompts.length * 2;
          return (
            <div className="fadeup" style={{ textAlign: "center", padding: "10px 0" }}>
              <div
                className="body"
                style={{
                  color: C.coral,
                  fontWeight: 700,
                  letterSpacing: 2,
                  fontSize: 12,
                  marginBottom: 10
                }}
              >
                ANSWER YOUR PROMPTS
              </div>
              <div
                className="disp"
                style={{ fontSize: 22, fontWeight: 600, color: C.creamDim, maxWidth: 540, margin: "0 auto 14px", textShadow: HEAVY_TEXT_SHADOW }}
              >
                Each prompt went to two players. Write a great answer — only the winner gets the points.
              </div>
              <div className="flex flex-wrap justify-center" style={{ gap: 10, marginTop: 12 }}>
                {players.map((p) => {
                  const myPrompts = state.quipPrompts.filter((q) => q.writers.includes(p.id));
                  const done = myPrompts.every((q) => q.answers[p.id] != null);
                  const isTyping = !done && (state.typing[p.id] ?? 0) + 1500 > now;
                  return (
                    <span key={p.id} className="flex items-center" style={{ gap: 7 }}>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          background: done ? p.color : "transparent",
                          border: `2px solid ${p.color}`,
                          boxShadow: done ? `0 0 10px ${p.color}` : "none"
                        }}
                      />
                      <span
                        className="body"
                        style={{ color: done ? C.cream : C.creamDim, fontWeight: 600, fontSize: 13 }}
                      >
                        {p.name}
                      </span>
                      {isTyping && (
                        <span aria-label="typing" style={{ marginLeft: 2 }}>
                          <span className="typing-dot" style={{ background: p.color, animationDelay: "0s" }} />
                          <span className="typing-dot" style={{ background: p.color, animationDelay: ".15s" }} />
                          <span className="typing-dot" style={{ background: p.color, animationDelay: ".3s" }} />
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
              <div className="body" style={{ color: C.creamDim, marginTop: 18, fontSize: 13 }}>
                {totalAnswers} / {needed} answers in
              </div>
              <button
                onClick={() => dispatch({ type: "FORCE_VOTING" })}
                className="body"
                style={ghostBtn}
              >
                Skip ahead →
              </button>
            </div>
          );
        })()}

        {state.phase === "writing" && !introVisible && state.mode === "trivia" && (() => {
          const q = state.trivia.questions[state.round - 1];
          if (!q) return null;
          const answered = Object.keys(state.trivia.answers).length;
          return (
            <div className="fadeup" style={{ textAlign: "center", padding: "10px 0" }}>
              <div
                className="body"
                style={{ color: C.coral, fontWeight: 700, letterSpacing: 2, fontSize: 12, marginBottom: 8 }}
              >
                {q.category.toUpperCase()}
              </div>
              <div
                key={state.round}
                className="disp stagedrop"
                style={{
                  fontSize: "clamp(26px, 5vw, 42px)",
                  fontWeight: 800,
                  color: C.cream,
                  lineHeight: 1.2,
                  maxWidth: 700,
                  margin: "0 auto 22px",
                  textShadow: HEAVY_TEXT_SHADOW
                }}
              >
                {q.text}
              </div>
              <div
                className="flex flex-wrap justify-center"
                style={{ gap: 10, maxWidth: 860, margin: "0 auto" }}
              >
                {q.choices.map((c, i) => (
                  <div
                    key={i}
                    className="popin"
                    style={{
                      flex: "1 1 280px",
                      minWidth: 240,
                      background: C.surface2,
                      border: `1px solid ${C.line}`,
                      borderRadius: 14,
                      padding: "18px 22px",
                      animationDelay: `${i * 0.05}s`,
                      textAlign: "left"
                    }}
                  >
                    <span
                      className="disp"
                      style={{ color: C.gold, fontWeight: 800, marginRight: 8 }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="disp" style={{ color: C.cream, fontSize: 21, fontWeight: 700 }}>
                      {c}
                    </span>
                  </div>
                ))}
              </div>
              <div className="body" style={{ color: C.creamDim, marginTop: 18, fontSize: 13 }}>
                {answered} / {players.length} locked in
              </div>
              <button
                onClick={() => dispatch({ type: "FORCE_VOTING" })}
                className="body"
                style={ghostBtn}
              >
                Reveal answer →
              </button>
            </div>
          );
        })()}

        {state.phase === "writing" && !introVisible && state.mode === "picture" && (
          <PictureWritingCard
            state={state}
            dispatch={dispatch}
            phaseTotal={phaseTotal}
            remaining={remaining}
            playerCount={players.length}
          />
        )}

        {state.phase === "writing" && !introVisible && state.mode === "wheel" && (() => {
          const puzzle = state.wheel.puzzles[state.round - 1];
          if (!puzzle) return null;
          const revealed = new Set(Object.keys(state.wheel.guessedLetters));
          const wrongGuess =
            state.wheel.lastGuess && !state.wheel.lastGuess.correct && now - state.wheel.lastGuess.at < 1000
              ? state.wheel.lastGuess
              : null;
          return (
            <div className="fadeup" style={{ textAlign: "center", padding: "10px 0" }}>
              <div
                className="body"
                style={{ color: C.coral, fontWeight: 700, letterSpacing: 2, fontSize: 12, marginBottom: 8 }}
              >
                {puzzle.category.toUpperCase()}
              </div>
              <div style={{ position: "relative", width: "fit-content", maxWidth: "100%", margin: "0 auto" }}>
                <LetterHeistBoard text={puzzle.text} revealed={revealed} solved={state.wheel.solved} />
                {wrongGuess && (
                  <div
                    role="presentation"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: "clamp(96px, 18vw, 180px)",
                      height: "clamp(96px, 18vw, 180px)",
                      backgroundImage: "url('/a_and_I/X.png')",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "contain",
                      transform: "translate(-50%, -50%)",
                      filter: "drop-shadow(0 16px 28px rgba(0,0,0,.65))",
                      animation: "parlor-x-flash .18s ease-out both",
                      pointerEvents: "none",
                      zIndex: 5
                    }}
                  />
                )}
              </div>
              <div
                className="flex flex-wrap justify-center"
                style={{ gap: 6, marginBottom: 8, maxWidth: 640, margin: "0 auto 8px" }}
              >
                {Object.keys(state.wheel.guessedLetters).sort().length === 0 ? (
                  <span className="body" style={{ color: C.creamDim, fontSize: 13 }}>
                    No letters yet
                  </span>
                ) : (
                  Object.entries(state.wheel.guessedLetters)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([letter, hit]) => {
                      const p = state.players[hit.playerId];
                      const color = p?.color ?? C.gold;
                      const inPuzzle = puzzle.text.toUpperCase().includes(letter);
                      return (
                        <span
                          key={letter}
                          className="disp popin"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 8px",
                            background: inPuzzle ? `${color}22` : C.bgDeep,
                            border: `1px solid ${color}`,
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 800,
                            color: inPuzzle ? color : C.creamDim
                          }}
                        >
                          <span style={{ letterSpacing: 1 }}>{letter}</span>
                          <span style={{ opacity: 0.85, fontSize: 10 }}>${hit.value}</span>
                        </span>
                      );
                    })
                )}
              </div>
              <div
                className="flex flex-wrap justify-center"
                style={{ gap: 8, marginTop: 6, marginBottom: 4 }}
              >
                {players.map((p) => {
                  const spent = wheelLettersSpent(state, p.id);
                  const remaining = WHEEL_LETTER_BUDGET - spent;
                  return (
                    <span
                      key={p.id}
                      className="flex items-center"
                      style={{
                        gap: 6,
                        padding: "3px 9px",
                        borderRadius: 999,
                        background: C.bgDeep,
                        border: `1px solid ${remaining > 0 ? p.color : C.line}`,
                        opacity: remaining > 0 ? 1 : 0.55
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: p.color,
                          boxShadow: remaining > 0 ? `0 0 6px ${p.color}` : "none"
                        }}
                      />
                      <span className="body" style={{ color: C.cream, fontWeight: 700, fontSize: 11 }}>
                        {p.name}
                      </span>
                      <span
                        className="disp"
                        style={{ color: remaining > 0 ? C.gold : C.creamDim, fontWeight: 800, fontSize: 11 }}
                      >
                        {remaining > 0 ? "•".repeat(remaining) : "—"}
                      </span>
                    </span>
                  );
                })}
              </div>
              {state.wheel.solverId && state.players[state.wheel.solverId] && (
                <div
                  className="body popin"
                  style={{
                    color: state.players[state.wheel.solverId].color,
                    fontWeight: 700,
                    fontSize: 14,
                    marginTop: 6
                  }}
                >
                  Solved by {state.players[state.wheel.solverId].name} 🎉
                </div>
              )}
              <button
                onClick={() => dispatch({ type: "FORCE_VOTING" })}
                className="body"
                style={ghostBtn}
              >
                End round →
              </button>
            </div>
          );
        })()}

        {state.phase === "writing" && !introVisible && state.mode === "feud" && (() => {
          const q = state.feud.questions[state.round - 1];
          if (!q) return null;
          const firstHits = getFeudFirstHits(state);
          const totalAttempts = Object.values(state.feud.guesses).reduce((n, arr) => n + arr.length, 0);
          return (
            <div className="fadeup" style={{ textAlign: "center", padding: "10px 0" }}>
              <div
                className="body"
                style={{ color: C.coral, fontWeight: 700, letterSpacing: 2, fontSize: 12, marginBottom: 10 }}
              >
                SURVEY SAYS
              </div>
              <div
                key={state.round}
                className="disp stagedrop"
                style={{
                  fontSize: "clamp(26px, 5vw, 42px)",
                  fontWeight: 800,
                  color: C.cream,
                  lineHeight: 1.2,
                  maxWidth: 900,
                  margin: "0 auto 22px",
                  textShadow: HEAVY_TEXT_SHADOW
                }}
              >
                {q.prompt}
              </div>
              <div
                className="flex flex-col"
                style={{ gap: 8, maxWidth: 900, margin: "0 auto" }}
              >
                {q.answers.map((a, i) => (
                  <FeudBoardRow
                    key={`hidden-${i}`}
                    rank={i + 1}
                    answer={a}
                    points={feudAnswerPoints(q, i)}
                    hit={firstHits[i]}
                    revealed={false}
                  />
                ))}
              </div>
              <div className="body" style={{ color: C.creamDim, marginTop: 18, fontSize: 13 }}>
                {Object.keys(firstHits).length} / {q.answers.length} found · {totalAttempts} attempts
              </div>
              <button
                onClick={() => dispatch({ type: "FORCE_VOTING" })}
                className="body"
                style={ghostBtn}
              >
                Reveal board →
              </button>
            </div>
          );
        })()}

        {state.phase === "voting" && state.mode === "classic" && (
          <div className="fadeup" style={{ padding: "10px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div
                className="body"
                style={{ color: C.mint, fontWeight: 700, letterSpacing: 2, fontSize: 12, marginBottom: 8 }}
              >
                VOTE FOR YOUR FAVORITE
              </div>
              <div
                className="disp"
                style={{ fontSize: 22, fontWeight: 600, color: C.creamDim, maxWidth: 600, margin: "0 auto", textShadow: HEAVY_TEXT_SHADOW }}
              >
                {state.prompt}
              </div>
            </div>
            <div className="flex flex-col" style={{ gap: 10, maxWidth: 560, margin: "0 auto" }}>
              {Object.entries(state.answers).map(([pid, text], i) => (
                <div
                  key={pid}
                  className="popin"
                  style={{
                    background: C.surface2,
                    border: `1px solid ${C.line}`,
                    borderRadius: 14,
                    padding: "14px 18px",
                    animationDelay: `${i * 0.05}s`
                  }}
                >
                  <span className="disp" style={{ color: C.cream, fontSize: 19, fontWeight: 600 }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <div className="flex flex-wrap justify-center" style={{ gap: 10 }}>
                {players.map((p) => {
                  const voted = state.votes[p.id] != null;
                  return (
                    <span key={p.id} className="flex items-center" style={{ gap: 7 }}>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          background: voted ? p.color : "transparent",
                          border: `2px solid ${p.color}`,
                          boxShadow: voted ? `0 0 10px ${p.color}` : "none"
                        }}
                      />
                      <span
                        className="body"
                        style={{ color: voted ? C.cream : C.creamDim, fontWeight: 600, fontSize: 13 }}
                      >
                        {p.name}
                      </span>
                    </span>
                  );
                })}
              </div>
              <div className="body" style={{ color: C.creamDim, marginTop: 10, fontSize: 13 }}>
                {votedCount} / {players.length} voted
              </div>
              <button onClick={() => dispatch({ type: "FORCE_REVEAL" })} className="body" style={ghostBtn}>
                Reveal results →
              </button>
            </div>
          </div>
        )}

        {state.phase === "voting" && state.mode === "quiplash" && (() => {
          const prompt = state.quipPrompts[state.quipIndex];
          if (!prompt) return null;
          const [w1, w2] = prompt.writers;
          const a1 = prompt.answers[w1] ?? "(no answer)";
          const a2 = prompt.answers[w2] ?? "(no answer)";
          const promptVotes = state.quipVotes[prompt.id] ?? {};
          const eligibleCount = players.filter((p) => !prompt.writers.includes(p.id)).length;
          const voted = Object.keys(promptVotes).length;
          return (
            <div className="fadeup" style={{ padding: "10px 0" }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div
                  className="body"
                  style={{ color: C.mint, fontWeight: 700, letterSpacing: 2, fontSize: 12, marginBottom: 8 }}
                >
                  PROMPT {state.quipIndex + 1} / {state.quipPrompts.length}
                </div>
                <div
                  className="disp"
                style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 800, color: C.cream, maxWidth: 860, margin: "0 auto", textShadow: HEAVY_TEXT_SHADOW }}
                >
                  {prompt.text}
                </div>
              </div>
              <div className="flex flex-wrap justify-center" style={{ gap: 14, maxWidth: 900, margin: "0 auto" }}>
                {[a1, a2].map((text, i) => (
                  <div
                    key={i}
                    className="popin"
                    style={{
                      flex: "1 1 280px",
                      minWidth: 240,
                      maxWidth: 420,
                      background: C.surface2,
                      border: `1px solid ${C.line}`,
                      borderRadius: 16,
                      padding: "24px 26px",
                      textAlign: "center",
                      animationDelay: `${i * 0.08}s`
                    }}
                  >
                    <span className="disp" style={{ color: C.cream, fontSize: 28, fontWeight: 800 }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <div className="body" style={{ color: C.creamDim, fontSize: 13 }}>
                  {voted} / {eligibleCount} voted
                </div>
                <button
                  onClick={() => dispatch({ type: "NEXT_QUIP" })}
                  className="body"
                  style={ghostBtn}
                >
                  Next prompt →
                </button>
              </div>
            </div>
          );
        })()}

        {state.phase === "reveal" && state.mode === "classic" && (
          <RevealCard
            key={`${state.round}-${state.revealIndex}`}
            state={state}
            dispatch={dispatch}
          />
        )}

        {state.phase === "reveal" && state.mode === "quiplash" && (
          <QuipRevealCard
            key={`${state.round}-${state.quipIndex}`}
            state={state}
            dispatch={dispatch}
          />
        )}

        {state.phase === "reveal" && state.mode === "trivia" && (
          <TriviaRevealCard key={`${state.round}`} state={state} dispatch={dispatch} />
        )}

        {state.phase === "reveal" && state.mode === "picture" && (
          <PictureRevealCard key={`${state.round}`} state={state} dispatch={dispatch} />
        )}

        {state.phase === "reveal" && state.mode === "wheel" && (
          <WheelRevealCard key={`${state.round}`} state={state} dispatch={dispatch} />
        )}

        {state.phase === "reveal" && state.mode === "feud" && (
          <FeudRevealCard key={`${state.round}`} state={state} dispatch={dispatch} />
        )}

        {state.phase === "scoreboard" && (
          <div className="fadeup" style={{ padding: "10px 0" }}>
            <div
              className="disp"
              style={{ textAlign: "center", fontSize: 22, fontWeight: 800, color: C.gold, marginBottom: 16 }}
            >
              Standings
            </div>
            <Leaderboard state={state} highlightGainers />
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button
                onClick={() => dispatch({ type: "NEXT_ROUND" })}
                className="disp"
                style={hostBtn(true)}
              >
                {state.round >= state.totalRounds ? "Final results" : "Next round"}
              </button>
              <div className="body" style={{ color: C.creamDim, fontSize: 12, fontWeight: 800, marginTop: 10, letterSpacing: 1, textShadow: HEAVY_TEXT_SHADOW }}>
                {Object.keys(state.nextReady ?? {}).length} / {joinedIds(state).length} players ready
              </div>
            </div>
          </div>
        )}

        {state.phase === "gameover" &&
          (() => {
            const ranked = [...players].sort((a, b) => b.score - a.score);
            const top = ranked[0];
            if (!top) return null;
            const winners = ranked.filter((p) => p.score === top.score);
            const confettiPalette = [
              ...winners.map((w) => w.color),
              C.gold,
              C.mint,
              C.coral,
              C.cream
            ];
            return (
              <div className="popin" style={{ textAlign: "center", padding: "18px 0" }}>
                <Confetti palette={confettiPalette} />
                <FinalPodium ranked={ranked} />
                <Leaderboard state={state} />
                <div style={{ marginTop: 22 }}>
                  <button
                    onClick={() => dispatch({ type: "PLAY_AGAIN" })}
                    className="disp"
                    style={hostBtn(true)}
                  >
                    Play again
                  </button>
                </div>
              </div>
            );
          })()}
      </div>
      <Bulbs />
    </div>
  );
}

function QuipWritingPhone({
  state,
  dispatch,
  player
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  player: Player;
}) {
  const myPrompts = state.quipPrompts.filter((q) => q.writers.includes(player.id));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const roundKey = `${state.round}-q`;
  const [lastRoundKey, setLastRoundKey] = useState(roundKey);
  if (lastRoundKey !== roundKey) {
    setLastRoundKey(roundKey);
    setDrafts({});
  }
  const lastTypingAt = useRef(0);
  const onDraftChange = (promptId: string, val: string) => {
    setDrafts((d) => ({ ...d, [promptId]: val }));
    // Event handler invoked on user input only — Date.now() here runs in response to a keystroke, not during render.
    // eslint-disable-next-line react-hooks/purity
    const stamp = Date.now();
    if (stamp - lastTypingAt.current > 700) {
      lastTypingAt.current = stamp;
      dispatch({ type: "TYPING", playerId: player.id, at: stamp });
    }
  };
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      {myPrompts.map((q) => {
        const submitted = q.answers[player.id] != null;
        const draft = drafts[q.id] ?? "";
        return (
          <div key={q.id} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
            <div
              className="body"
              style={{ color: C.creamDim, fontSize: 11, lineHeight: 1.3, marginBottom: 4 }}
            >
              {q.text}
            </div>
            {submitted ? (
              <div className="body" style={{ ...phoneNote, color: player.color, padding: 0 }}>
                Sent ✓
              </div>
            ) : (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => onDraftChange(q.id, e.target.value)}
                  placeholder="Your answer…"
                  maxLength={80}
                  rows={2}
                  className="body"
                  style={{ ...inputStyle, resize: "none", marginBottom: 6 }}
                />
                <button
                  onClick={() =>
                    dispatch({ type: "SUBMIT_QUIP", promptId: q.id, playerId: player.id, text: draft })
                  }
                  disabled={!draft.trim()}
                  className="body"
                  style={phoneBtn(!!draft.trim(), player.color)}
                >
                  Send
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TriviaPhone({
  state,
  dispatch,
  player
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  player: Player;
}) {
  const q = state.trivia.questions[state.round - 1];
  if (!q) return null;
  const mine = state.trivia.answers[player.id];
  if (mine) {
    return (
      <div className="body" style={{ ...phoneNote, color: player.color }}>
        Locked in: {String.fromCharCode(65 + mine.choice)} ✓
      </div>
    );
  }
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <div className="body" style={{ color: C.creamDim, fontSize: 11, lineHeight: 1.3, marginBottom: 2 }}>
        {q.text}
      </div>
      {q.choices.map((c, i) => (
        <button
          key={i}
          onClick={() =>
            dispatch({ type: "SUBMIT_TRIVIA", playerId: player.id, choice: i, at: Date.now() })
          }
          className="body"
          style={{
            textAlign: "left",
            background: C.surface,
            border: `1px solid ${C.line}`,
            color: C.cream,
            borderRadius: 10,
            padding: "8px 10px",
            fontSize: 12,
            cursor: "pointer",
            lineHeight: 1.25
          }}
        >
          <span style={{ color: C.gold, fontWeight: 800, marginRight: 6 }}>
            {String.fromCharCode(65 + i)}
          </span>
          {c}
        </button>
      ))}
    </div>
  );
}

function PicturePhone({
  state,
  dispatch,
  player
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  player: Player;
}) {
  const item = state.picture.items[state.round - 1];
  const [draft, setDraft] = useState("");
  const roundKey = `${state.round}-pic`;
  const [lastKey, setLastKey] = useState(roundKey);
  if (lastKey !== roundKey) {
    setLastKey(roundKey);
    setDraft("");
  }
  if (!item) return null;
  const mine = state.picture.guesses[player.id];
  if (mine?.correct) {
    return (
      <div className="body" style={{ ...phoneNote, color: player.color }}>
        Got it ✓ ({mine.text})
      </div>
    );
  }
  const lastWrong = mine && !mine.correct ? mine.text : null;
  return (
    <div>
      {lastWrong && (
        <div className="body" style={{ color: C.coral, fontSize: 11, marginBottom: 4 }}>
          “{lastWrong}” — nope, try again
        </div>
      )}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Your guess…"
        maxLength={40}
        className="body"
        style={inputStyle}
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) {
            dispatch({
              type: "SUBMIT_PICTURE",
              playerId: player.id,
              text: draft,
              at: Date.now()
            });
            if (!matchesAnswer(draft, item.answer, item.aliases)) setDraft("");
          }
        }}
      />
      <button
        onClick={() => {
          if (!draft.trim()) return;
          dispatch({
            type: "SUBMIT_PICTURE",
            playerId: player.id,
            text: draft,
            at: Date.now()
          });
          if (!matchesAnswer(draft, item.answer, item.aliases)) setDraft("");
        }}
        disabled={!draft.trim()}
        className="body"
        style={phoneBtn(!!draft.trim(), player.color)}
      >
        Guess
      </button>
    </div>
  );
}

function WheelPhone({
  state,
  dispatch,
  player
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  player: Player;
}) {
  const puzzle = state.wheel.puzzles[state.round - 1];
  const [solveDraft, setSolveDraft] = useState("");
  const [wrongShake, setWrongShake] = useState(0);
  const roundKey = `${state.round}-w`;
  const [lastKey, setLastKey] = useState(roundKey);
  if (lastKey !== roundKey) {
    setLastKey(roundKey);
    setSolveDraft("");
  }
  if (!puzzle) return null;
  if (state.wheel.solved) {
    const solver = state.wheel.solverId ? state.players[state.wheel.solverId] : null;
    const youSolved = solver?.id === player.id;
    return (
      <div className="body" style={{ ...phoneNote, color: youSolved ? player.color : C.creamDim }}>
        {youSolved ? "You solved it! 🎉" : `Solved by ${solver?.name ?? "someone"}. Watch ☝️`}
      </div>
    );
  }
  const spent = wheelLettersSpent(state, player.id);
  const remaining = WHEEL_LETTER_BUDGET - spent;
  const canPickLetter = wheelCanGuessLetter(state, player.id);
  const activePicker = state.wheel.currentPickerId ? state.players[state.wheel.currentPickerId] : null;
  const usedSet = new Set(Object.keys(state.wheel.guessedLetters));
  const rows = ["ABCDEFG", "HIJKLMN", "OPQRSTU", "VWXYZ"];
  const trySolve = () => {
    if (!solveDraft.trim()) return;
    const ok = matchesAnswer(solveDraft, puzzle.text);
    dispatch({ type: "SOLVE_WHEEL", playerId: player.id, text: solveDraft });
    if (!ok) {
      setWrongShake((n) => n + 1);
      setSolveDraft("");
    }
  };
  return (
    <div>
      {/* Solve box — primary action, top of the phone */}
      <div
        key={wrongShake}
        style={{
          marginBottom: 10,
          padding: 8,
          background: C.bgDeep,
          border: `1px solid ${C.gold}`,
          borderRadius: 10,
          boxShadow: `0 0 12px ${C.gold}33`,
          animation: wrongShake ? "parlor-popin .2s ease-out" : undefined
        }}
      >
        <div className="body" style={{ color: C.gold, fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>
          SOLVE THE PUZZLE
        </div>
        <input
          value={solveDraft}
          onChange={(e) => setSolveDraft(e.target.value)}
          placeholder="Type the answer…"
          maxLength={60}
          className="body"
          style={{ ...inputStyle, marginBottom: 4, fontSize: 14 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") trySolve();
          }}
        />
        <button
          onClick={trySolve}
          disabled={!solveDraft.trim()}
          className="body"
          style={phoneBtn(!!solveDraft.trim(), C.gold)}
        >
          Solve
        </button>
      </div>

      {/* Budget indicator */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 6, padding: "0 2px" }}
      >
        <span className="body" style={{ color: C.creamDim, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
          LETTERS
        </span>
        <span
          className="disp"
          style={{
            color: remaining > 0 ? player.color : C.creamDim,
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: 2
          }}
        >
          {remaining > 0 ? "•".repeat(remaining) + "·".repeat(spent) : "spent"}
          <span style={{ color: C.creamDim, fontWeight: 600, marginLeft: 6 }}>
            {remaining}/{WHEEL_LETTER_BUDGET}
          </span>
        </span>
      </div>
      <div
        className="body"
        style={{
          color: canPickLetter ? player.color : C.creamDim,
          fontSize: 11,
          fontWeight: 800,
          marginBottom: 7,
          minHeight: 16,
          textAlign: "center"
        }}
      >
        {canPickLetter ? "Your letter pick" : activePicker ? `${activePicker.name} is picking` : "Letter pick opens soon"}
      </div>

      {/* Compact keyboard */}
      <div className="flex flex-col" style={{ gap: 3 }}>
        {rows.map((row, ri) => (
          <div key={ri} className="flex" style={{ gap: 3, justifyContent: "center" }}>
            {row.split("").map((ch) => {
              const used = usedSet.has(ch);
              const mine = state.wheel.guessedLetters[ch]?.playerId === player.id;
              const locked = !canPickLetter && !used;
              const disabled = used || locked;
              return (
                <button
                  key={ch}
                  disabled={disabled}
                  onClick={() => dispatch({ type: "GUESS_LETTER", playerId: player.id, letter: ch })}
                  className="disp"
                  style={{
                    width: 21,
                    height: 26,
                    fontSize: 12,
                    fontWeight: 800,
                    background: mine ? player.color : used ? C.bgDeep : locked ? C.bgDeep : C.surface,
                    color: mine ? C.bgDeep : used || locked ? C.line : C.cream,
                    border: `1px solid ${used || locked ? C.line : player.color}`,
                    borderRadius: 5,
                    cursor: disabled ? "not-allowed" : "pointer",
                    padding: 0,
                    opacity: locked ? 0.45 : 1
                  }}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeudPhone({
  state,
  dispatch,
  player
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  player: Player;
}) {
  const q = state.feud.questions[state.round - 1];
  const [draft, setDraft] = useState("");
  const roundKey = `${state.round}-f`;
  const [lastKey, setLastKey] = useState(roundKey);
  if (lastKey !== roundKey) {
    setLastKey(roundKey);
    setDraft("");
  }
  if (!q) return null;
  const mine = state.feud.guesses[player.id] ?? [];
  const submit = () => {
    if (!draft.trim()) return;
    dispatch({ type: "SUBMIT_FEUD", playerId: player.id, text: draft, at: Date.now() });
    setDraft("");
  };
  return (
    <div>
      <div className="body" style={{ color: C.creamDim, fontSize: 11, marginBottom: 4, lineHeight: 1.3 }}>
        {q.prompt}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Your guess…"
        maxLength={40}
        className="body"
        style={inputStyle}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <button
        onClick={submit}
        disabled={!draft.trim()}
        className="body"
        style={phoneBtn(!!draft.trim(), player.color)}
      >
        Guess
      </button>
      {mine.length > 0 && (
        <div className="flex flex-col" style={{ gap: 3, marginTop: 8 }}>
          {mine.map((g, i) => {
            const hit = g.matchIndex != null;
            return (
              <div
                key={i}
                className="body"
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: hit ? `${C.mint}22` : C.surface,
                  color: hit ? C.mint : C.creamDim,
                  border: `1px solid ${hit ? C.mint : C.line}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span style={{ flex: 1, textAlign: "left" }}>{g.text}</span>
                {hit ? (
                  <span style={{ fontWeight: 800 }}>
                    #{(g.matchIndex ?? 0) + 1} · +{q.answers[g.matchIndex ?? 0].points}
                  </span>
                ) : (
                  <span style={{ opacity: 0.7 }}>✗</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuipRevealCard({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const prompt = state.quipPrompts[state.quipIndex];
  if (!prompt) return null;
  const [w1, w2] = prompt.writers;
  const p1 = state.players[w1];
  const p2 = state.players[w2];
  const promptVotes = state.quipVotes[prompt.id] ?? {};
  const v1 = Object.values(promptVotes).filter((id) => id === w1).length;
  const v2 = Object.values(promptVotes).filter((id) => id === w2).length;
  const winnerId = v1 === v2 ? null : v1 > v2 ? w1 : w2;
  const isLast = state.quipIndex + 1 >= state.quipPrompts.length;
  if (!p1 || !p2) return null;
  return (
    <div className="popin" style={{ textAlign: "center", padding: "10px 0" }}>
      <div
        className="body"
        style={{ color: C.mint, fontWeight: 700, letterSpacing: 2, fontSize: 12, marginBottom: 8 }}
      >
        PROMPT {state.quipIndex + 1} / {state.quipPrompts.length}
      </div>
      <div
        className="disp"
        style={{ fontSize: "clamp(24px, 2.8vw, 36px)", fontWeight: 800, color: C.creamDim, maxWidth: 900, margin: "0 auto 18px", textShadow: HEAVY_TEXT_SHADOW }}
      >
        {prompt.text}
      </div>
      <div
        className="flex flex-wrap justify-center"
        style={{ gap: 18, maxWidth: 960, margin: "0 auto" }}
      >
        {[
          { player: p1, answer: prompt.answers[w1] ?? "(no answer)", votes: v1, isWinner: winnerId === w1 },
          { player: p2, answer: prompt.answers[w2] ?? "(no answer)", votes: v2, isWinner: winnerId === w2 }
        ].map(({ player, answer, votes, isWinner }) => (
          <div
            key={player.id}
            className="popin"
            style={{
              flex: "1 1 280px",
              minWidth: 240,
              maxWidth: 460,
              background: isWinner ? `${player.color}22` : C.surface2,
              border: `1px solid ${isWinner ? player.color : C.line}`,
              borderRadius: 16,
              padding: "22px 24px",
              textAlign: "center",
              boxShadow: isWinner ? `0 0 24px ${player.color}55` : "none"
            }}
          >
            <div className="disp" style={{ color: C.cream, fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
              {answer}
            </div>
            <div className="flex items-center justify-center" style={{ gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: player.color,
                  boxShadow: `0 0 8px ${player.color}`
                }}
              />
              <span className="disp" style={{ color: player.color, fontSize: 14, fontWeight: 800 }}>
                {player.name}
              </span>
            </div>
            <div
              className="disp"
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: votes > 0 ? C.gold : C.creamDim,
                marginTop: 6
              }}
            >
              {votes} {votes === 1 ? "vote" : "votes"}
              {isWinner && votes > 0 && (
                <span style={{ fontSize: 16, color: C.mint, marginLeft: 8 }}>
                  +{votes * POINTS_PER_VOTE}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22 }}>
        <button
          onClick={() => dispatch({ type: "NEXT_QUIP" })}
          className="disp"
          style={hostBtn(true)}
        >
          {isLast ? "See scores" : "Next prompt"}
        </button>
      </div>
    </div>
  );
}

function TriviaRevealCard({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const q = state.trivia.questions[state.round - 1];
  if (!q) return null;
  const playersByChoice: Record<number, Player[]> = {};
  Object.entries(state.trivia.answers).forEach(([pid, a]) => {
    const p = state.players[pid];
    if (!p) return;
    (playersByChoice[a.choice] ??= []).push(p);
  });
  const noAnswer = Object.values(state.players).filter((p) => !state.trivia.answers[p.id]);
  return (
    <div className="popin" style={{ textAlign: "center", padding: "10px 0" }}>
      <div
        className="body"
        style={{ color: C.mint, fontWeight: 700, letterSpacing: 2, fontSize: 12, marginBottom: 8 }}
      >
        {q.category.toUpperCase()}
      </div>
      <div
        className="disp"
        style={{
          fontSize: "clamp(24px, 4vw, 36px)",
          fontWeight: 700,
          color: C.creamDim,
          lineHeight: 1.2,
          maxWidth: 900,
          margin: "0 auto 18px",
          textShadow: HEAVY_TEXT_SHADOW
        }}
      >
        {q.text}
      </div>
      <div className="flex flex-col" style={{ gap: 10, maxWidth: 760, margin: "0 auto" }}>
        {q.choices.map((c, i) => {
          const correct = i === q.correctIndex;
          const folks = playersByChoice[i] ?? [];
          return (
            <div
              key={i}
              className="popin"
              style={{
                background: correct ? `${C.mint}22` : C.surface2,
                border: `1px solid ${correct ? C.mint : C.line}`,
                borderRadius: 14,
                padding: "16px 20px",
                animationDelay: `${i * 0.08}s`,
                textAlign: "left",
                boxShadow: correct ? `0 0 18px ${C.mint}44` : "none"
              }}
            >
              <div className="flex items-center" style={{ gap: 10, marginBottom: folks.length ? 6 : 0 }}>
                <span
                  className="disp"
                  style={{ color: correct ? C.mint : C.gold, fontWeight: 800, width: 22 }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="disp" style={{ color: C.cream, fontSize: 22, fontWeight: 700 }}>
                  {c}
                </span>
                {correct && (
                  <span
                    className="disp"
                    style={{ marginLeft: "auto", color: C.mint, fontWeight: 800, fontSize: 13 }}
                  >
                    ✓ CORRECT
                  </span>
                )}
              </div>
              {folks.length > 0 && (
                <div className="flex flex-wrap" style={{ gap: 6, marginLeft: 32 }}>
                  {folks.map((p) => (
                    <span
                      key={p.id}
                      className="body"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: C.bgDeep,
                        border: `1px solid ${p.color}`,
                        borderRadius: 999,
                        padding: "3px 10px",
                        fontSize: 12,
                        color: p.color,
                        fontWeight: 700
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: p.color,
                          boxShadow: `0 0 6px ${p.color}`
                        }}
                      />
                      {p.name}
                      {correct && (state.lastPoints[p.id] ?? 0) > 0 && (
                        <span style={{ color: C.mint, marginLeft: 4 }}>
                          +{state.lastPoints[p.id]}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {noAnswer.length > 0 && (
          <div className="body" style={{ color: C.creamDim, fontSize: 12, marginTop: 4 }}>
            No answer: {noAnswer.map((p) => p.name).join(", ")}
          </div>
        )}
      </div>
      <div style={{ marginTop: 22 }}>
        <button
          onClick={() => dispatch({ type: "NEXT_REVEAL" })}
          className="disp"
          style={hostBtn(true)}
        >
          See scores
        </button>
      </div>
    </div>
  );
}

type PictureImageResult = {
  src?: string;
  revisedPrompt?: string;
  error?: string;
};

function pictureImageSrc(item: { generatedSrc?: string; src?: string }): string {
  return item.generatedSrc || item.src || "";
}

async function generatePictureImage(item: {
  answer: string;
  hint?: string;
  imagePrompt?: string;
}): Promise<PictureImageResult> {
  const response = await fetch("/api/picture-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answer: item.answer,
      hint: item.hint,
      prompt: item.imagePrompt
    })
  });
  const data = (await response.json().catch(() => ({}))) as PictureImageResult;
  if (!response.ok) {
    return { error: data.error || "Image generation failed." };
  }
  return data;
}

function PictureFrame({
  src,
  alt,
  blurPx,
  status,
  error
}: {
  src: string;
  alt: string;
  blurPx: number;
  status?: string;
  error?: string;
}) {
  const [failedSrc, setFailedSrc] = useState("");
  const failed = !!src && failedSrc === src;
  const waiting = !src || status === "generating";
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
        aspectRatio: "1 / 1",
        margin: "0 auto 18px",
        background: `radial-gradient(circle at 35% 20%, ${C.surface2} 0%, ${C.bgDeep} 72%)`,
        border: `1px solid ${C.gold}55`,
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
        display: "grid",
        placeItems: "center",
        boxShadow: `0 18px 50px rgba(0,0,0,.34), inset 0 0 0 1px rgba(255,255,255,.06)`
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 10,
          border: `1px solid ${C.cream}18`,
          borderRadius: 14,
          pointerEvents: "none",
          zIndex: 2
        }}
      />
      {!waiting && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: blurPx > 0 ? `blur(${blurPx}px)` : "none",
            transform: blurPx > 0 ? "scale(1.1)" : "scale(1.01)",
            transition: "filter 0.25s linear"
          }}
          onError={() => setFailedSrc(src)}
        />
      )}
      {(waiting || failed) && (
        <div
          className="body"
          style={{ color: C.creamDim, fontSize: 12, textAlign: "center", padding: 22, lineHeight: 1.5, zIndex: 3 }}
        >
          <div className="disp" style={{ color: C.gold, fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
            {status === "generating" ? "Conjuring image..." : "Image standby"}
          </div>
          <div>
            {error || (src ? "Could not load the generated image." : "Waiting for the AI reveal art.")}
          </div>
        </div>
      )}
    </div>
  );
}

function PictureWritingCard({
  state,
  dispatch,
  phaseTotal,
  remaining,
  playerCount
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  phaseTotal: number;
  remaining: number;
  playerCount: number;
}) {
  const item = state.picture.items[state.round - 1];
  const requestedImage = useRef<string | null>(null);
  useEffect(() => {
    if (!item) return;
    if (item.generatedSrc || item.imageStatus === "generating" || item.imageStatus === "ready") return;
    if (requestedImage.current === item.id) return;
    requestedImage.current = item.id;
    dispatch({ type: "REQUEST_PICTURE_IMAGE", itemId: item.id });
    generatePictureImage(item)
      .then((result) => {
        if (result.src) {
          dispatch({
            type: "SET_PICTURE_IMAGE",
            itemId: item.id,
            src: result.src,
            revisedPrompt: result.revisedPrompt
          });
          return;
        }
        dispatch({
          type: "SET_PICTURE_IMAGE_ERROR",
          itemId: item.id,
          error: result.error ?? "Image generation failed."
        });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Image generation failed.";
        dispatch({ type: "SET_PICTURE_IMAGE_ERROR", itemId: item.id, error: message });
      });
  }, [dispatch, item]);
  if (!item) return null;
  const elapsedFrac = state.phaseDeadline && phaseTotal > 0 ? 1 - remaining / (phaseTotal * 1000) : 0;
  const blurPx = elapsedFrac >= 0.96 ? 0 : Math.max(6, 42 * Math.pow(1 - elapsedFrac, 0.7));
  const correctCount = Object.values(state.picture.guesses).filter((g) => g.correct).length;
  return (
    <div className="fadeup" style={{ textAlign: "center", padding: "10px 0" }}>
      <div
        className="body"
        style={{ color: C.coral, fontWeight: 700, letterSpacing: 2, fontSize: 12, marginBottom: 10 }}
      >
        WHAT IS IT?
      </div>
      <PictureFrame
        src={pictureImageSrc(item)}
        alt=""
        blurPx={blurPx}
        status={item.imageStatus}
        error={item.imageError}
      />
      {item.hint && elapsedFrac > 0.6 && (
        <div className="body fadeup" style={{ color: C.creamDim, fontSize: 13, marginBottom: 8 }}>
          Hint: <span style={{ color: C.cream }}>{item.hint}</span>
        </div>
      )}
      {item.imageStatus === "generating" && (
        <div className="body" style={{ color: C.gold, fontSize: 12, marginBottom: 8, fontWeight: 700 }}>
          Generating this round&apos;s reveal art...
        </div>
      )}
      <div className="body" style={{ color: C.creamDim, fontSize: 13 }}>
        {correctCount} / {playerCount} guessed correctly
      </div>
      <button
        onClick={() => dispatch({ type: "FORCE_VOTING" })}
        className="body"
        style={ghostBtn}
      >
        Reveal answer →
      </button>
    </div>
  );
}

function PictureRevealCard({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const item = state.picture.items[state.round - 1];
  if (!item) return null;
  const ranked = Object.entries(state.picture.guesses)
    .filter(([, g]) => g.correct)
    .sort((a, b) => a[1].at - b[1].at)
    .map(([pid]) => state.players[pid])
    .filter(Boolean);
  return (
    <div className="popin" style={{ textAlign: "center", padding: "10px 0" }}>
      <PictureFrame
        src={pictureImageSrc(item)}
        alt={item.answer}
        blurPx={0}
        status={item.imageStatus}
        error={item.imageError}
      />
      <div className="body" style={{ color: C.creamDim, letterSpacing: 3, fontSize: 12, fontWeight: 700 }}>
        IT WAS
      </div>
      <div className="disp" style={{ fontSize: 40, fontWeight: 800, color: C.gold, margin: "4px 0 20px" }}>
        {item.answer}
      </div>
      {ranked.length > 0 ? (
        <div className="flex flex-col" style={{ gap: 6, maxWidth: 360, margin: "0 auto" }}>
          {ranked.map((p, i) => (
            <div
              key={p.id}
              className="popin"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: C.surface2,
                border: `1px solid ${p.color}`,
                borderRadius: 12,
                padding: "8px 14px",
                animationDelay: `${i * 0.07}s`
              }}
            >
              <span className="disp" style={{ color: C.gold, fontWeight: 800, width: 22 }}>
                {i + 1}
              </span>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: p.color,
                  boxShadow: `0 0 8px ${p.color}`
                }}
              />
              <span className="body" style={{ color: C.cream, fontWeight: 700 }}>
                {p.name}
              </span>
              <span className="disp" style={{ marginLeft: "auto", color: C.mint, fontWeight: 800 }}>
                +{state.lastPoints[p.id] ?? 0}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="body" style={{ color: C.creamDim }}>
          Nobody got it!
        </div>
      )}
      <div style={{ marginTop: 22 }}>
        <button onClick={() => dispatch({ type: "NEXT_REVEAL" })} className="disp" style={hostBtn(true)}>
          See scores
        </button>
      </div>
    </div>
  );
}

function WheelRevealCard({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const puzzle = state.wheel.puzzles[state.round - 1];
  if (!puzzle) return null;
  const solver = state.wheel.solverId ? state.players[state.wheel.solverId] : null;
  const revealed = new Set(Object.keys(state.wheel.guessedLetters));
  return (
    <div className="popin" style={{ textAlign: "center", padding: "10px 0" }}>
      <div
        className="body"
        style={{ color: C.mint, fontWeight: 700, letterSpacing: 2, fontSize: 12, marginBottom: 8 }}
      >
        {puzzle.category.toUpperCase()}
      </div>
      <LetterHeistBoard text={puzzle.text} revealed={revealed} solved />
      {solver && (
        <div
          className="popin"
          style={{ color: solver.color, fontWeight: 700, fontSize: 16, marginBottom: 12 }}
        >
          Solved by {solver.name} 🎉
        </div>
      )}
      <div className="flex flex-col" style={{ gap: 6, maxWidth: 360, margin: "0 auto" }}>
        {Object.values(state.players)
          .filter((p) => (state.lastPoints[p.id] ?? 0) > 0)
          .sort((a, b) => (state.lastPoints[b.id] ?? 0) - (state.lastPoints[a.id] ?? 0))
          .map((p, i) => (
            <div
              key={p.id}
              className="popin"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: C.surface2,
                border: `1px solid ${p.color}`,
                borderRadius: 12,
                padding: "8px 14px",
                animationDelay: `${i * 0.07}s`
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: p.color,
                  boxShadow: `0 0 8px ${p.color}`
                }}
              />
              <span className="body" style={{ color: C.cream, fontWeight: 700 }}>
                {p.name}
              </span>
              <span className="disp" style={{ marginLeft: "auto", color: C.mint, fontWeight: 800 }}>
                +{state.lastPoints[p.id] ?? 0}
              </span>
            </div>
          ))}
      </div>
      <div style={{ marginTop: 22 }}>
        <button onClick={() => dispatch({ type: "NEXT_REVEAL" })} className="disp" style={hostBtn(true)}>
          See scores
        </button>
      </div>
    </div>
  );
}

function FeudRevealCard({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const q = state.feud.questions[state.round - 1];
  const [revealedCount, setRevealedCount] = useState(0);
  const firstHits = getFeudFirstHits(state);
  useEffect(() => {
    if (!q) return;
    const revealHits = getFeudFirstHits(state);
    let cancelled = false;
    const timers: number[] = [];
    let count = 0;
    const revealNext = () => {
      if (cancelled || count >= q.answers.length) return;
      count += 1;
      const answerIndex = q.answers.length - count;
      const answer = q.answers[answerIndex];
      const hit = revealHits[answerIndex];
      const prompt = answerIndex === 0
        ? "And the number one answer on the board?"
        : hit
          ? `Show me ${answer.text}`
          : "Survey says?";
      speakFeudAnswer(prompt, () => {
        if (cancelled) return;
        playRevealTick();
        setRevealedCount(count);
        const afterReveal = () => {
          if (!cancelled) timers.push(window.setTimeout(revealNext, 260));
        };
        if (answerIndex === 0) {
          timers.push(window.setTimeout(() => {
            if (!cancelled) speakFeudAnswer(answer.text, afterReveal);
          }, FEUD_NUMBER_ONE_ANSWER_PAUSE_MS));
        } else if (!hit) {
          speakFeudAnswer(answer.text, afterReveal);
        } else {
          afterReveal();
        }
      });
    };
    timers.push(window.setTimeout(revealNext, 550));
    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      stopFeudVoice();
    };
  }, [q, state]);
  if (!q) return null;
  const playerHits: Record<string, Set<number>> = {};
  Object.entries(state.feud.guesses).forEach(([pid, arr]) => {
    const set = (playerHits[pid] ??= new Set());
    arr.forEach((g) => g.matchIndex != null && set.add(g.matchIndex));
  });
  const noMatch = Object.entries(state.feud.guesses)
    .filter(([pid, arr]) => arr.length > 0 && !(playerHits[pid]?.size))
    .map(([pid]) => state.players[pid])
    .filter(Boolean);
  return (
    <div className="popin" style={{ textAlign: "center", padding: "10px 0" }}>
      <div
        className="body"
        style={{ color: C.mint, fontWeight: 700, letterSpacing: 2, fontSize: 12, marginBottom: 8 }}
      >
        SURVEY SAYS
      </div>
      <div
        className="disp"
        style={{
          fontSize: "clamp(24px, 4vw, 36px)",
          fontWeight: 700,
          color: C.creamDim,
          lineHeight: 1.2,
          maxWidth: 900,
          margin: "0 auto 18px",
          textShadow: HEAVY_TEXT_SHADOW
        }}
      >
        {q.prompt}
      </div>
      <div className="flex flex-col" style={{ gap: 8, maxWidth: 900, margin: "0 auto" }}>
        {q.answers.map((a, i) => {
          const revealed = i >= q.answers.length - revealedCount;
          return (
            <FeudBoardRow
              key={`reveal-${i}`}
              rank={i + 1}
              answer={a}
              points={feudAnswerPoints(q, i)}
              hit={firstHits[i]}
              revealed={revealed}
              delay={(q.answers.length - i - 1) * 80}
            />
          );
        })}
        {noMatch.length > 0 && (
          <div className="body" style={{ color: C.coral, fontSize: 12, marginTop: 4 }}>
            No match: {noMatch.map((p) => p.name).join(", ")}
          </div>
        )}
      </div>
      <div style={{ marginTop: 22 }}>
        <button onClick={() => dispatch({ type: "NEXT_REVEAL" })} className="disp" style={hostBtn(true)}>
          See scores
        </button>
      </div>
    </div>
  );
}

function RevealCard({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const pid = state.revealOrder[state.revealIndex];
  const p = state.players[pid];
  const answer = state.answers[pid] ?? "";
  const { shown, done: typedDone } = useTypewriter(answer, 28);
  const lastLenRef = useRef(0);
  useEffect(() => {
    if (shown.length > lastLenRef.current && shown.length > 0) playRevealTick();
    lastLenRef.current = shown.length;
  }, [shown.length]);
  if (!p) return null;
  const votes = state._counts?.[pid] ?? 0;
  const pts = state.lastPoints[pid] ?? 0;
  const voters = Object.entries(state.votes)
    .filter(([, owner]) => owner === pid)
    .map(([v]) => state.players[v])
    .filter(Boolean);
  const isRoundTop = state.revealIndex === state.revealOrder.length - 1 && votes > 0;
  return (
    <div key={pid} className="popin" style={{ textAlign: "center", padding: "18px 0" }}>
      {isRoundTop && typedDone && <Confetti count={40} palette={[p.color, C.gold, C.mint]} />}
      <div
        className="disp"
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: C.cream,
          maxWidth: 600,
          margin: "0 auto 18px",
          minHeight: "1.2em"
        }}
      >
        “{shown}
        {!typedDone && (
          <span
            style={{
              display: "inline-block",
              width: ".55em",
              marginLeft: 2,
              borderBottom: `3px solid ${C.gold}`,
              animation: "parlor-twinkle 0.6s ease-in-out infinite"
            }}
          />
        )}
        {typedDone && "”"}
      </div>
      <div className="flex items-center justify-center" style={{ gap: 10, marginBottom: 16 }}>
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            background: p.color,
            boxShadow: `0 0 12px ${p.color}`
          }}
        />
        <span className="disp" style={{ color: p.color, fontSize: 22, fontWeight: 800 }}>
          {p.name}
        </span>
      </div>
      {typedDone && (
        <div
          className="popin"
          style={{ display: "inline-block" }}
        >
          <div
            className="disp"
            style={{ fontSize: 44, fontWeight: 800, color: votes ? C.gold : C.creamDim }}
          >
            {votes} {votes === 1 ? "vote" : "votes"}
            <span style={{ fontSize: 22, color: C.mint, marginLeft: 12 }}>+{pts}</span>
          </div>
        </div>
      )}
      {typedDone && voters.length > 0 && (
        <div className="body fadeup" style={{ color: C.creamDim, marginTop: 10, fontSize: 13 }}>
          from {voters.map((v) => v.name).join(", ")}
        </div>
      )}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => dispatch({ type: "NEXT_REVEAL" })}
          className="disp"
          style={hostBtn(true)}
        >
          {state.revealIndex + 1 >= state.revealOrder.length ? "See scores" : "Next"}
        </button>
      </div>
    </div>
  );
}

function useTypewriter(text: string, speed = 32): { shown: string; done: boolean } {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => {
      clearInterval(id);
    };
  }, [text, speed]);
  return { shown, done };
}

function useCountUp(target: number, initial = target, durationMs = 1200): number {
  const [value, setValue] = useState(initial);
  const valueRef = useRef(initial);
  useEffect(() => {
    const from = valueRef.current;
    if (from === target) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      valueRef.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return Math.round(value);
}

function LeaderboardRow({
  player,
  rank,
  max,
  startScore,
  isTopGainer,
  delta
}: {
  player: Player;
  rank: number;
  max: number;
  startScore: number;
  isTopGainer: boolean;
  delta: number;
}) {
  const displayed = useCountUp(player.score, startScore);
  const pct = (displayed / max) * 100;
  return (
    <div className="flex items-center" style={{ gap: 12 }}>
      <span
        className="disp"
        style={{ color: C.creamDim, width: 22, textAlign: "right", fontWeight: 800 }}
      >
        {rank}
      </span>
      <AvatarBadge avatar={player.avatar} color={player.color} size={52} />
      <span className="body" style={{ color: C.cream, fontWeight: 600, width: 96 }}>
        {player.name}
      </span>
      <div
        style={{
          flex: 1,
          height: 10,
          background: C.bgDeep,
          borderRadius: 999,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: player.color,
            borderRadius: 999
          }}
        />
      </div>
      <span
        className={isTopGainer ? "disp streak" : "disp"}
        style={
          {
            color: C.cream,
            fontWeight: 800,
            width: 56,
            textAlign: "right",
            ["--glow" as string]: player.color
          } as React.CSSProperties
        }
      >
        {displayed}
        {isTopGainer && delta > 0 && (
          <span
            className="body"
            style={{ color: player.color, fontSize: 11, fontWeight: 700, marginLeft: 4 }}
          >
            +{delta}
          </span>
        )}
      </span>
    </div>
  );
}

function Leaderboard({ state, highlightGainers = false }: { state: State; highlightGainers?: boolean }) {
  const ranked = Object.values(state.players).sort((a, b) => b.score - a.score);
  const max = Math.max(1, ...ranked.map((p) => p.score));
  const gains = Object.values(state.lastPoints);
  const topGain = Math.max(0, ...gains);
  const topGainerIds = new Set(
    highlightGainers && topGain > 0
      ? Object.entries(state.lastPoints)
          .filter(([, v]) => v === topGain)
          .map(([k]) => k)
      : []
  );
  return (
    <div className="flex flex-col" style={{ gap: 8, maxWidth: 520, margin: "0 auto" }}>
      {ranked.map((p, i) => (
        <LeaderboardRow
          key={p.id}
          player={p}
          rank={i + 1}
          max={max}
          startScore={p.score - (state.lastPoints[p.id] ?? 0)}
          isTopGainer={topGainerIds.has(p.id)}
          delta={state.lastPoints[p.id] ?? 0}
        />
      ))}
    </div>
  );
}

function FinalPodium({ ranked }: { ranked: Player[] }) {
  const places = [
    { player: ranked[1], place: "2ND", label: "SECOND PLACE", height: 132, color: "#A9D0FF", order: 1 },
    { player: ranked[0], place: "1ST", label: "FIRST PLACE", height: 178, color: C.gold, order: 2 },
    { player: ranked[2], place: "3RD", label: "THIRD PLACE", height: 108, color: C.mint, order: 3 }
  ].filter((entry): entry is { player: Player; place: string; label: string; height: number; color: string; order: number } => !!entry.player);

  return (
    <div
      className="flex flex-wrap items-end justify-center"
      style={{ gap: 14, margin: "8px auto 28px", maxWidth: 980 }}
    >
      {places.map(({ player, place, label, height, color }) => (
        <div
          key={player.id}
          style={{
            width: place === "1ST" ? 240 : 210,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8
          }}
        >
          <div className="disp" style={{ color, fontSize: place === "1ST" ? 30 : 24, fontWeight: 900, lineHeight: 1, textShadow: HEAVY_TEXT_SHADOW }}>
            {player.score} pts
          </div>
          <div className="disp" style={{ color: C.cream, fontSize: place === "1ST" ? 28 : 22, fontWeight: 900, lineHeight: 1.05, textShadow: HEAVY_TEXT_SHADOW }}>
            {player.name}
          </div>
          <AvatarBadge avatar={player.avatar} color={player.color} size={place === "1ST" ? 132 : 108} selected={place === "1ST"} />
          <div
            style={{
              width: "100%",
              minHeight: height,
              borderRadius: "12px 12px 6px 6px",
              border: `1px solid ${color}`,
              background: `linear-gradient(180deg, ${color}44 0%, ${C.bgDeep} 84%)`,
              boxShadow: `0 20px 42px rgba(0,0,0,.34), 0 0 30px ${color}33`,
              display: "grid",
              placeItems: "center",
              padding: "18px 14px"
            }}
          >
            <div className="disp" style={{ color, fontSize: place === "1ST" ? 42 : 34, fontWeight: 900, textShadow: HEAVY_TEXT_SHADOW }}>
              {place}
            </div>
            <div className="body" style={{ color: C.cream, fontSize: 11, fontWeight: 900, letterSpacing: 2, textShadow: HEAVY_TEXT_SHADOW }}>
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- A PHONE (one player's controller) ----------------------------------- */
function Phone({
  deviceId,
  state,
  dispatch,
  onRemove,
  fullSize = false,
  connected = true
}: {
  deviceId: string;
  state: State;
  dispatch: React.Dispatch<Action>;
  onRemove: () => void;
  fullSize?: boolean;
  connected?: boolean;
}) {
  const player = state.players[deviceId];
  const [name, setName] = useState(() => readSavedName(deviceId));
  const [avatar, setAvatar] = useState(() => readSavedAvatar(deviceId));
  const avatarRef = useRef(avatar);
  const [avatarDeal, setAvatarDeal] = useState(() => initialAvatarDeal(avatar));
  const [draft, setDraft] = useState("");
  const canJoin = connected && state.phase !== "gameover" && !!name.trim();

  useEffect(() => {
    setAvatarDeal(dealAvatars(avatarRef.current));
  }, []);

  // Keep the ref aligned with React state so handlers always see the latest pick.
  useEffect(() => {
    avatarRef.current = avatar;
  }, [avatar]);

  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!player || !connected) return;
    const selectedAvatar = normalizeAvatarId(avatarRef.current || avatar);
    if (player.avatar === selectedAvatar) return;
    dispatch({ type: "JOIN", id: deviceId, name: player.name, avatar: selectedAvatar });
  }, [avatar, connected, deviceId, dispatch, player]);

  const commitAvatar = (id: string) => {
    const selected = normalizeAvatarId(id);
    avatarRef.current = selected;
    setAvatar(selected);
    saveAvatar(deviceId, selected);
    return selected;
  };

  const joinWithName = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || !connected) return;
    const selectedAvatar = normalizeAvatarId(avatarRef.current || avatar);
    saveName(deviceId, trimmed);
    saveAvatar(deviceId, selectedAvatar);
    dispatch({ type: "JOIN", id: deviceId, name: trimmed, avatar: selectedAvatar });
  };

  const pickAvatar = (id: string) => {
    const selectedAvatar = commitAvatar(id);
    if (player && connected) {
      dispatch({ type: "JOIN", id: deviceId, name: player.name, avatar: selectedAvatar });
    }
  };

  const lastTypingAt = useRef(0);
  const onDraftChange = (val: string) => {
    setDraft(val);
    if (!player) return;
    const now = Date.now();
    if (now - lastTypingAt.current > 700) {
      lastTypingAt.current = now;
      dispatch({ type: "TYPING", playerId: player.id, at: now });
    }
  };

  const draftKey = `${state.round}-${state.phase === "writing"}`;
  const [lastDraftKey, setLastDraftKey] = useState(draftKey);
  if (lastDraftKey !== draftKey) {
    setLastDraftKey(draftKey);
    setDraft("");
  }

  const hasAnswered = player && state.answers[player.id] != null;
  const hasVoted = player && state.votes[player.id] != null;
  const gaveUp = !!(player && state.giveUps[player.id]);
  const readyMap = state.nextReady ?? {};
  const readyForNext = !!(player && readyMap[player.id]);
  const readyCount = Object.keys(readyMap).length;
  const joinedCount = joinedIds(state).length;
  const playerDoneWriting = !!player && (
    (state.mode === "classic" && hasAnswered) ||
    (state.mode === "quiplash" &&
      state.quipPrompts
        .filter((q) => q.writers.includes(player.id))
        .every((q) => q.answers[player.id] != null)) ||
    (state.mode === "trivia" && !!state.trivia.answers[player.id]) ||
    (state.mode === "picture" && !!state.picture.guesses[player.id]?.correct) ||
    (state.mode === "wheel" && state.wheel.solved) ||
    false
  );
  const canGiveUp = !!player && state.phase === "writing" && !gaveUp && !playerDoneWriting;

  const confirmPlayAgain = () => {
    if (typeof window !== "undefined" && !window.confirm("Start a new game for everyone?")) return;
    dispatch({ type: "PLAY_AGAIN" });
  };
  const confirmGiveUp = () => {
    if (player) dispatch({ type: "GIVE_UP", playerId: player.id });
  };

  return (
    <div
      style={{
        width: fullSize ? "min(100%, 460px)" : 188,
        flexShrink: 0,
        background: C.bgDeep,
        border: `1px solid ${player ? player.color : C.line}`,
        borderRadius: fullSize ? 18 : 20,
        padding: fullSize ? 18 : 12,
        position: "relative",
        minHeight: fullSize ? "calc(100vh - 120px)" : undefined,
        boxShadow: player
          ? `0 0 0 1px ${player.color}22, 0 8px 24px rgba(0,0,0,.3)`
          : "0 8px 24px rgba(0,0,0,.3)"
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <span className="body" style={{ fontSize: 10, color: C.creamDim, letterSpacing: 1 }}>
          PLAYER
        </span>
        <div className="flex items-center" style={{ gap: 8 }}>
          {player && state.phase !== "lobby" && state.phase !== "gameover" && (
            <button
              onClick={confirmPlayAgain}
              className="body"
              title="Start a new game"
              aria-label="Start a new game"
              style={iconBtn}
            >
              ↺
            </button>
          )}
          {!fullSize && (
            <button
              onClick={onRemove}
              className="body"
              style={{
                background: "none",
                border: "none",
                color: C.creamDim,
                cursor: "pointer",
                fontSize: 12
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {!player && (
        <div>
          <div className="body" style={{ color: C.creamDim, fontWeight: 800, fontSize: 10, letterSpacing: 1.4, marginBottom: 4 }}>
            {PLAY_URL}
          </div>
          <div className="disp" style={{ color: C.gold, fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
            Room {state.roomCode}
          </div>
          <div className="body" style={{ color: C.creamDim, fontSize: 11, lineHeight: 1.35, marginBottom: 8 }}>
            Enter your name to join the game.
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={14}
            autoCapitalize="words"
            autoComplete="nickname"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-label="Your display name"
            className="body"
            style={inputStyle}
            onKeyDown={(e) => {
              if (e.key === "Enter") joinWithName(name);
            }}
          />
          <div className="flex items-center justify-between" style={{ margin: "10px 0 6px", gap: 10 }}>
            <div className="body" style={{ color: C.creamDim, fontSize: 11, fontWeight: 800, letterSpacing: 1.2 }}>
              AVATAR
            </div>
            <button
              type="button"
              onClick={() => setAvatarDeal(dealAvatars(avatar))}
              className="body"
              style={{
                border: `1px solid ${C.line}`,
                borderRadius: 999,
                background: "rgba(255,255,255,.04)",
                color: C.creamDim,
                cursor: "pointer",
                fontSize: 10,
                fontWeight: 800,
                padding: "4px 8px"
              }}
            >
              Shuffle
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}>
            {avatarDeal.map((option) => {
              const selected = avatar === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onPointerDown={() => commitAvatar(option.id)}
                  onClick={() => pickAvatar(option.id)}
                  aria-label={`Choose ${option.label} avatar`}
                  title={option.label}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer"
                  }}
                >
                  <AvatarBadge avatar={option.id} color={selected ? C.goldDim : C.line} size={84} selected={selected} />
                </button>
              );
            })}
          </div>
          <button
            onClick={() => joinWithName(name)}
            disabled={!canJoin}
            className="body"
            style={phoneBtn(canJoin, C.gold, fullSize)}
          >
            {!connected
              ? "Connecting..."
              : state.phase === "gameover"
                ? "Game ended"
                : state.phase === "lobby"
                  ? "Join"
                  : "Join late"}
          </button>
          {connected && state.phase !== "lobby" && state.phase !== "gameover" && (
            <div className="body" style={{ color: C.creamDim, fontSize: 11, lineHeight: 1.35, marginTop: 8 }}>
              You can still play and score from here. Early players may have a head start.
            </div>
          )}
          {!connected && (
            <div className="body" style={{ color: C.coral, fontSize: 11, lineHeight: 1.35, marginTop: 8 }}>
              Hold tight. Your phone is still connecting to the room.
            </div>
          )}
        </div>
      )}

      {player && (
        <div>
          <div className="flex items-center" style={{ gap: 7, marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              aria-label={pickerOpen ? "Close avatar picker" : "Change avatar"}
              title="Change avatar"
              style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
            >
              <AvatarBadge avatar={player.avatar} color={player.color} size={52} />
            </button>
            <span className="body" style={{ color: C.cream, fontWeight: 700, fontSize: 14 }}>
              {player.name}
            </span>
            <span className="body" style={{ marginLeft: "auto", color: C.creamDim, fontSize: 12 }}>
              {player.score}
            </span>
          </div>

          {pickerOpen && state.phase === "lobby" && (
            <div style={{ marginBottom: 12 }}>
              <div className="flex items-center justify-between" style={{ margin: "4px 0 8px", gap: 10 }}>
                <div className="body" style={{ color: C.creamDim, fontSize: 11, fontWeight: 800, letterSpacing: 1.2 }}>
                  CHANGE AVATAR
                </div>
                <button
                  type="button"
                  onClick={() => setAvatarDeal(dealAvatars(player.avatar))}
                  className="body"
                  style={{
                    border: `1px solid ${C.line}`,
                    borderRadius: 999,
                    background: "rgba(255,255,255,.04)",
                    color: C.creamDim,
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "4px 8px"
                  }}
                >
                  Shuffle
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {avatarDeal.map((option) => {
                  const selected = player.avatar === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onPointerDown={() => commitAvatar(option.id)}
                      onClick={() => {
                        pickAvatar(option.id);
                        setPickerOpen(false);
                      }}
                      aria-label={`Choose ${option.label} avatar`}
                      title={option.label}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        cursor: "pointer"
                      }}
                    >
                      <AvatarBadge avatar={option.id} color={selected ? C.goldDim : C.line} size={72} selected={selected} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {state.phase === "lobby" && !pickerOpen && (
            <div className="body" style={phoneNote}>
              You&apos;re in. Watch the big screen ☝️
            </div>
          )}

          {state.phase === "writing" && !gaveUp && state.mode === "classic" &&
            (hasAnswered ? (
              <div className="body" style={{ ...phoneNote, color: player.color }}>
                Locked in ✓
              </div>
            ) : (
              <div>
                <textarea
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  placeholder="Your answer…"
                  maxLength={80}
                  rows={2}
                  className="body"
                  style={{ ...inputStyle, resize: "none", marginBottom: 6 }}
                />
                <button
                  onClick={() =>
                    dispatch({ type: "SUBMIT_ANSWER", playerId: player.id, text: draft })
                  }
                  disabled={!draft.trim()}
                  className="body"
                  style={phoneBtn(!!draft.trim(), player.color, fullSize)}
                >
                  Send it
                </button>
              </div>
            ))}

          {state.phase === "writing" && !gaveUp && state.mode === "quiplash" && (
            <QuipWritingPhone state={state} dispatch={dispatch} player={player} />
          )}

          {state.phase === "writing" && !gaveUp && state.mode === "trivia" && (
            <TriviaPhone state={state} dispatch={dispatch} player={player} />
          )}

          {state.phase === "writing" && !gaveUp && state.mode === "picture" && (
            <PicturePhone state={state} dispatch={dispatch} player={player} />
          )}

          {state.phase === "writing" && !gaveUp && state.mode === "wheel" && (
            <WheelPhone state={state} dispatch={dispatch} player={player} />
          )}

          {state.phase === "writing" && !gaveUp && state.mode === "feud" && (
            <FeudPhone state={state} dispatch={dispatch} player={player} />
          )}

          {state.phase === "writing" && gaveUp && (
            <div className="body" style={{ ...phoneNote, color: C.creamDim, marginTop: 10 }}>
              You gave up this round. Waiting for the room...
            </div>
          )}

          {canGiveUp && (
            <button
              onClick={confirmGiveUp}
              className="body"
              style={{
                ...secondaryPhoneBtn,
                marginTop: 12
              }}
            >
              I give up
            </button>
          )}

          {state.phase === "voting" && state.mode === "classic" &&
            (hasVoted ? (
              <div className="body" style={{ ...phoneNote, color: player.color }}>
                Voted ✓
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: 6 }}>
                {Object.entries(state.answers)
                  .filter(([owner]) => owner !== player.id)
                  .map(([owner, text]) => (
                    <button
                      key={owner}
                      onClick={() =>
                        dispatch({ type: "VOTE", voterId: player.id, ownerId: owner })
                      }
                      className="body"
                      style={{
                        textAlign: "left",
                        background: C.surface,
                        border: `1px solid ${C.line}`,
                        color: C.cream,
                        borderRadius: 10,
                        padding: "8px 10px",
                        fontSize: 12,
                        cursor: "pointer",
                        lineHeight: 1.25
                      }}
                    >
                      {text}
                    </button>
                  ))}
              </div>
            ))}

          {state.phase === "voting" && state.mode === "quiplash" && (() => {
            const prompt = state.quipPrompts[state.quipIndex];
            if (!prompt) return null;
            if (prompt.writers.includes(player.id)) {
              return (
                <div className="body" style={{ ...phoneNote, color: player.color }}>
                  You wrote one — sit this prompt out
                </div>
              );
            }
            const promptVotes = state.quipVotes[prompt.id] ?? {};
            if (promptVotes[player.id]) {
              return (
                <div className="body" style={{ ...phoneNote, color: player.color }}>
                  Voted ✓
                </div>
              );
            }
            return (
              <div className="flex flex-col" style={{ gap: 6 }}>
                <div
                  className="body"
                  style={{ color: C.creamDim, fontSize: 11, marginBottom: 2, lineHeight: 1.3 }}
                >
                  {prompt.text}
                </div>
                {prompt.writers.map((w) => {
                  const text = prompt.answers[w] ?? "(no answer)";
                  return (
                    <button
                      key={w}
                      onClick={() =>
                        dispatch({
                          type: "VOTE_QUIP",
                          promptId: prompt.id,
                          voterId: player.id,
                          ownerId: w
                        })
                      }
                      className="body"
                      style={{
                        textAlign: "left",
                        background: C.surface,
                        border: `1px solid ${C.line}`,
                        color: C.cream,
                        borderRadius: 10,
                        padding: "8px 10px",
                        fontSize: 12,
                        cursor: "pointer",
                        lineHeight: 1.25
                      }}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {(state.phase === "reveal" || state.phase === "scoreboard") && (
            <div className="body" style={phoneNote}>
              {state.lastPoints[player.id] ? `+${state.lastPoints[player.id]} 🎉` : "Look up ☝️"}
            </div>
          )}

          {state.phase === "scoreboard" && (
            <button
              onClick={() => dispatch({ type: "READY_NEXT", playerId: player.id })}
              disabled={readyForNext}
              className="body"
              style={phoneBtn(!readyForNext, player.color, true)}
            >
              {readyForNext
                ? `Ready ${readyCount}/${joinedCount}`
                : state.round >= state.totalRounds
                  ? "Ready for final"
                  : "Ready for next round"}
            </button>
          )}

          {state.phase === "gameover" && (
            <div className="body" style={{ ...phoneNote, color: player.color }}>
              GG — {player.score} pts
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   MAIN
   ========================================================================== */
type Role = "host" | "play" | "both";
type RouteParams = {
  room: string | null;
  role: Role;
  local: boolean;
  hostToken: string | null;
  test: boolean;
};

function makeHostToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "");
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function cleanRoomCode(value: string | null): string | null {
  const code = value?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) ?? "";
  return code || null;
}

function parsePathRoom(pathname: string): { room: string | null; role: Role | null } {
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return { room: null, role: null };

  const [first, second] = parts;
  if ((first === "join" || first === "play") && second) {
    return { room: cleanRoomCode(second), role: "play" };
  }
  if (first === "host" && second) {
    return { room: cleanRoomCode(second), role: "host" };
  }
  if ((first === "room" || first === "board") && second) {
    return { room: cleanRoomCode(second), role: "host" };
  }
  if (parts.length === 1) {
    return { room: cleanRoomCode(first), role: "both" };
  }
  return { room: null, role: null };
}

function parseURLParams(search: string, pathname: string): RouteParams {
  const p = new URLSearchParams(search);
  const pathRoom = parsePathRoom(pathname);
  const room = cleanRoomCode(p.get("room")) ?? pathRoom.room;
  const rawRole = p.get("role")?.toLowerCase().replace(/[^a-z]/g, "");
  const role: Role = rawRole === "host" || rawRole === "play" ? rawRole : pathRoom.role ?? "both";
  return {
    room,
    role,
    local: p.get("local") === "1",
    hostToken: p.get("host"),
    test: p.get("test") === "1"
  };
}

function getLocationSnapshot() {
  if (typeof window === "undefined") return null;
  return `${window.location.pathname}${window.location.search}`;
}

const PUBLIC_HOST_ACCESS: HostAccess = {
  signedIn: false,
  approved: false,
  email: null
};

export default function Parlor({ hostAccess = PUBLIC_HOST_ACCESS }: { hostAccess?: HostAccess }) {
  const location = useSyncExternalStore(
    () => () => {
      // URL changes in this prototype are full navigations; no live subscription needed.
    },
    getLocationSnapshot,
    () => null
  );
  if (location == null) return <ParlorBoot />;
  const url = new URL(location, "https://playhoodwinked.com");
  const params = parseURLParams(url.search, url.pathname);
  if (params.room) return <MultiplayerParlor room={params.room} role={params.role} hostToken={params.hostToken} testMode={params.test} />;
  if (params.local) return <LocalParlor />;
  return <ParlorLanding hostAccess={hostAccess} />;
}

function ParlorBoot() {
  return (
    <div
      className="parlor-root body"
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.cream,
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center"
      }}
    >
      <style>{FONT_CSS}</style>
      <BrandLogo size={156} />
    </div>
  );
}

function ParlorLanding({ hostAccess }: { hostAccess: HostAccess }) {
  const [code, setCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const cleanJoinCode = joinCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const start = () => {
    if (!hostAccess.signedIn) {
      window.location.href = "/api/auth/signin?callbackUrl=/";
      return;
    }
    if (!hostAccess.approved) {
      window.location.href = "/host-access";
      return;
    }
    const c = makeRoomCode();
    const hostToken = makeHostToken();
    setCode(c);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`hoodwinked:host:${c}`, hostToken);
      } catch {
        // ignore storage failures; the URL still carries the host token
      }
      window.location.href = `/host/${c}?host=${hostToken}`;
    }
  };
  const join = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!cleanJoinCode) return;
    window.location.href = `/join/${cleanJoinCode}`;
  };
  return (
    <div
      className="parlor-root body"
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.cream,
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <style>{FONT_CSS}</style>
      <LandingSuspectPins />
      <div style={{ width: "100%", maxWidth: 860, position: "relative", zIndex: 1 }}>
        <BrandLogo size={496} responsive />
        <div className="body" style={{ color: C.creamDim, fontSize: "clamp(13px, 1.4vw, 18px)", fontWeight: 900, letterSpacing: 3, marginBottom: 12, textShadow: HEAVY_TEXT_SHADOW }}>
          {PLAY_URL}
        </div>
        <div className="disp" style={{ fontSize: "clamp(36px, 11vw, 112px)", fontWeight: 900, color: C.gold, letterSpacing: "clamp(1px, 0.6vw, 5px)", lineHeight: 0.9, textShadow: HEAVY_TEXT_SHADOW, overflowWrap: "anywhere" }}>
          HOODWINKED
        </div>
        <div
          className="disp"
          style={{
            color: C.cream,
            marginTop: 16,
            marginBottom: 36,
            fontSize: "clamp(18px, 4.8vw, 46px)",
            fontWeight: 900,
            lineHeight: 1.15,
            textShadow: HEAVY_TEXT_SHADOW,
            overflowWrap: "anywhere"
          }}
        >
          FOOL THE ROOM. WIN THE NIGHT.
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            textAlign: "left"
          }}
        >
          <section style={landingPanel}>
            <div className="body" style={eyebrowStyle}>HOST</div>
            <div className="disp" style={{ color: C.cream, fontSize: 20, fontWeight: 800, marginBottom: 8, fontVariant: "small-caps" }}>
              Start a room
            </div>
            <div className="body" style={{ color: C.creamDim, fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
              Approved hosts can start rooms. Players join from {PLAY_URL}.
            </div>
            {hostAccess.signedIn && !hostAccess.approved && (
              <div className="body" style={{ color: C.coral, fontSize: 12, lineHeight: 1.4, marginBottom: 12 }}>
                Host access pending approval.
              </div>
            )}
            {!hostAccess.signedIn ? (
              <Link
                href="/api/auth/signin?callbackUrl=/"
                aria-label="Sign in with Google to host"
                className="body"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: "100%",
                  minHeight: 44,
                  padding: "10px 18px",
                  background: "#ffffff",
                  color: "#1f1f1f",
                  border: "1px solid #dadce0",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  textDecoration: "none",
                  boxShadow: "0 6px 18px rgba(0,0,0,.32)",
                  fontFamily: "Roboto, Inter, system-ui, sans-serif"
                }}
              >
                <GoogleGlyph />
                <span>Sign in with Google</span>
              </Link>
            ) : (
              <button onClick={start} className="disp" style={{ ...hostBtn(true), width: "100%" }}>
                {code
                  ? `Opening ${code}...`
                  : hostAccess.approved
                    ? "Start room"
                    : "Host access pending"}
              </button>
            )}
            {hostAccess.signedIn && (
              <div className="body" style={{ color: C.creamDim, fontSize: 11, marginTop: 10 }}>
                {hostAccess.email}
              </div>
            )}
            {!hostAccess.signedIn && (
              <div className="body" style={{ color: C.creamDim, fontSize: 11, lineHeight: 1.4, marginTop: 10 }}>
                Only hosts sign in. Players join with a room code — no account needed.
              </div>
            )}
          </section>

          <form onSubmit={join} style={landingPanel}>
            <div className="body" style={eyebrowStyle}>PLAYERS</div>
            <div className="disp" style={{ color: C.cream, fontSize: 20, fontWeight: 800, marginBottom: 8, fontVariant: "small-caps" }}>
              Join a game
            </div>
            <div className="body" style={{ color: C.creamDim, fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
              Go to {PLAY_URL} and enter the code on the TV.
            </div>
            <div className="flex" style={{ gap: 8 }}>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="CODE"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                aria-label="Room code"
                maxLength={6}
                className="disp"
                style={{
                  ...inputStyle,
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  height: 46
                }}
              />
              <button
                type="submit"
                disabled={!cleanJoinCode}
                className="disp"
                style={{
                  ...phoneBtn(!!cleanJoinCode, C.gold),
                  width: 92,
                  marginTop: 0,
                  height: 46,
                  borderRadius: 10
                }}
              >
                Join
              </button>
            </div>
          </form>

          <section style={landingPanel}>
            <div className="body" style={eyebrowStyle}>SOLO</div>
            <div className="disp" style={{ color: C.cream, fontSize: 20, fontWeight: 800, marginBottom: 8, fontVariant: "small-caps" }}>
              Solo games
            </div>
            <div className="body" style={{ color: C.creamDim, fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
              Practice the case work with one-player AI challenges.
            </div>
            <Link
              href="/solo"
              className="disp"
              style={{
                ...hostBtn(true),
                display: "block",
                width: "100%",
                textAlign: "center",
                textDecoration: "none"
              }}
            >
              Open solo cases
            </Link>
          </section>
        </div>

        <div className="body" style={{ color: C.creamDim, fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
          <Link
            href="/?local=1"
            style={{ color: C.line, textDecoration: "none", borderBottom: `1px dotted ${C.line}`, fontSize: 11 }}
          >
            Use demo mode
          </Link>
          <div style={{ color: C.line, fontSize: 11, fontWeight: 800, letterSpacing: 1.6, marginTop: 10 }}>
            <Link href="/about" style={{ color: C.line, textDecoration: "none", borderBottom: `1px dotted ${C.line}` }}>
              About
            </Link>
            <span style={{ margin: "0 8px" }}>·</span>
            <Link href="/privacy" style={{ color: C.line, textDecoration: "none", borderBottom: `1px dotted ${C.line}` }}>
              Privacy
            </Link>
            <span style={{ margin: "0 8px" }}>·</span>
            v{APP_VERSION}
          </div>
        </div>
      </div>
      <WelcomeIntro />
    </div>
  );
}

function LocalParlor() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState);
  const [devices, setDevices] = useState<string[]>(["d1", "d2", "d3"]);
  const idCounter = useRef(3);
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("parlor:muted") === "1";
    } catch {
      return false;
    }
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 1;
    try {
      const raw = localStorage.getItem("parlor:volume");
      if (raw == null) return 1;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return 1;
      return Math.max(0, Math.min(1, parsed));
    } catch {
      return 1;
    }
  });
  useEffect(() => {
    setAudioVolume(volume);
    try {
      localStorage.setItem("parlor:volume", String(volume));
    } catch {
      // ignore
    }
  }, [volume]);
  useEffect(() => {
    setAudioMuted(muted);
    try {
      localStorage.setItem("parlor:muted", muted ? "1" : "0");
    } catch {
      // localStorage unavailable (sandboxed iframe, etc.) — ignore
    }
  }, [muted]);
  const prevPhase = useRef<Phase>(state.phase);
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = state.phase;
    if (prev === state.phase) return;
    if (state.phase === "voting") { playLockSound(); hapticReveal(); }
    else if (state.phase === "reveal") { playRevealSound(); hapticReveal(); }
    else if (state.phase === "gameover") { playWinSound(); hapticWin(); }
  }, [state.phase]);

  const addPhone = () => {
    idCounter.current += 1;
    const next = `d${idCounter.current}`;
    setDevices((d) => (d.length >= 8 ? d : [...d, next]));
  };
  const removePhone = (id: string) => setDevices((d) => d.filter((x) => x !== id));

  const FAKE_NAMES = ["Scout", "Rook", "Vega", "Ash", "Nova", "Wren", "Sage", "Echo"];
  const addFakePlayer = () => {
    if (Object.keys(state.players).length >= 8) return;
    idCounter.current += 1;
    const id = `f${idCounter.current}`;
    const takenNames = new Set(Object.values(state.players).map((p) => p.name));
    const name = FAKE_NAMES.find((candidate) => !takenNames.has(candidate)) ?? `Bot ${idCounter.current}`;
    const takenAvatars = new Set(Object.values(state.players).map((p) => p.avatar));
    const avatar = AVATAR_OPTIONS.find((option) => !takenAvatars.has(option.id))?.id ?? AVATAR_OPTIONS[0]?.id;
    setDevices((d) => (d.length >= 8 ? d : [...d, id]));
    dispatch({ type: "JOIN", id, name, avatar });
  };

  const fillAnswers = () => {
    if (state.mode === "quiplash") {
      let i = 0;
      state.quipPrompts.forEach((q) => {
        q.writers.forEach((w) => {
          if (q.answers[w] == null) {
            dispatch({
              type: "SUBMIT_QUIP",
              promptId: q.id,
              playerId: w,
              text: BOT_ANSWERS[i++ % BOT_ANSWERS.length]
            });
          }
        });
      });
      return;
    }
    if (state.mode === "trivia") {
      const q = state.trivia.questions[state.round - 1];
      if (!q) return;
      joinedIds(state).forEach((pid) => {
        if (state.trivia.answers[pid]) return;
        // 70% correct so we can verify the speed-bonus tally; 30% random wrong.
        const choice =
          Math.random() < 0.7
            ? q.correctIndex
            : (q.correctIndex + 1 + Math.floor(Math.random() * (q.choices.length - 1))) % q.choices.length;
        dispatch({ type: "SUBMIT_TRIVIA", playerId: pid, choice, at: Date.now() });
      });
      return;
    }
    if (state.mode === "picture") {
      const item = state.picture.items[state.round - 1];
      if (!item) return;
      joinedIds(state).forEach((pid, i) => {
        if (state.picture.guesses[pid]?.correct) return;
        const text = i % 2 === 0 ? item.answer : BOT_ANSWERS[i % BOT_ANSWERS.length];
        dispatch({ type: "SUBMIT_PICTURE", playerId: pid, text, at: Date.now() });
      });
      return;
    }
    if (state.mode === "wheel") {
      const used = new Set(Object.keys(state.wheel.guessedLetters));
      // Bias toward common letters so the puzzle actually reveals something.
      const common = "ETAOINSHRDLU".split("");
      const rest = "BCFGJKMPQVWXYZ".split("");
      const pool = [...common.filter((c) => !used.has(c)), ...rest.filter((c) => !used.has(c))];
      // Each bot tries to use one of their remaining slots this click; over a few
      // clicks they fill the budget.
      joinedIds(state).forEach((pid) => {
        if (!pool.length) return;
        const spent = wheelLettersSpent(state, pid);
        if (spent >= WHEEL_LETTER_BUDGET) return;
        const letter = pool.shift();
        if (letter) dispatch({ type: "GUESS_LETTER", playerId: pid, letter });
      });
      return;
    }
    if (state.mode === "feud") {
      const q = state.feud.questions[state.round - 1];
      if (!q) return;
      // Each bot submits 1–2 attempts so the multi-guess flow gets exercised.
      joinedIds(state).forEach((pid, i) => {
        const existing = state.feud.guesses[pid] ?? [];
        if (existing.length >= 2) return;
        const tries = Math.random() < 0.5 ? 2 : 1;
        for (let t = 0; t < tries; t++) {
          const slot = (i + t) % q.answers.length;
          const text = Math.random() < 0.8 ? q.answers[slot].text : BOT_ANSWERS[(i + t) % BOT_ANSWERS.length];
          dispatch({ type: "SUBMIT_FEUD", playerId: pid, text, at: Date.now() + t });
        }
      });
      return;
    }
    joinedIds(state).forEach((pid, i) => {
      if (state.answers[pid] == null)
        dispatch({ type: "SUBMIT_ANSWER", playerId: pid, text: BOT_ANSWERS[i % BOT_ANSWERS.length] });
    });
  };
  const fillVotes = () => {
    if (state.mode === "quiplash") {
      const prompt = state.quipPrompts[state.quipIndex];
      if (!prompt) return;
      const promptVotes = state.quipVotes[prompt.id] ?? {};
      joinedIds(state).forEach((pid) => {
        if (prompt.writers.includes(pid)) return;
        if (promptVotes[pid] != null) return;
        const choice = prompt.writers[Math.floor(Math.random() * prompt.writers.length)];
        dispatch({ type: "VOTE_QUIP", promptId: prompt.id, voterId: pid, ownerId: choice });
      });
      return;
    }
    const owners = Object.keys(state.answers);
    joinedIds(state).forEach((pid) => {
      if (state.votes[pid] == null) {
        const choices = owners.filter((o) => o !== pid);
        if (choices.length)
          dispatch({
            type: "VOTE",
            voterId: pid,
            ownerId: choices[Math.floor(Math.random() * choices.length)]
          });
      }
    });
  };

  return (
    <div
      className="parlor-root body"
      style={{ background: C.bg, minHeight: "100vh", padding: "20px 16px 40px" }}
    >
      <style>{FONT_CSS}</style>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <Board
          state={state}
          dispatch={dispatch}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          volume={volume}
          onVolumeChange={setVolume}
        />

        {state.phase === "lobby" && (
          <div
            className="demo-add-fake-row"
            style={{ gap: 8, flexWrap: "wrap", margin: "12px 4px 0", justifyContent: "center" }}
          >
            <button
              onClick={addFakePlayer}
              disabled={Object.keys(state.players).length >= 8}
              className="body"
              style={{
                ...devBtn,
                background: `linear-gradient(180deg, ${C.gold}, #dca33d)`,
                color: C.bgDeep,
                fontWeight: 900,
                padding: "8px 14px"
              }}
            >
              + Add fake player
            </button>
            {Object.keys(state.players).length > 0 && (
              <button onClick={() => dispatch({ type: "RESET" })} className="body" style={devBtn}>
                ↺ Reset
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between phones-row" style={{ margin: "26px 2px 12px" }}>
          <div
            className="disp"
            style={{ color: C.creamDim, fontWeight: 600, fontSize: 14, letterSpacing: 1 }}
          >
            THE PHONES
          </div>
          <div className="flex" style={{ gap: 8 }}>
            {state.phase === "writing" && (
              <button onClick={fillAnswers} className="body" style={devBtn}>
                🤖 Fill answers
              </button>
            )}
            {state.phase === "voting" && (
              <button onClick={fillVotes} className="body" style={devBtn}>
                🤖 Fill votes
              </button>
            )}
            <button
              onClick={addPhone}
              disabled={devices.length >= 8}
              className="body"
              style={devBtn}
            >
              + Add phone
            </button>
            <button onClick={() => dispatch({ type: "RESET" })} className="body" style={devBtn}>
              ↺ Reset
            </button>
          </div>
        </div>

        <div className="flex flex-wrap phones-row" style={{ gap: 12 }}>
          {devices.map((id) => (
            <Phone
              key={id}
              deviceId={id}
              state={state}
              dispatch={dispatch}
              onRemove={() => removePhone(id)}
            />
          ))}
          {devices.length === 0 && (
            <div className="body" style={{ color: C.creamDim, padding: 20 }}>
              No phones connected — add one to start.
            </div>
          )}
        </div>

        <div
          className="body"
          style={{ color: C.line, fontSize: 11, marginTop: 28, textAlign: "center", lineHeight: 1.6 }}
        >
          Prototype — all devices share one in-memory room via the{" "}
          <code style={{ color: C.creamDim }}>reducer</code>.
          <br />
          In the real build, each phone is its own browser and the reducer lives in a PartyKit room.
        </div>
      </div>
    </div>
  );
}

function HostJoinCard({ room, connected, hostToken }: { room: string; connected: boolean; hostToken: string | null }) {
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin
  );
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedBoard, setCopiedBoard] = useState(false);
  const hostQuery = hostToken ? `?host=${encodeURIComponent(hostToken)}` : "";
  const joinUrl = origin ? `${origin}/play/${room}` : "";
  const phoneUrl = origin ? `${origin}/join/${room}` : "";
  const boardUrl = origin ? `${origin}/room/${room}${hostQuery}` : "";
  const qrTarget = phoneUrl || joinUrl;
  const copyJoinUrl = () => {
    if (!joinUrl || typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(joinUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => setCopied(false));
  };
  const copyBoardUrl = () => {
    if (!boardUrl || typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(boardUrl)
      .then(() => {
        setCopiedBoard(true);
        setTimeout(() => setCopiedBoard(false), 1400);
      })
      .catch(() => setCopiedBoard(false));
  };
  useEffect(() => {
    if (!qrTarget) return;
    let cancelled = false;
    import("qrcode").then(({ default: QRCode }) =>
      QRCode.toDataURL(qrTarget, {
        margin: 1,
        width: 220,
        color: { dark: "#1f3320", light: "#FBF3E4" }
      })
        .then((url) => {
          if (!cancelled) setQrUrl(url);
        })
        .catch(() => {
          if (!cancelled) setQrUrl(null);
        })
    );
    return () => {
      cancelled = true;
    };
  }, [qrTarget]);
  return (
    <div
      className="flex flex-wrap items-center justify-center"
      style={{
        marginTop: 24,
        gap: 22,
        padding: "18px 14px",
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        background: `${C.bgDeep}66`
      }}
    >
      {qrUrl ? (
        // Tiny local QR data URL — next/image's optimizer would be wasted overhead here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrUrl}
          alt="Scan to join"
          width={140}
          height={140}
          style={{
            borderRadius: 12,
            background: C.cream,
            padding: 6,
            boxShadow: `0 0 0 1px ${C.line}`
          }}
        />
      ) : (
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 12,
            background: C.surface2,
            border: `1px dashed ${C.line}`
          }}
        />
      )}
      <div
        className="body"
        style={{ color: C.creamDim, fontSize: 12, lineHeight: 1.6, textAlign: "left", maxWidth: 360 }}
      >
        <div style={{ color: C.gold, fontSize: 12, fontWeight: 800, letterSpacing: 2, marginBottom: 5 }}>
          PLAYER ENTRY
        </div>
        <div className="disp" style={{ color: C.cream, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          {PLAY_URL}
        </div>
        <div className="body" style={{ color: C.creamDim, fontSize: 12, marginBottom: 8 }}>
          Remote players can open this on a computer and enter <b style={{ color: C.cream, letterSpacing: 2 }}>{room}</b>
        </div>
        <code style={{ color: C.cream, fontSize: 11, wordBreak: "break-all" }}>
          {joinUrl || `/play/${room}`}
        </code>
        <div className="body" style={{ color: C.creamDim, fontSize: 12, marginTop: 10 }}>
          Phone-only controller:
        </div>
        <code style={{ color: C.cream, fontSize: 11, wordBreak: "break-all" }}>
          {phoneUrl || `/join/${room}`}
        </code>
        <div className="body" style={{ color: C.creamDim, fontSize: 12, marginTop: 10 }}>
          Board screen for another computer:
        </div>
        <code style={{ color: C.cream, fontSize: 11, wordBreak: "break-all" }}>
          {boardUrl || `/room/${room}${hostQuery}`}
        </code>
        <div className="flex flex-wrap" style={{ gap: 8, marginTop: 10 }}>
          <button onClick={copyJoinUrl} className="body" style={devBtn} disabled={!joinUrl}>
            {copied ? "Copied" : "Copy PC player link"}
          </button>
          <button onClick={copyBoardUrl} className="body" style={devBtn} disabled={!boardUrl}>
            {copiedBoard ? "Copied" : "Copy board link"}
          </button>
          {joinUrl && typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={() => {
                navigator.share?.({ title: "Join Hoodwinked", text: `Join room ${room}`, url: joinUrl }).catch(() => {});
              }}
              className="body"
              style={devBtn}
            >
              Share
            </button>
          )}
        </div>
        <div style={{ marginTop: 8, color: connected ? C.mint : C.coral }}>
          {connected ? "● connected to room" : "○ reconnecting…"}
        </div>
      </div>
    </div>
  );
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem("parlor:deviceId");
    if (!id) {
      id =
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)) ?? "p-" + Date.now();
      localStorage.setItem("parlor:deviceId", id);
    }
    return id;
  } catch {
    return "p-" + Math.random().toString(36).slice(2);
  }
}

function MultiplayerParlor({
  room,
  role,
  hostToken,
  testMode
}: {
  room: string;
  role: Role;
  hostToken: string | null;
  testMode: boolean;
}) {
  const [state, setState] = useState<State | null>(null);
  const [connected, setConnected] = useState(false);
  const [showDisconnectOverlay, setShowDisconnectOverlay] = useState(false);
  const [deviceId] = useState(() => getDeviceId());
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("parlor:muted") === "1";
    } catch {
      return false;
    }
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 1;
    try {
      const raw = localStorage.getItem("parlor:volume");
      if (raw == null) return 1;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return 1;
      return Math.max(0, Math.min(1, parsed));
    } catch {
      return 1;
    }
  });
  useEffect(() => {
    setAudioVolume(volume);
    try {
      localStorage.setItem("parlor:volume", String(volume));
    } catch {
      // ignore
    }
  }, [volume]);
  const [effectiveHostToken] = useState(() => {
    if (hostToken) return hostToken;
    if (typeof window === "undefined" || role !== "host") return null;
    try {
      return localStorage.getItem(`hoodwinked:host:${room}`);
    } catch {
      return null;
    }
  });
  useEffect(() => {
    setAudioMuted(muted);
    try {
      localStorage.setItem("parlor:muted", muted ? "1" : "0");
    } catch {
      // ignore
    }
  }, [muted]);

  /* eslint-disable react-hooks/set-state-in-effect -- syncs overlay visibility to socket connection state */
  useEffect(() => {
    if (connected) {
      setShowDisconnectOverlay(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setShowDisconnectOverlay(true), 10000);
    return () => window.clearTimeout(timer);
  }, [connected]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const retryConnection = () => {
    if (typeof window !== "undefined") window.location.reload();
  };
  const leaveRoom = () => {
    if (typeof window !== "undefined") window.location.href = "/";
  };

  const disconnectOverlay = showDisconnectOverlay && !connected ? (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="disconnect-overlay-title"
      aria-describedby="disconnect-overlay-desc"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(8,14,11,.82)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        padding: 18
      }}
    >
      <div
        style={{
          maxWidth: 380,
          width: "100%",
          background: `linear-gradient(180deg, ${C.surface}, ${C.bgDeep})`,
          border: `1px solid ${C.line}`,
          borderRadius: 14,
          padding: "22px 22px 18px",
          textAlign: "center",
          boxShadow: "0 24px 60px rgba(0,0,0,.6)"
        }}
      >
        <div style={{ color: C.coral, fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
          Connection lost
        </div>
        <div id="disconnect-overlay-title" className="disp" style={{ color: C.cream, fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
          We can&apos;t reach room {room.toUpperCase()}
        </div>
        <div id="disconnect-overlay-desc" className="body" style={{ color: C.creamDim, fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
          You&apos;ve been disconnected for a few seconds. Check your connection, then try again — or leave the room.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={retryConnection}
            className="disp"
            style={{
              border: `1px solid ${C.gold}`,
              background: `linear-gradient(180deg, ${C.gold}, ${C.goldDim})`,
              color: C.bgDeep,
              borderRadius: 8,
              padding: "10px 18px",
              fontWeight: 900,
              fontSize: 14,
              cursor: "pointer"
            }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={leaveRoom}
            className="body"
            style={{
              border: `1px solid ${C.line}`,
              background: "rgba(9,19,14,.5)",
              color: C.cream,
              borderRadius: 8,
              padding: "10px 16px",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            Leave room
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const partyHost =
    process.env.NEXT_PUBLIC_PARTYKIT_HOST ??
    (typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "localhost:1999"
      : "");

  const socket = usePartySocket({
    host: partyHost,
    room: room.toLowerCase(),
    party: "main",
    onOpen: () => setConnected(true),
    onClose: () => setConnected(false),
    onMessage: (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "STATE") setState(msg.state as State);
      } catch {
        // ignore malformed
      }
    }
  });

  const dispatch = (action: Action) => {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "ACTION", action, hostToken: effectiveHostToken ?? undefined }));
  };

  const addTestPlayers = () => {
    ["test-1", "test-2", "test-3"].forEach((id, i) => {
      if (state?.players[id]) return;
      dispatch({ type: "JOIN", id, name: ["Scout", "Rook", "Vega"][i] });
    });
  };

  const fillTestAnswers = () => {
    if (!state || state.phase !== "writing") return;
    const ids = joinedIds(state);
    if (state.mode === "quiplash") {
      let i = 0;
      state.quipPrompts.forEach((q) => {
        q.writers.forEach((w) => {
          if (q.answers[w] == null) {
            dispatch({ type: "SUBMIT_QUIP", promptId: q.id, playerId: w, text: BOT_ANSWERS[i++ % BOT_ANSWERS.length] });
          }
        });
      });
      return;
    }
    if (state.mode === "trivia") {
      const q = state.trivia.questions[state.round - 1];
      if (!q) return;
      ids.forEach((pid) => {
        if (!state.trivia.answers[pid]) dispatch({ type: "SUBMIT_TRIVIA", playerId: pid, choice: q.correctIndex, at: Date.now() });
      });
      return;
    }
    if (state.mode === "picture") {
      const item = state.picture.items[state.round - 1];
      if (!item) return;
      ids.forEach((pid) => {
        if (!state.picture.guesses[pid]?.correct) dispatch({ type: "SUBMIT_PICTURE", playerId: pid, text: item.answer, at: Date.now() });
      });
      return;
    }
    if (state.mode === "wheel") {
      const puzzle = state.wheel.puzzles[state.round - 1];
      const solver = ids[0];
      if (puzzle && solver) dispatch({ type: "SOLVE_WHEEL", playerId: solver, text: puzzle.text });
      return;
    }
    if (state.mode === "feud") {
      const q = state.feud.questions[state.round - 1];
      if (!q) return;
      ids.forEach((pid, i) => {
        const answer = q.answers[i % q.answers.length];
        if (answer) dispatch({ type: "SUBMIT_FEUD", playerId: pid, text: answer.text, at: Date.now() + i });
      });
      return;
    }
    ids.forEach((pid, i) => {
      if (state.answers[pid] == null) dispatch({ type: "SUBMIT_ANSWER", playerId: pid, text: BOT_ANSWERS[i % BOT_ANSWERS.length] });
    });
  };

  const fillTestVotes = () => {
    if (!state || state.phase !== "voting") return;
    if (state.mode === "quiplash") {
      const prompt = state.quipPrompts[state.quipIndex];
      if (!prompt) return;
      const promptVotes = state.quipVotes[prompt.id] ?? {};
      joinedIds(state).forEach((pid) => {
        if (prompt.writers.includes(pid) || promptVotes[pid] != null) return;
        dispatch({ type: "VOTE_QUIP", promptId: prompt.id, voterId: pid, ownerId: prompt.writers[0] });
      });
      return;
    }
    const owners = Object.keys(state.answers);
    joinedIds(state).forEach((pid) => {
      if (state.votes[pid] != null) return;
      const choice = owners.find((owner) => owner !== pid);
      if (choice) dispatch({ type: "VOTE", voterId: pid, ownerId: choice });
    });
  };

  const prevPhase = useRef<Phase | null>(null);
  useEffect(() => {
    if (!state) return;
    const prev = prevPhase.current;
    prevPhase.current = state.phase;
    if (prev === null || prev === state.phase) return;
    if (state.phase === "voting") { playLockSound(); hapticReveal(); }
    else if (state.phase === "reveal") { playRevealSound(); hapticReveal(); }
    else if (state.phase === "gameover") { playWinSound(); hapticWin(); }
  }, [state]);

  if (!state) {
    return (
      <div
        className="parlor-root body"
        style={{
          background: C.bg,
          minHeight: "100vh",
          color: C.cream,
          display: "grid",
          placeItems: "center",
          padding: 24,
          textAlign: "center"
        }}
      >
        <style>{FONT_CSS}</style>
        <div>
          <BrandLogo size={150} />
          <div className="body" style={{ marginTop: 10, color: C.creamDim }}>
            {connected ? "Loading room…" : `Connecting to ${room}…`}
          </div>
        </div>
        {disconnectOverlay}
      </div>
    );
  }

  return (
    <div
      className="parlor-root body"
      style={{ background: C.bg, minHeight: "100vh", padding: "20px 16px 40px" }}
    >
      <style>{FONT_CSS}</style>
      {disconnectOverlay}
      <div style={{ maxWidth: role === "play" ? 880 : 1320, margin: "0 auto" }}>
        {role !== "play" && (
          <Board
            state={state}
            dispatch={dispatch}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            volume={volume}
            onVolumeChange={setVolume}
            allowSinglePlayerStart={!!effectiveHostToken}
          />
        )}
        {role !== "play" && testMode && (
          <div
            className="flex flex-wrap items-center justify-center"
            style={{
              gap: 8,
              margin: "14px auto 0",
              padding: 10,
              maxWidth: 720,
              border: `1px dashed ${C.line}`,
              borderRadius: 10,
              background: `${C.bgDeep}88`
            }}
          >
            <span className="body" style={{ color: C.creamDim, fontSize: 11, fontWeight: 800, letterSpacing: 1.4 }}>
              TEST TOOLS
            </span>
            {state.phase === "lobby" && (
              <button onClick={addTestPlayers} className="body" style={devBtn}>
                Add test players
              </button>
            )}
            {state.phase === "writing" && (
              <button onClick={fillTestAnswers} className="body" style={devBtn}>
                Fill answers
              </button>
            )}
            {state.phase === "voting" && (
              <button onClick={fillTestVotes} className="body" style={devBtn}>
                Fill votes
              </button>
            )}
            {state.phase === "writing" && (
              <button onClick={() => dispatch({ type: "FORCE_VOTING" })} className="body" style={devBtn}>
                End round
              </button>
            )}
          </div>
        )}
        {role !== "host" && (
          <>
            <div style={{ margin: "26px 2px 12px" }} className="flex items-center justify-between">
              <div>
                <div
                  className="disp"
                  style={{ color: C.cream, fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}
                >
                  Player Console
                </div>
                <div className="body" style={{ color: C.creamDim, fontSize: 11, marginTop: 2 }}>
                  {PLAY_URL}
                </div>
              </div>
              <div className="body" style={{ color: C.creamDim, fontSize: 11 }}>
                {connected ? "connected" : "reconnecting…"}
              </div>
            </div>
            <div className="flex justify-center" style={{ gap: 12 }}>
              <Phone
                deviceId={deviceId}
                state={state}
                dispatch={dispatch}
                fullSize
                connected={connected}
                onRemove={() => {
                  // No-op in multiplayer — close the tab to leave.
                }}
              />
            </div>
          </>
        )}
        {role === "host" && <HostJoinCard room={room} connected={connected} hostToken={effectiveHostToken} />}
      </div>
    </div>
  );
}

/* ---- style helpers ------------------------------------------------------- */
const landingPanel: React.CSSProperties = {
  background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bgDeep} 100%)`,
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  padding: 16,
  boxShadow: "0 12px 34px rgba(0,0,0,.24)"
};
const eyebrowStyle: React.CSSProperties = {
  color: C.gold,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 2,
  marginBottom: 6
};
const modeChip = (active: boolean): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 0,
  minWidth: 0,
  padding: 6,
  background: active ? "rgba(255,193,94,.12)" : "rgba(10, 19, 14, .72)",
  color: C.creamDim,
  border: `1px solid ${active ? C.gold : C.line}`,
  borderRadius: 8,
  cursor: active ? "default" : "pointer",
  letterSpacing: 0,
  textAlign: "left",
  overflow: "visible",
  position: "relative",
  zIndex: active ? 5 : 1,
  transform: active ? "scale(1.12)" : "scale(1)",
  transformOrigin: "center",
  transition: "transform 420ms cubic-bezier(.2,.85,.2,1), box-shadow 420ms ease, border-color 420ms ease",
  boxShadow: active ? `0 22px 44px rgba(0,0,0,.42), 0 0 0 1px ${C.gold}44` : "none"
});
const hostBtn = (enabled: boolean): React.CSSProperties => ({
  fontSize: 16,
  fontWeight: 800,
  padding: "12px 28px",
  borderRadius: 8,
  border: `1px solid ${enabled ? C.gold : C.line}`,
  cursor: enabled ? "pointer" : "not-allowed",
  background: enabled ? `linear-gradient(180deg, ${C.gold} 0%, ${C.goldDim} 100%)` : C.surface2,
  color: enabled ? C.bgDeep : C.creamDim,
  letterSpacing: 0.2,
  boxShadow: enabled ? "0 10px 24px rgba(0,0,0,.28)" : "none"
});
const ghostBtn: React.CSSProperties = {
  display: "block",
  margin: "10px auto 0",
  background: "none",
  border: "none",
  color: C.line,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600
};
const devBtn: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.line}`,
  color: C.creamDim,
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer"
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: C.surface,
  border: `1px solid ${C.line}`,
  color: C.cream,
  borderRadius: 10,
  padding: "8px 10px",
  fontSize: 13,
  outline: "none"
};
const phoneBtn = (enabled: boolean, color: string, large = false): React.CSSProperties => ({
  width: "100%",
  marginTop: 6,
  padding: large ? "13px 14px" : "8px 10px",
  borderRadius: 10,
  border: "none",
  background: enabled ? color : C.surface2,
  color: enabled ? C.bgDeep : C.creamDim,
  fontWeight: 700,
  fontSize: large ? 16 : 13,
  cursor: enabled ? "pointer" : "not-allowed"
});
const secondaryPhoneBtn: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  background: "transparent",
  color: C.creamDim,
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer"
};
const iconBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  background: C.surface,
  color: C.gold,
  cursor: "pointer",
  fontSize: 16,
  fontWeight: 800,
  lineHeight: 1
};
const phoneNote: React.CSSProperties = {
  color: C.creamDim,
  fontSize: 12,
  lineHeight: 1.4,
  padding: "6px 0"
};
