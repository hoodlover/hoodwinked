"use client";

import React, { useReducer, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePartySocket } from "partysocket/react";
import {
  POINTS_PER_VOTE,
  VOTING_SECONDS,
  WRITING_SECONDS,
  joinedIds,
  makeInitialState,
  makeRoomCode,
  reducer,
  type Action,
  type Phase,
  type Player,
  type State
} from "@/lib/engine";

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

/* ---- PERSISTED NAMES ----------------------------------------------------- */
const NAMES_KEY = "parlor:names";

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

/* ---- AUDIO --------------------------------------------------------------- */
let audioCtx: AudioContext | null = null;
let audioMuted = false;
const setAudioMuted = (v: boolean) => {
  audioMuted = v;
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
  if (audioMuted) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + 0.01);
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
  playTone(1180, 0, 0.04, "square", 0.05);
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
@keyframes parlor-fadeup{0%{transform:translateY(10px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes parlor-glow{0%,100%{box-shadow:0 0 0 0 rgba(255,193,94,0);}50%{box-shadow:0 0 22px 2px rgba(255,193,94,.45);}}
@keyframes parlor-fall{0%{transform:translate3d(0,-12vh,0) rotate(0deg);opacity:0;}10%{opacity:1;}100%{transform:translate3d(var(--dx,0),110vh,0) rotate(var(--rot,540deg));opacity:1;}}
@keyframes parlor-stage-drop{0%{transform:translateY(-60px) scale(.7);letter-spacing:14px;filter:blur(6px);opacity:0;}55%{transform:translateY(8px) scale(1.06);letter-spacing:0;filter:blur(0);opacity:1;}75%{transform:translateY(-4px) scale(.99);}100%{transform:translateY(0) scale(1);opacity:1;}}
.parlor-root .stagedrop{animation:parlor-stage-drop .9s cubic-bezier(.22,1.18,.36,1) both;}
@keyframes parlor-typing{0%,80%,100%{transform:translateY(0);opacity:.4;}40%{transform:translateY(-3px);opacity:1;}}
.parlor-root .typing-dot{display:inline-block;width:4px;height:4px;border-radius:999px;margin:0 1px;animation:parlor-typing 1s infinite ease-in-out;}
@keyframes parlor-streak{0%{transform:scale(1);text-shadow:0 0 0 transparent;}30%{transform:scale(1.22);text-shadow:0 0 22px var(--glow,#FFC15E);}70%{transform:scale(1.22);text-shadow:0 0 22px var(--glow,#FFC15E);}100%{transform:scale(1);text-shadow:0 0 0 transparent;}}
.parlor-root .streak{animation:parlor-streak 1.8s ease-out 1 both;display:inline-block;}
@media (max-width: 640px) {
  .parlor-root .phones-row { display: none !important; }
  .parlor-root .board-inner { padding: 8px 4px !important; }
  .parlor-root .board-wrap { padding: 12px !important; border-radius: 16px !important; }
}
@media (max-width: 420px) {
  .parlor-root .board-header { flex-wrap: wrap; gap: 6px; }
}
.parlor-root .bulb{animation:parlor-twinkle 2.4s ease-in-out infinite;}
.parlor-root .popin{animation:parlor-popin .32s cubic-bezier(.34,1.56,.64,1) both;}
.parlor-root .fadeup{animation:parlor-fadeup .35s ease both;}
.parlor-root .glow{animation:parlor-glow 2.2s ease-in-out infinite;}
.parlor-root .confetti{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50;}
.parlor-root .confetti span{position:absolute;top:0;will-change:transform,opacity;animation:parlor-fall linear forwards;}
@media (prefers-reduced-motion: reduce){
  .parlor-root .bulb,.parlor-root .popin,.parlor-root .fadeup,.parlor-root .glow,.parlor-root .stagedrop,.parlor-root .confetti span,.parlor-root .typing-dot,.parlor-root .streak{animation:none !important;}
  .parlor-root .confetti{display:none;}
}
`;

type ConfettiPiece = {
  left: number;
  size: number;
  dx: number;
  rot: number;
  dur: number;
  delay: number;
  color: string;
  round: boolean;
};

function Confetti({ count = 90, palette }: { count?: number; palette: string[] }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const paletteKey = palette.join(",");
  useEffect(() => {
    const pal = paletteKey.split(",");
    // Client-only Math.random — runs once per palette change to avoid SSR hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPieces(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        size: 6 + Math.random() * 8,
        dx: (Math.random() - 0.5) * 40,
        rot: 360 + Math.random() * 720 * (Math.random() < 0.5 ? -1 : 1),
        dur: 3.2 + Math.random() * 2.4,
        delay: Math.random() * 1.2,
        color: pal[Math.floor(Math.random() * pal.length)],
        round: Math.random() < 0.3
      }))
    );
  }, [count, paletteKey]);
  if (pieces.length === 0) return null;
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            borderRadius: p.round ? 999 : 2,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            ["--dx" as string]: `${p.dx}vw`,
            ["--rot" as string]: `${p.rot}deg`
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
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

/* ---- THE BOARD (the TV / shared screen) ---------------------------------- */
function Board({
  state,
  dispatch,
  muted,
  onToggleMute
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  muted: boolean;
  onToggleMute: () => void;
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
    state.phase === "writing" ? WRITING_SECONDS : state.phase === "voting" ? VOTING_SECONDS : 0;
  const remaining = state.phaseDeadline ? Math.max(0, state.phaseDeadline - now) : 0;
  const remainingPct = phaseTotal ? (remaining / (phaseTotal * 1000)) * 100 : 0;
  const remainingSec = Math.ceil(remaining / 1000);
  const lowTime = remaining > 0 && remaining < 10_000;

  const [introRound, setIntroRound] = useState<number | null>(null);
  useEffect(() => {
    if (state.phase !== "writing") return;
    // Drive a timed UI flow off the round transition; cleared by setTimeout below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIntroRound(state.round);
    const id = setTimeout(() => setIntroRound(null), 1400);
    return () => clearTimeout(id);
  }, [state.phase, state.round]);
  const introVisible = state.phase === "writing" && introRound === state.round;

  return (
    <div
      className="board-wrap"
      style={{
        background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)`,
        border: `1px solid ${C.line}`,
        borderRadius: 22,
        padding: 18,
        boxShadow: "0 20px 60px rgba(0,0,0,.35)"
      }}
    >
      <Bulbs />
      <div className="board-inner" style={{ padding: "16px 8px 8px" }}>
        <div className="flex items-center justify-between board-header" style={{ marginBottom: 14 }}>
          <div className="disp" style={{ fontSize: 26, fontWeight: 800, color: C.gold, letterSpacing: 1 }}>
            HOODWINKED
          </div>
          {state.phase !== "lobby" && state.phase !== "gameover" && (
            <div className="body" style={{ color: C.creamDim, fontSize: 13, fontWeight: 600 }}>
              Round {state.round} / {state.totalRounds}
            </div>
          )}
          <div className="flex items-center" style={{ gap: 10 }}>
            <button
              onClick={onToggleMute}
              aria-label={muted ? "Unmute sound" : "Mute sound"}
              title={muted ? "Unmute" : "Mute"}
              suppressHydrationWarning
              style={{
                background: "none",
                border: "none",
                color: muted ? C.creamDim : C.gold,
                cursor: "pointer",
                fontSize: 16,
                padding: 4,
                lineHeight: 1
              }}
            >
              <span suppressHydrationWarning>{muted ? "🔇" : "🔊"}</span>
            </button>
            <div className="body" style={{ color: C.creamDim, fontSize: 13 }}>
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
          <div className="popin" style={{ textAlign: "center", padding: "26px 0 18px" }}>
            <div className="body" style={{ color: C.creamDim, fontSize: 14, marginBottom: 6 }}>
              Join on your phone with the code
            </div>
            <div
              className="disp"
              style={{
                fontSize: "clamp(48px, 16vw, 76px)",
                fontWeight: 800,
                color: C.gold,
                letterSpacing: "clamp(4px, 1.5vw, 8px)",
                lineHeight: 1
              }}
            >
              {state.roomCode}
            </div>
            <div
              className="flex flex-wrap justify-center"
              style={{ gap: 8, margin: "22px auto", maxWidth: 520 }}
            >
              {players.length === 0 && (
                <span className="body" style={{ color: C.creamDim }}>
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
                    padding: "6px 14px"
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: p.color,
                      boxShadow: `0 0 8px ${p.color}`
                    }}
                  />
                  <span className="body" style={{ color: C.cream, fontWeight: 600 }}>
                    {p.name}
                  </span>
                </span>
              ))}
            </div>
            <div
              className="flex justify-center"
              style={{ gap: 0, margin: "0 auto 18px", maxWidth: 360 }}
            >
              <button
                onClick={() => state.mode !== "classic" && dispatch({ type: "TOGGLE_MODE" })}
                className="disp"
                style={modePill(state.mode === "classic", "left")}
              >
                Classic
              </button>
              <button
                onClick={() => state.mode !== "quiplash" && dispatch({ type: "TOGGLE_MODE" })}
                className="disp"
                style={modePill(state.mode === "quiplash", "right")}
              >
                Quiplash
              </button>
            </div>
            <div
              className="body"
              style={{ color: C.creamDim, fontSize: 12, lineHeight: 1.5, maxWidth: 440, margin: "0 auto 14px" }}
            >
              {state.mode === "classic"
                ? "Everyone answers the same prompt. Vote for your favorite."
                : "Each prompt is given to two players. Everyone else votes between the answers. Needs 3+."}
            </div>
            {(() => {
              const min = state.mode === "quiplash" ? 3 : 2;
              const enabled = players.length >= min;
              return (
                <button
                  onClick={() => dispatch({ type: "START_GAME" })}
                  disabled={!enabled}
                  className="disp glow"
                  style={hostBtn(enabled)}
                >
                  {enabled ? "Start the show" : `Need ${min}+ players`}
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
                fontSize: "clamp(22px, 5vw, 34px)",
                fontWeight: 800,
                color: C.cream,
                lineHeight: 1.15,
                maxWidth: 640,
                margin: "0 auto"
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
                style={{ fontSize: 22, fontWeight: 600, color: C.creamDim, maxWidth: 540, margin: "0 auto 14px" }}
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
                style={{ fontSize: 22, fontWeight: 600, color: C.creamDim, maxWidth: 600, margin: "0 auto" }}
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
                  style={{ fontSize: 26, fontWeight: 700, color: C.cream, maxWidth: 600, margin: "0 auto" }}
                >
                  {prompt.text}
                </div>
              </div>
              <div className="flex flex-wrap justify-center" style={{ gap: 14, maxWidth: 720, margin: "0 auto" }}>
                {[a1, a2].map((text, i) => (
                  <div
                    key={i}
                    className="popin"
                    style={{
                      flex: "1 1 280px",
                      minWidth: 240,
                      maxWidth: 340,
                      background: C.surface2,
                      border: `1px solid ${C.line}`,
                      borderRadius: 16,
                      padding: "18px 20px",
                      textAlign: "center",
                      animationDelay: `${i * 0.08}s`
                    }}
                  >
                    <span className="disp" style={{ color: C.cream, fontSize: 22, fontWeight: 700 }}>
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
                className="disp glow"
                style={hostBtn(true)}
              >
                {state.round >= state.totalRounds ? "Final results" : "Next round"}
              </button>
            </div>
          </div>
        )}

        {state.phase === "gameover" &&
          (() => {
            const ranked = [...players].sort((a, b) => b.score - a.score);
            const top = ranked[0];
            if (!top) return null;
            const winners = ranked.filter((p) => p.score === top.score);
            const isTie = winners.length > 1;
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
                <div className="body" style={{ color: C.creamDim, letterSpacing: 3, fontSize: 12, fontWeight: 700 }}>
                  {isTie ? `${winners.length}-WAY TIE` : "WINNER"}
                </div>
                {isTie ? (
                  <div className="flex flex-wrap justify-center" style={{ gap: 16, margin: "10px 0 4px" }}>
                    {winners.map((w) => (
                      <div
                        key={w.id}
                        className="disp"
                        style={{
                          fontSize: 42,
                          fontWeight: 800,
                          color: w.color,
                          textShadow: `0 0 24px ${w.color}66`
                        }}
                      >
                        {w.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="disp"
                    style={{
                      fontSize: "clamp(38px, 10vw, 56px)",
                      fontWeight: 800,
                      color: top.color,
                      textShadow: `0 0 30px ${top.color}66`,
                      margin: "6px 0 4px"
                    }}
                  >
                    {top.name}
                  </div>
                )}
                <div className="disp" style={{ fontSize: 24, color: C.gold, marginBottom: 20 }}>
                  {top.score} pts
                </div>
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
        style={{ fontSize: 22, fontWeight: 700, color: C.creamDim, maxWidth: 600, margin: "0 auto 18px" }}
      >
        {prompt.text}
      </div>
      <div
        className="flex flex-wrap justify-center"
        style={{ gap: 14, maxWidth: 760, margin: "0 auto" }}
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
              maxWidth: 340,
              background: isWinner ? `${player.color}22` : C.surface2,
              border: `1px solid ${isWinner ? player.color : C.line}`,
              borderRadius: 16,
              padding: "16px 18px",
              textAlign: "center",
              boxShadow: isWinner ? `0 0 24px ${player.color}55` : "none"
            }}
          >
            <div className="disp" style={{ color: C.cream, fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
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
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 999,
          background: player.color,
          boxShadow: `0 0 8px ${player.color}`
        }}
      />
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

/* ---- A PHONE (one player's controller) ----------------------------------- */
function Phone({
  deviceId,
  state,
  dispatch,
  onRemove
}: {
  deviceId: string;
  state: State;
  dispatch: React.Dispatch<Action>;
  onRemove: () => void;
}) {
  const player = state.players[deviceId];
  const [name, setName] = useState(() => readSavedName(deviceId));
  const [draft, setDraft] = useState("");

  const joinWithName = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    saveName(deviceId, trimmed);
    dispatch({ type: "JOIN", id: deviceId, name: trimmed });
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

  return (
    <div
      style={{
        width: 188,
        flexShrink: 0,
        background: C.bgDeep,
        border: `1px solid ${player ? player.color : C.line}`,
        borderRadius: 20,
        padding: 12,
        position: "relative",
        boxShadow: player
          ? `0 0 0 1px ${player.color}22, 0 8px 24px rgba(0,0,0,.3)`
          : "0 8px 24px rgba(0,0,0,.3)"
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <span className="body" style={{ fontSize: 10, color: C.creamDim, letterSpacing: 1 }}>
          📱 phone
        </span>
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
      </div>

      {!player && (
        <div>
          <div className="disp" style={{ color: C.gold, fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
            Join {state.roomCode}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={14}
            className="body"
            style={inputStyle}
            onKeyDown={(e) => {
              if (e.key === "Enter") joinWithName(name);
            }}
          />
          <button
            onClick={() => joinWithName(name)}
            disabled={state.phase !== "lobby" || !name.trim()}
            className="body"
            style={phoneBtn(state.phase === "lobby" && !!name.trim(), C.gold)}
          >
            {state.phase === "lobby" ? "Join" : "Game in progress"}
          </button>
        </div>
      )}

      {player && (
        <div>
          <div className="flex items-center" style={{ gap: 7, marginBottom: 10 }}>
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: 999,
                background: player.color,
                boxShadow: `0 0 8px ${player.color}`
              }}
            />
            <span className="body" style={{ color: C.cream, fontWeight: 700, fontSize: 14 }}>
              {player.name}
            </span>
            <span className="body" style={{ marginLeft: "auto", color: C.creamDim, fontSize: 12 }}>
              {player.score}
            </span>
          </div>

          {state.phase === "lobby" && (
            <div className="body" style={phoneNote}>
              You&apos;re in. Watch the big screen ☝️
            </div>
          )}

          {state.phase === "writing" && state.mode === "classic" &&
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
                  style={phoneBtn(!!draft.trim(), player.color)}
                >
                  Send it
                </button>
              </div>
            ))}

          {state.phase === "writing" && state.mode === "quiplash" && (
            <QuipWritingPhone state={state} dispatch={dispatch} player={player} />
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

function getURLParams(): { room: string | null; role: Role; local: boolean } {
  if (typeof window === "undefined") return { room: null, role: "both", local: false };
  const p = new URLSearchParams(window.location.search);
  const room = p.get("room");
  const rawRole = p.get("role");
  const role: Role = rawRole === "host" || rawRole === "play" ? rawRole : "both";
  return {
    room: room ? room.toUpperCase() : null,
    role,
    local: p.get("local") === "1"
  };
}

export default function Parlor() {
  const [params] = useState(getURLParams);
  if (params.room) return <MultiplayerParlor room={params.room} role={params.role} />;
  if (params.local) return <LocalParlor />;
  return <ParlorLanding />;
}

function ParlorLanding() {
  const [code, setCode] = useState<string | null>(null);
  const start = () => {
    const c = makeRoomCode();
    setCode(c);
    if (typeof window !== "undefined") {
      window.location.href = `/?room=${c}&role=host`;
    }
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
        textAlign: "center"
      }}
    >
      <style>{FONT_CSS}</style>
      <div style={{ maxWidth: 460 }}>
        <div className="disp" style={{ fontSize: "clamp(40px, 12vw, 60px)", fontWeight: 800, color: C.gold, letterSpacing: 4 }}>
          HOODWINKED
        </div>
        <div className="body" style={{ color: C.creamDim, marginTop: 8, marginBottom: 26, fontSize: 14 }}>
          Fool the room. Win the night.
        </div>
        <button onClick={start} className="disp glow" style={hostBtn(true)}>
          {code ? `Opening ${code}…` : "Start a room"}
        </button>
        <div className="body" style={{ color: C.creamDim, fontSize: 12, marginTop: 26, lineHeight: 1.6 }}>
          Players join by opening{" "}
          <code style={{ color: C.cream }}>playhoodwinked.com?room=CODE&amp;role=play</code> on their phone.
          <br />
          The host opens the room on a TV / laptop.
          <br />
          <Link
            href="/?local=1"
            style={{ color: C.line, textDecoration: "none", borderBottom: `1px dotted ${C.line}` }}
          >
            Try the local prototype →
          </Link>
        </div>
      </div>
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
    if (state.phase === "voting") playLockSound();
    else if (state.phase === "reveal") playRevealSound();
    else if (state.phase === "gameover") playWinSound();
  }, [state.phase]);

  const addPhone = () => {
    idCounter.current += 1;
    const next = `d${idCounter.current}`;
    setDevices((d) => (d.length >= 8 ? d : [...d, next]));
  };
  const removePhone = (id: string) => setDevices((d) => d.filter((x) => x !== id));

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
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Board state={state} dispatch={dispatch} muted={muted} onToggleMute={() => setMuted((m) => !m)} />

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

function HostJoinCard({ room, connected }: { room: string; connected: boolean }) {
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin
  );
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const joinUrl = origin ? `${origin}/?room=${room}&role=play` : "";
  useEffect(() => {
    if (!joinUrl) return;
    let cancelled = false;
    import("qrcode").then(({ default: QRCode }) =>
      QRCode.toDataURL(joinUrl, {
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
  }, [joinUrl]);
  return (
    <div
      className="flex flex-wrap items-center justify-center"
      style={{ marginTop: 24, gap: 22, padding: "16px 12px" }}
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
        <div style={{ color: C.cream, fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
          PLAYERS JOIN HERE
        </div>
        <code style={{ color: C.cream, fontSize: 11, wordBreak: "break-all" }}>
          {joinUrl || `?room=${room}&role=play`}
        </code>
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

function MultiplayerParlor({ room, role }: { room: string; role: Role }) {
  const [state, setState] = useState<State | null>(null);
  const [connected, setConnected] = useState(false);
  const [deviceId] = useState(() => getDeviceId());
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("parlor:muted") === "1";
    } catch {
      return false;
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
    socket.send(JSON.stringify({ type: "ACTION", action }));
  };

  const prevPhase = useRef<Phase | null>(null);
  useEffect(() => {
    if (!state) return;
    const prev = prevPhase.current;
    prevPhase.current = state.phase;
    if (prev === null || prev === state.phase) return;
    if (state.phase === "voting") playLockSound();
    else if (state.phase === "reveal") playRevealSound();
    else if (state.phase === "gameover") playWinSound();
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
          <div className="disp" style={{ fontSize: 28, fontWeight: 800, color: C.gold }}>
            HOODWINKED
          </div>
          <div className="body" style={{ marginTop: 10, color: C.creamDim }}>
            {connected ? "Loading room…" : `Connecting to ${room}…`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="parlor-root body"
      style={{ background: C.bg, minHeight: "100vh", padding: "20px 16px 40px" }}
    >
      <style>{FONT_CSS}</style>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {role !== "play" && (
          <Board state={state} dispatch={dispatch} muted={muted} onToggleMute={() => setMuted((m) => !m)} />
        )}
        {role !== "host" && (
          <>
            <div style={{ margin: "26px 2px 12px" }} className="flex items-center justify-between">
              <div
                className="disp"
                style={{ color: C.creamDim, fontWeight: 600, fontSize: 14, letterSpacing: 1 }}
              >
                YOUR PHONE
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
                onRemove={() => {
                  // No-op in multiplayer — close the tab to leave.
                }}
              />
            </div>
          </>
        )}
        {role === "host" && <HostJoinCard room={room} connected={connected} />}
      </div>
    </div>
  );
}

/* ---- style helpers ------------------------------------------------------- */
const modePill = (active: boolean, side: "left" | "right"): React.CSSProperties => ({
  flex: 1,
  fontSize: 13,
  fontWeight: 700,
  padding: "8px 14px",
  background: active ? C.gold : C.surface2,
  color: active ? C.bgDeep : C.creamDim,
  border: `1px solid ${C.line}`,
  borderRadius: side === "left" ? "999px 0 0 999px" : "0 999px 999px 0",
  cursor: active ? "default" : "pointer",
  letterSpacing: 0.3
});
const hostBtn = (enabled: boolean): React.CSSProperties => ({
  fontSize: 17,
  fontWeight: 800,
  padding: "12px 28px",
  borderRadius: 999,
  border: "none",
  cursor: enabled ? "pointer" : "not-allowed",
  background: enabled ? C.gold : C.surface2,
  color: enabled ? C.bgDeep : C.creamDim,
  letterSpacing: 0.5
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
const phoneBtn = (enabled: boolean, color: string): React.CSSProperties => ({
  width: "100%",
  marginTop: 6,
  padding: "8px 10px",
  borderRadius: 10,
  border: "none",
  background: enabled ? color : C.surface2,
  color: enabled ? C.bgDeep : C.creamDim,
  fontWeight: 700,
  fontSize: 13,
  cursor: enabled ? "pointer" : "not-allowed"
});
const phoneNote: React.CSSProperties = {
  color: C.creamDim,
  fontSize: 12,
  lineHeight: 1.4,
  padding: "6px 0"
};
