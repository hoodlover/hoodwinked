"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DIFFICULTIES = {
  easy: { label: "Easy", time: 60, minLen: 3, maxLen: 4, maxShift: 6, hitBonus: 2, missPenalty: 2, multiplier: 1 },
  medium: { label: "Medium", time: 60, minLen: 4, maxLen: 6, maxShift: 13, hitBonus: 1, missPenalty: 3, multiplier: 2 },
  hard: { label: "Hard", time: 45, minLen: 5, maxLen: 8, maxShift: 25, hitBonus: 1, missPenalty: 4, multiplier: 3 }
};

const C = {
  dark: "#09130e",
  cream: "#fbf3e4",
  muted: "#d9d2bd",
  gold: "#ffc15e",
  line: "#81a475",
  panel: "#1f3320",
  panel2: "#2f5632",
  hit: "#cf4f45",
  green: "#6fb071",
  blue: "#6fb6d8"
};

const WORDS = [
  "JOB", "RAT", "TAB", "TIP", "BAG", "GUN", "FIX", "CON", "MOB", "ICE", "HIT",
  "SAFE", "LOOT", "HEAT", "BOSS", "WIRE", "CASH", "CODE", "DEAL", "HEAD",
  "CLUE", "DOCK", "MASK", "VAULT", "ALIBI", "BRIBE", "CROOK", "ROBBE", "STAKE",
  "HEIST", "ALLEY", "BADGE", "GHOST", "CHASE", "SCORE", "SQUAD", "MOUSE",
  "INFORM", "HOTEL", "PRECINCT", "INSIDER", "WITNESS", "SUSPECT", "GETAWAY",
  "HOSTAGE", "OFFICER", "SHADOW", "STING", "LEDGER", "BROKER", "MUSCLE",
  "ALIBIS", "RUMORS", "SQUEEZE", "SHAKEDOWN", "BACKROOM", "LOCKBOX",
  "PASSWORD", "FINGERPRINT", "RANSOM", "DOCKSIDE", "SMUGGLE", "EVIDENCE",
  "PAYROLL", "GAMBIT", "WHISPER", "INFORMANT", "STAKEOUT", "BLACKMAIL",
  "SCRAMBLE", "MIDNIGHT", "WIRETAP", "FUGITIVE", "DETECTIVE", "MARKED",
  "PAYOFF", "WARRANT", "CURFEW", "PERIMETER"
];

const SHAKE_KEYS = `
  @keyframes cipher-shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(3px); }
  }
  @keyframes cipher-pop {
    0% { opacity: 0; transform: scale(.6); }
    60% { opacity: 1; transform: scale(1.18); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes cipher-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,193,94,.55); }
    50% { box-shadow: 0 0 0 14px rgba(255,193,94,0); }
  }
`;

const HIGH_SCORE_KEY = "hoodwinked.cipher-sweep.best";

function shiftLetter(ch, shift) {
  const code = ch.charCodeAt(0);
  if (code < 65 || code > 90) return ch;
  return String.fromCharCode(((code - 65 + shift) % 26 + 26) % 26 + 65);
}

function shiftWord(word, shift) {
  let out = "";
  for (let i = 0; i < word.length; i += 1) out += shiftLetter(word[i], shift);
  return out;
}

function pickWord(min, max) {
  const pool = WORDS.filter((w) => w.length >= min && w.length <= max);
  if (pool.length === 0) return WORDS[Math.floor(Math.random() * WORDS.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

function makePuzzle(difficulty) {
  const settings = DIFFICULTIES[difficulty];
  const word = pickWord(settings.minLen, settings.maxLen);
  let shift = Math.floor(Math.random() * settings.maxShift) + 1;
  if (shift === 0) shift = 1;
  return {
    answer: word,
    cipher: shiftWord(word, shift),
    appliedShift: shift,
    playerShift: 0
  };
}

function readBest() {
  if (typeof window === "undefined") return { easy: 0, medium: 0, hard: 0 };
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
    if (!raw) return { easy: 0, medium: 0, hard: 0 };
    const parsed = JSON.parse(raw);
    return {
      easy: Number(parsed?.easy) || 0,
      medium: Number(parsed?.medium) || 0,
      hard: Number(parsed?.hard) || 0
    };
  } catch {
    return { easy: 0, medium: 0, hard: 0 };
  }
}

function writeBest(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(next));
  } catch {}
}

