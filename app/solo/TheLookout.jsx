"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlayerNameBadge from "./PlayerNameBadge";
import { readPlayerName, readScore, writeScore } from "./scoreStore";

const DIFFICULTIES = {
  easy: { label: "Easy", time: 75, gridRows: 2, gridCols: 3, studyMs: 3500, hitBonusSec: 2, missPenaltySec: 2, multiplier: 1 },
  medium: { label: "Medium", time: 60, gridRows: 3, gridCols: 3, studyMs: 2500, hitBonusSec: 1, missPenaltySec: 3, multiplier: 2 },
  hard: { label: "Hard", time: 45, gridRows: 3, gridCols: 4, studyMs: 1800, hitBonusSec: 1, missPenaltySec: 4, multiplier: 3 }
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

const ICON_POOL = [
  "🕵️", "🎩", "🔫", "🗡️", "💼", "💰", "🔑", "📜", "📞", "🕰️",
  "🚪", "🍷", "☕", "🚬", "💊", "🔍", "📷", "📰", "✉️", "🎟️",
  "💎", "🏛️", "🚗", "🚕", "🛥️", "🚂", "⚖️", "🚓", "👮", "🎭",
  "🔪", "🎲", "♠️", "♣️", "♥️", "♦️", "🎰", "🍸", "🥃", "🏨"
];

const SCORE_SLUG = "the-lookout";
const SCORE_FALLBACK = { easy: 0, medium: 0, hard: 0, bestStreak: 0 };

const LO_KEYS = `
  @keyframes lo-pop {
    0% { opacity: 0; transform: scale(.55); }
    55% { opacity: 1; transform: scale(1.16); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes lo-shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-5px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }
  @keyframes lo-flash {
    0%, 100% { opacity: 1; }
    50% { opacity: .35; }
  }
  @keyframes lo-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,193,94,.55); }
    50% { box-shadow: 0 0 0 14px rgba(255,193,94,0); }
  }
  @keyframes lo-progress {
    0% { transform: scaleX(1); }
    100% { transform: scaleX(0); }
  }
`;

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makePuzzle(cells) {
  const shuffled = shuffle(ICON_POOL);
  const original = shuffled.slice(0, cells);
  const used = new Set(original);
  const candidates = ICON_POOL.filter((i) => !used.has(i));
  const replacement = candidates[Math.floor(Math.random() * candidates.length)];
  const swapIdx = Math.floor(Math.random() * cells);
  const swapped = [...original];
  swapped[swapIdx] = replacement;
  return { original, swapped, swapIdx };
}

export default function TheLookout() {
  const [phase, setPhase] = useState("setup");
  const [difficulty, setDifficulty] = useState("medium");
  const [puzzle, setPuzzle] = useState(null);
  const [puzzlePhase, setPuzzlePhase] = useState("studying");
  const [timeMs, setTimeMs] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [peakStreak, setPeakStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [best, setBest] = useState(SCORE_FALLBACK);
  const [playerName, setPlayerName] = useState("");
  const tickRef = useRef(null);
  const studyTimerRef = useRef(null);
  const advanceTimerRef = useRef(null);
  const endRef = useRef(0);

  useEffect(() => {
    // SSR returns fallback; hydrate the real value on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBest(readScore(SCORE_SLUG, SCORE_FALLBACK));
    setPlayerName(readPlayerName());
  }, []);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (studyTimerRef.current) clearTimeout(studyTimerRef.current);
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  const settings = DIFFICULTIES[difficulty];

  const finishRound = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    if (studyTimerRef.current) clearTimeout(studyTimerRef.current);
    studyTimerRef.current = null;
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = null;
    setPhase((current) => {
      if (current !== "play") return current;
      setScore((finalScore) => {
        setPeakStreak((finalPeak) => {
          setBest((prev) => {
            const prior = prev[difficulty] || 0;
            const priorStreak = prev.bestStreak || 0;
            const nextStreak = Math.max(priorStreak, finalPeak);
            if (finalScore > prior || nextStreak > priorStreak) {
              const next = { ...prev, [difficulty]: Math.max(prior, finalScore), bestStreak: nextStreak };
              writeScore(SCORE_SLUG, next);
              return next;
            }
            return prev;
          });
          return finalPeak;
        });
        return finalScore;
      });
      return "result";
    });
  }, [difficulty]);

  const beginPuzzle = useCallback((lvlSettings) => {
    const cells = lvlSettings.gridRows * lvlSettings.gridCols;
    const fresh = makePuzzle(cells);
    setPuzzle(fresh);
    setPuzzlePhase("studying");
    setFeedback(null);
    if (studyTimerRef.current) clearTimeout(studyTimerRef.current);
    studyTimerRef.current = setTimeout(() => {
      setPuzzlePhase("answering");
    }, lvlSettings.studyMs);
  }, []);

  const startRound = useCallback(
    (chosen) => {
      const lvl = chosen || difficulty;
      const lvlSettings = DIFFICULTIES[lvl];
      setDifficulty(lvl);
      setScore(0);
      setCorrectCount(0);
      setWrongCount(0);
      setStreak(0);
      setPeakStreak(0);
      const totalMs = lvlSettings.time * 1000;
      setTimeMs(totalMs);
      endRef.current = Date.now() + totalMs;
      setPhase("play");
      beginPuzzle(lvlSettings);
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
    [difficulty, finishRound, beginPuzzle]
  );

  /* eslint-disable react-hooks/purity -- click handler, not called during render */
  const pickCell = (idx) => {
    if (phase !== "play" || !puzzle || puzzlePhase !== "answering" || feedback) return;
    const isCorrect = idx === puzzle.swapIdx;
    if (isCorrect) {
      const remainSec = Math.max(0, Math.floor(timeMs / 1000));
      const gain = (100 + remainSec) * settings.multiplier;
      setScore((s) => s + gain);
      setCorrectCount((n) => n + 1);
      setStreak((s) => {
        const next = s + 1;
        setPeakStreak((p) => (next > p ? next : p));
        return next;
      });
      endRef.current = Math.min(Date.now() + settings.time * 1000, endRef.current + settings.hitBonusSec * 1000);
      setFeedback({ kind: "good", pickedIdx: idx, correctIdx: puzzle.swapIdx, note: `+${gain}`, at: Date.now() });
    } else {
      endRef.current = endRef.current - settings.missPenaltySec * 1000;
      const remain = Math.max(0, endRef.current - Date.now());
      setTimeMs(remain);
      setWrongCount((n) => n + 1);
      setStreak(0);
      setFeedback({
        kind: "bad",
        pickedIdx: idx,
        correctIdx: puzzle.swapIdx,
        note: `−${settings.missPenaltySec}s`,
        at: Date.now()
      });
      if (remain <= 0) {
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = setTimeout(() => finishRound(), 700);
        return;
      }
    }
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      beginPuzzle(settings);
    }, 800);
  };
  /* eslint-enable react-hooks/purity */

  const accuracy = useMemo(() => {
    const total = correctCount + wrongCount;
    if (total === 0) return 0;
    return Math.round((correctCount / total) * 100);
  }, [correctCount, wrongCount]);

  if (phase === "setup") {
    return (
      <section style={{ display: "grid", gap: 14 }}>
        <style>{LO_KEYS}</style>
        <header style={{ display: "grid", gap: 4 }}>
          <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(26px, 5.5vw, 38px)", letterSpacing: 1, fontVariant: "small-caps" }}>The Lookout</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.5 }}>
            Study the evidence board. The scene reshuffles — one item swaps. Tap the cell that changed before the clock runs out.
          </p>
          <div style={{ marginTop: 6 }}><PlayerNameBadge /></div>
        </header>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
          {Object.entries(DIFFICULTIES).map(([key, info]) => {
            const isActive = difficulty === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDifficulty(key)}
                style={{
                  flex: "1 1 160px",
                  maxWidth: 240,
                  minWidth: 0,
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
                <div style={{ fontWeight: 800 }}>
                  {info.gridRows}×{info.gridCols} · {info.time}s · {info.multiplier}× score
                </div>
                <div style={{ color: C.muted, fontSize: 12 }}>
                  {Math.round(info.studyMs / 100) / 10}s study window
                </div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Best: {best[key] || 0}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", justifyItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>
            Longest streak: <span style={{ color: C.gold, fontWeight: 900 }}>{best.bestStreak || 0}</span>
          </span>
          <button
            type="button"
            onClick={() => startRound(difficulty)}
            style={{
              padding: "12px 22px",
              borderRadius: 10,
              border: `1px solid ${C.green}`,
              background: "linear-gradient(180deg, #3d7a40, #1a3a1d)",
              color: C.cream,
              fontWeight: 900,
              letterSpacing: 1.2,
              fontSize: 14,
              cursor: "pointer",
              animation: "lo-pulse 2.4s ease-in-out infinite"
            }}
          >
            TAKE THE WATCH
          </button>
        </div>
      </section>
    );
  }

  if (phase === "play" && puzzle) {
    const remainSec = Math.ceil(timeMs / 1000);
    const lowOnTime = remainSec <= 10;
    const showStudying = puzzlePhase === "studying";
    const gridItems = showStudying ? puzzle.original : puzzle.swapped;
    return (
      <section style={{ display: "grid", gap: 14 }}>
        <style>{LO_KEYS}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>
              {settings.label.toUpperCase()}
            </div>
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${C.green}`,
                background: "rgba(111,176,113,.14)",
                fontSize: 12,
                fontWeight: 800,
                color: C.green
              }}
            >
              Right: {correctCount}
            </div>
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${streak > 0 ? C.gold : C.line}`,
                background: streak > 0 ? "rgba(255,193,94,.14)" : "rgba(10,19,14,.55)",
                fontSize: 12,
                fontWeight: 800,
                color: streak > 0 ? C.gold : C.muted
              }}
            >
              Streak: {streak}
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
            padding: "16px clamp(12px, 4vw, 22px) 20px",
            display: "grid",
            gap: 14,
            animation: feedback?.kind === "bad" ? "lo-shake 380ms ease-in-out" : "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <span
              style={{
                color: showStudying ? C.gold : C.cream,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1.4
              }}
            >
              {showStudying ? "STUDY THE SCENE" : "WHAT CHANGED?"}
            </span>
            <span style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>
              EVIDENCE BOARD
            </span>
          </div>

          {showStudying && (
            <div
              style={{
                height: 4,
                background: "rgba(10,19,14,.6)",
                borderRadius: 999,
                overflow: "hidden"
              }}
            >
              <div
                key={puzzle.swapIdx + "-bar"}
                style={{
                  height: "100%",
                  background: C.gold,
                  transformOrigin: "left",
                  animation: `lo-progress ${settings.studyMs}ms linear forwards`
                }}
              />
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${settings.gridCols}, minmax(0, 1fr))`,
              gap: 8
            }}
          >
            {gridItems.map((icon, idx) => {
              const isPicked = feedback?.pickedIdx === idx;
              const isCorrectCell = feedback && idx === feedback.correctIdx;
              const showCorrect = !!feedback && isCorrectCell;
              const showWrongPick = feedback?.kind === "bad" && isPicked && !isCorrectCell;
              let borderColor = C.line;
              let bg = "linear-gradient(180deg, rgba(31,51,32,.92), rgba(10,19,14,.92))";
              if (showCorrect) {
                borderColor = C.green;
                bg = "linear-gradient(180deg, rgba(111,176,113,.32), rgba(38,71,40,.5))";
              } else if (showWrongPick) {
                borderColor = C.hit;
                bg = "linear-gradient(180deg, rgba(207,79,69,.32), rgba(78,28,24,.5))";
              }
              const canClick = puzzlePhase === "answering" && !feedback;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => pickCell(idx)}
                  disabled={!canClick}
                  style={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    borderRadius: 10,
                    border: `2px solid ${borderColor}`,
                    background: bg,
                    color: C.cream,
                    cursor: canClick ? "pointer" : "default",
                    padding: 0,
                    overflow: "hidden",
                    transition: "border-color 160ms ease, background 200ms ease, transform 140ms ease",
                    transform: showCorrect ? "scale(1.04)" : "scale(1)",
                    minWidth: 0
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "clamp(28px, 10vw, 48px)",
                      lineHeight: 1,
                      textShadow: "0 4px 12px rgba(0,0,0,.45)",
                      animation:
                        feedback && idx === feedback.correctIdx
                          ? "lo-pop 360ms ease-out"
                          : "none"
                    }}
                  >
                    {icon}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ minHeight: 22, textAlign: "center" }}>
            {feedback && (
              <span
                key={feedback.at}
                style={{
                  display: "inline-block",
                  color: feedback.kind === "good" ? C.green : C.hit,
                  fontWeight: 900,
                  letterSpacing: 1.2,
                  animation: "lo-pop 360ms ease-out"
                }}
              >
                {feedback.note}
              </span>
            )}
            {!feedback && showStudying && (
              <span style={{ color: C.muted, fontSize: 12 }}>
                Memorize the layout before it shifts.
              </span>
            )}
            {!feedback && !showStudying && (
              <span style={{ color: C.gold, fontSize: 12, fontWeight: 800 }}>
                Tap the cell that swapped.
              </span>
            )}
          </div>
        </div>
      </section>
    );
  }

  // result
  const newBest = score > 0 && score === best[difficulty];
  const newStreak = peakStreak > 0 && peakStreak === best.bestStreak;
  return (
    <section style={{ display: "grid", gap: 14 }}>
      <style>{LO_KEYS}</style>
      <header style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(26px, 5.5vw, 38px)", letterSpacing: 1, fontVariant: "small-caps" }}>
          Watch Over{playerName ? `, Detective ${playerName}` : ""}
        </h2>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <div>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>SCORE</div>
            <div style={{ color: C.gold, fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 900 }}>{score}</div>
          </div>
          <div>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>STREAK</div>
            <div style={{ color: C.blue, fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 900 }}>{peakStreak}</div>
          </div>
          <div>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>ACCURACY</div>
            <div style={{ color: C.cream, fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 900 }}>{accuracy}%</div>
          </div>
        </div>
        <div style={{ color: C.cream, fontSize: 13 }}>
          Personal best{" "}
          <span style={{ color: C.gold, fontWeight: 900 }}>{best[difficulty] || 0}</span>
          {newBest && <span style={{ color: C.green, fontWeight: 900, marginLeft: 8 }}>NEW</span>}
          <span style={{ marginLeft: 14, color: C.muted }}>·</span>
          <span style={{ marginLeft: 14 }}>Best streak </span>
          <span style={{ color: C.gold, fontWeight: 900 }}>{best.bestStreak || 0}</span>
          {newStreak && <span style={{ color: C.green, fontWeight: 900, marginLeft: 8 }}>NEW</span>}
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
            border: `1px solid ${C.green}`,
            background: "linear-gradient(180deg, #3d7a40, #1a3a1d)",
            color: C.cream,
            fontWeight: 900,
            letterSpacing: 1.2,
            fontSize: 14,
            cursor: "pointer"
          }}
        >
          BACK ON WATCH
        </button>
      </div>
    </section>
  );
}