export default function CipherSweep() {
  const [phase, setPhase] = useState("setup");
  const [difficulty, setDifficulty] = useState("medium");
  const [puzzle, setPuzzle] = useState(null);
  const [timeMs, setTimeMs] = useState(0);
  const [solved, setSolved] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [best, setBest] = useState({ easy: 0, medium: 0, hard: 0 });
  const tickRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const endRef = useRef(0);

  useEffect(() => {
    setBest(readBest());
  }, []);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, []);

  const settings = DIFFICULTIES[difficulty];

  const finishRound = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    setPhase((current) => {
      if (current !== "play") return current;
      setScore((finalScore) => {
        setBest((prev) => {
          const prior = prev[difficulty] || 0;
          if (finalScore > prior) {
            const next = { ...prev, [difficulty]: finalScore };
            writeBest(next);
            return next;
          }
          return prev;
        });
        return finalScore;
      });
      return "result";
    });
  }, [difficulty]);

  const startRound = useCallback(
    (chosen) => {
      const lvl = chosen || difficulty;
      const lvlSettings = DIFFICULTIES[lvl];
      setDifficulty(lvl);
      setPuzzle(makePuzzle(lvl));
      setSolved(0);
      setScore(0);
      setFeedback(null);
      const totalMs = lvlSettings.time * 1000;
      setTimeMs(totalMs);
      endRef.current = Date.now() + totalMs;
      setPhase("play");
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        const remain = Math.max(0, endRef.current - Date.now());
        setTimeMs(remain);
        if (remain <= 0) {
          if (tickRef.current) clearInterval(tickRef.current);
          tickRef.current = null;
          finishRound();
        }
      }, 100);
    },
    [difficulty, finishRound]
  );

  const adjustShift = (delta) => {
    if (phase !== "play" || !puzzle) return;
    setPuzzle((prev) => {
      if (!prev) return prev;
      const next = ((prev.playerShift + delta) % 26 + 26) % 26;
      return { ...prev, playerShift: next };
    });
  };

  const flashFeedback = (kind, note) => {
    setFeedback({ kind, note, at: Date.now() });
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 900);
  };

  const lockIn = () => {
    if (phase !== "play" || !puzzle) return;
    const guess = shiftWord(puzzle.cipher, puzzle.playerShift);
    if (guess === puzzle.answer) {
      const remainSec = Math.max(0, Math.floor(timeMs / 1000));
      const gain = 50 + Math.min(50, remainSec) + settings.multiplier * 10;
      setScore((s) => s + gain);
      setSolved((n) => n + 1);
      const bonusMs = settings.hitBonus * 1000;
      endRef.current = Math.min(Date.now() + settings.time * 1000, endRef.current + bonusMs);
      setPuzzle(makePuzzle(difficulty));
      flashFeedback("good", `+${gain}`);
    } else {
      const penaltyMs = settings.missPenalty * 1000;
      endRef.current = endRef.current - penaltyMs;
      const remain = Math.max(0, endRef.current - Date.now());
      setTimeMs(remain);
      flashFeedback("bad", `-${settings.missPenalty}s`);
      if (remain <= 0) finishRound();
    }
  };

  const skip = () => {
    if (phase !== "play" || !puzzle) return;
    const penaltyMs = 2000;
    endRef.current = endRef.current - penaltyMs;
    const remain = Math.max(0, endRef.current - Date.now());
    setTimeMs(remain);
    setPuzzle(makePuzzle(difficulty));
    flashFeedback("bad", "-2s · skip");
    if (remain <= 0) finishRound();
  };

  const preview = useMemo(() => {
    if (!puzzle) return "";
    return shiftWord(puzzle.cipher, puzzle.playerShift);
  }, [puzzle]);

  if (phase === "setup") {
    return (
      <section style={{ display: "grid", gap: 14 }}>
        <style>{SHAKE_KEYS}</style>
        <header style={{ display: "grid", gap: 4 }}>
          <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(26px, 5.5vw, 38px)", letterSpacing: 1 }}>Cipher Sweep</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.5 }}>
            A coded mob message hits the wire. Rotate the cipher dial, crack each word, beat the clock.
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          {Object.entries(DIFFICULTIES).map(([key, info]) => {
            const isActive = difficulty === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDifficulty(key)}
                style={{
                  textAlign: "left",
                  padding: 14,
                  borderRadius: 10,
                  border: `1px solid ${isActive ? C.gold : C.line}`,
                  background: isActive ? "rgba(255,193,94,.12)" : "rgba(10,19,14,.5)",
                  color: C.cream,
                  cursor: "pointer",
                  display: "grid",
                  gap: 4
                }}
              >
                <div style={{ color: isActive ? C.gold : C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>
                  {info.label.toUpperCase()}
                </div>
                <div style={{ fontWeight: 800 }}>{info.time}s · shift 1–{info.maxShift}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>Best: {best[key] || 0}</div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => startRound(difficulty)}
          style={{
            justifySelf: "start",
            padding: "12px 22px",
            borderRadius: 10,
            border: `1px solid ${C.gold}`,
            background: "linear-gradient(180deg, #ffd07a, #ffc15e)",
            color: C.dark,
            fontWeight: 900,
            letterSpacing: 1.2,
            fontSize: 14,
            cursor: "pointer",
            animation: "cipher-pulse 2.4s ease-in-out infinite"
          }}
        >
          START CASE
        </button>
      </section>
    );
  }

  if (phase === "play" && puzzle) {
    const remainSec = Math.ceil(timeMs / 1000);
    const lowOnTime = remainSec <= 10;
    const feedbackColor = feedback?.kind === "good" ? C.green : C.hit;
    return (
      <section style={{ display: "grid", gap: 14 }}>
        <style>{SHAKE_KEYS}</style>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>
              {settings.label.toUpperCase()}
            </div>
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${C.line}`,
                background: "rgba(10,19,14,.6)",
                fontSize: 12,
                fontWeight: 700,
                color: C.cream
              }}
            >
              Cracked: {solved}
            </div>
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${C.gold}`,
                background: "rgba(255,193,94,.12)",
                fontSize: 12,
                fontWeight: 800,
                color: C.gold
              }}
            >
              Score: {score}
            </div>
          </div>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: `1px solid ${lowOnTime ? C.hit : C.gold}`,
              background: lowOnTime ? "rgba(207,79,69,.18)" : "rgba(255,193,94,.12)",
              color: lowOnTime ? C.hit : C.gold,
              fontWeight: 900,
              letterSpacing: 1.2,
              minWidth: 78,
              textAlign: "center"
            }}
          >
            {String(Math.floor(remainSec / 60)).padStart(1, "0")}:
            {String(remainSec % 60).padStart(2, "0")}
          </div>
        </div>

        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${C.line}`,
            background: "linear-gradient(180deg, rgba(31,51,32,.85), rgba(10,19,14,.85))",
            padding: "18px clamp(14px, 4vw, 26px) 22px",
            display: "grid",
            gap: 14,
            animation: feedback?.kind === "bad" ? "cipher-shake 350ms ease-in-out" : "none"
          }}
        >
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4, textAlign: "center" }}>
            INTERCEPTED MESSAGE
          </div>
          <div
            style={{
              textAlign: "center",
              fontFamily: "'Courier New', monospace",
              color: C.muted,
              fontSize: "clamp(22px, 6.5vw, 34px)",
              letterSpacing: "clamp(4px, 1.6vw, 10px)"
            }}
          >
            {puzzle.cipher}
          </div>

          <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4, textAlign: "center" }}>
            DECODED PREVIEW
          </div>
          <div
            style={{
              textAlign: "center",
              fontFamily: "'Courier New', monospace",
              color: C.gold,
              fontSize: "clamp(30px, 8.5vw, 50px)",
              fontWeight: 900,
              letterSpacing: "clamp(4px, 1.6vw, 10px)",
              textShadow: "0 4px 10px rgba(0,0,0,.45)",
              minHeight: "1.2em"
            }}
          >
            {preview || "—"}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 10
            }}
          >
            <button
              type="button"
              onClick={() => adjustShift(-1)}
              style={{
                padding: "14px 10px",
                borderRadius: 12,
                border: `1px solid ${C.line}`,
                background: "rgba(10,19,14,.7)",
                color: C.cream,
                fontWeight: 900,
                fontSize: "clamp(18px, 5vw, 24px)",
                cursor: "pointer"
              }}
              aria-label="Shift left"
            >
              ◀ −1
            </button>
            <div
              style={{
                minWidth: 80,
                textAlign: "center",
                padding: "8px 12px",
                borderRadius: 10,
                border: `1px solid ${C.gold}`,
                background: "rgba(255,193,94,.1)",
                color: C.gold,
                fontWeight: 900,
                fontSize: "clamp(16px, 4.5vw, 20px)"
              }}
            >
              SHIFT {puzzle.playerShift}
            </div>
            <button
              type="button"
              onClick={() => adjustShift(1)}
              style={{
                padding: "14px 10px",
                borderRadius: 12,
                border: `1px solid ${C.line}`,
                background: "rgba(10,19,14,.7)",
                color: C.cream,
                fontWeight: 900,
                fontSize: "clamp(18px, 5vw, 24px)",
                cursor: "pointer"
              }}
              aria-label="Shift right"
            >
              +1 ▶
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              type="button"
              onClick={skip}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${C.line}`,
                background: "rgba(10,19,14,.6)",
                color: C.muted,
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: 1,
                cursor: "pointer"
              }}
            >
              SKIP −2s
            </button>
            <button
              type="button"
              onClick={lockIn}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${C.gold}`,
                background: "linear-gradient(180deg, #ffd07a, #ffc15e)",
                color: C.dark,
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 1.2,
                cursor: "pointer"
              }}
            >
              LOCK IN
            </button>
          </div>

          <div style={{ minHeight: 22, textAlign: "center" }}>
            {feedback && (
              <span
                key={feedback.at}
                style={{
                  display: "inline-block",
                  color: feedbackColor,
                  fontWeight: 900,
                  letterSpacing: 1.2,
                  animation: "cipher-pop 360ms ease-out"
                }}
              >
                {feedback.note}
              </span>
            )}
          </div>
        </div>

        <p style={{ margin: 0, color: C.muted, fontSize: 12, lineHeight: 1.5, textAlign: "center" }}>
          Tap −1 / +1 to roll the cipher dial. Lock in when the preview reads a real word.
        </p>
      </section>
    );
  }

  // result
  const newBest = score > 0 && score === best[difficulty];
  return (
    <section style={{ display: "grid", gap: 14 }}>
      <style>{SHAKE_KEYS}</style>
      <header style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(26px, 5.5vw, 38px)", letterSpacing: 1 }}>Case Closed</h2>
        <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>{settings.label} difficulty</p>
      </header>

      <div
        style={{
          display: "grid",
          gap: 12,
          padding: "18px 18px 20px",
          borderRadius: 14,
          border: `1px solid ${C.gold}`,
          background: "linear-gradient(180deg, rgba(255,193,94,.14), rgba(10,19,14,.7))"
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>SCORE</div>
            <div style={{ color: C.gold, fontSize: "clamp(28px, 7vw, 40px)", fontWeight: 900 }}>{score}</div>
          </div>
          <div>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>CRACKED</div>
            <div style={{ color: C.cream, fontSize: "clamp(28px, 7vw, 40px)", fontWeight: 900 }}>{solved}</div>
          </div>
        </div>
        <div style={{ color: C.cream, fontSize: 13 }}>
          Personal best{" "}
          <span style={{ color: C.gold, fontWeight: 900 }}>{best[difficulty] || 0}</span>
          {newBest && <span style={{ color: C.green, fontWeight: 900, marginLeft: 8 }}>NEW</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          type="button"
          onClick={() => setPhase("setup")}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${C.line}`,
            background: "rgba(10,19,14,.6)",
            color: C.cream,
            fontWeight: 800,
            letterSpacing: 1,
            fontSize: 13,
            cursor: "pointer"
          }}
        >
          CHANGE DIFFICULTY
        </button>
        <button
          type="button"
          onClick={() => startRound(difficulty)}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${C.gold}`,
            background: "linear-gradient(180deg, #ffd07a, #ffc15e)",
            color: C.dark,
            fontWeight: 900,
            letterSpacing: 1.2,
            fontSize: 14,
            cursor: "pointer"
          }}
        >
          CRACK ANOTHER
        </button>
      </div>
    </section>
  );
}
