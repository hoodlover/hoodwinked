"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlayerNameBadge from "./PlayerNameBadge";
import { readPlayerName, readScore, writeScore } from "./scoreStore";

const DIFFICULTIES = {
  easy: { label: "Easy", time: 75, hitBonusSec: 10, missPenaltySec: 2, multiplier: 1 },
  medium: { label: "Medium", time: 60, hitBonusSec: 10, missPenaltySec: 3, multiplier: 2 },
  hard: { label: "Hard", time: 45, hitBonusSec: 10, missPenaltySec: 5, multiplier: 3 }
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

const NAMES = [
  "\"Knuckles\" Malone",
  "\"Doc\" Holloway",
  "\"Sally\" Klein",
  "\"Vinny\" Caruso",
  "\"Squeaky\" Pete",
  "\"Big Mike\" Costa",
  "\"Slim\" Reilly",
  "\"Frankie\" Two-Times",
  "\"Lefty\" Brennan",
  "\"Rosie\" Marlowe",
  "\"Tony Bones\" Petros",
  "\"Ginger\" McAllister",
  "\"Bugs\" Petrosky",
  "\"Lou the Mouse\"",
  "\"Eddie Stones\"",
  "\"Bear\" Kowalski"
];

const LOCATIONS = [
  "the Roxy lounge",
  "the docks",
  "the train yard",
  "the bus depot",
  "Sally's diner",
  "the gin joint on 9th",
  "the back alley behind Fitzpatrick's",
  "the warehouse on 5th",
  "the museum gardens",
  "City Park",
  "the riverside",
  "the gas station",
  "the courthouse steps",
  "the all-night newsstand",
  "the boxing gym",
  "the cigar lounge"
];

const TIMES = [
  "around 8 PM",
  "right after 9",
  "just before 10",
  "around 11",
  "near midnight",
  "after 1 in the morning",
  "around 2 AM"
];

const CRIMES = [
  "Bank heist at First National",
  "Diamond exchange burglary",
  "Payroll robbery downtown",
  "Mansion break-in on Park Ave",
  "Warehouse fire on 5th",
  "Speakeasy shakedown",
  "Museum theft — the ruby is gone",
  "Train yard freight job",
  "Bookie holdup at the Roxy",
  "Jewelry store robbery",
  "Cigar lounge stickup",
  "Counterfeit press raid"
];

const SCORE_SLUG = "alibi-grid";
const SCORE_FALLBACK = { easy: 0, medium: 0, hard: 0, bestStreak: 0 };

const AG_KEYS = `
  @keyframes ag-pop {
    0% { opacity: 0; transform: scale(.55); }
    55% { opacity: 1; transform: scale(1.16); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes ag-shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-5px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }
  @keyframes ag-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,193,94,.55); }
    50% { box-shadow: 0 0 0 14px rgba(255,193,94,0); }
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

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makePuzzle() {
  // Pick 4 suspects, 2 locations (scene + red-herring), 1 time, 1 crime
  const names = shuffle(NAMES).slice(0, 4);
  const locations = shuffle(LOCATIONS).slice(0, 2);
  const time = pickRandom(TIMES);
  const crime = pickRandom(CRIMES);

  const liarIdx = Math.floor(Math.random() * 4);
  const indices = [0, 1, 2, 3];
  const truthfulIndices = indices.filter((i) => i !== liarIdx);
  // Two witnesses corroborate at the scene location, one is elsewhere (red herring)
  const [witnessA, witnessB, herringIdx] = shuffle(truthfulIndices);
  const sceneLocation = locations[0];
  const herringLocation = locations[1];
  const liarName = names[liarIdx];

  const statements = names.map((name, idx) => {
    if (idx === witnessA) {
      return `I was at ${sceneLocation} ${time}, having a drink with ${names[witnessB]}. ${liarName} was nowhere near us.`;
    }
    if (idx === witnessB) {
      return `${names[witnessA]} and I were at ${sceneLocation} ${time}. Slow night, easy to remember. ${liarName} never showed.`;
    }
    if (idx === herringIdx) {
      return `I was at ${herringLocation} ${time}. Quiet evening, kept to myself.`;
    }
    // liar
    return `I was at ${sceneLocation} ${time}, plain and simple.`;
  });

  return {
    crime,
    time,
    sceneLocation,
    herringLocation,
    names,
    statements,
    liarIdx
  };
}

export default function AlibiGrid() {
  const [phase, setPhase] = useState("setup");
  const [difficulty, setDifficulty] = useState("medium");
  const [puzzle, setPuzzle] = useState(null);
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
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  const settings = DIFFICULTIES[difficulty];

  const finishRound = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
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

  const startRound = useCallback(
    (chosen) => {
      const lvl = chosen || difficulty;
      const lvlSettings = DIFFICULTIES[lvl];
      setDifficulty(lvl);
      setPuzzle(makePuzzle());
      setScore(0);
      setCorrectCount(0);
      setWrongCount(0);
      setStreak(0);
      setPeakStreak(0);
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

  /* eslint-disable react-hooks/purity -- click handler, not called during render */
  const accuse = (idx) => {
    if (phase !== "play" || !puzzle || feedback) return;
    const isCorrect = idx === puzzle.liarIdx;
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
      // No cap — keep banking time for streaks. Good play can run past the starting clock.
      endRef.current = endRef.current + settings.hitBonusSec * 1000;
      setFeedback({ kind: "good", pickedIdx: idx, liarIdx: puzzle.liarIdx, note: `+${gain}`, at: Date.now() });
    } else {
      endRef.current = endRef.current - settings.missPenaltySec * 1000;
      const remain = Math.max(0, endRef.current - Date.now());
      setTimeMs(remain);
      setWrongCount((n) => n + 1);
      setStreak(0);
      setFeedback({ kind: "bad", pickedIdx: idx, liarIdx: puzzle.liarIdx, note: `−${settings.missPenaltySec}s`, at: Date.now() });
      if (remain <= 0) {
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = setTimeout(() => finishRound(), 1000);
        return;
      }
    }
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      setPuzzle(makePuzzle());
      setFeedback(null);
    }, isCorrect ? 700 : 1100);
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
        <style>{AG_KEYS}</style>
        <header style={{ display: "grid", gap: 4 }}>
          <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(26px, 5.5vw, 38px)", letterSpacing: 1, fontVariant: "small-caps" }}>Alibi Grid</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.5 }}>
            Four suspects, four stories, one lie. Read the statements, cross-check the witnesses, and tap the suspect whose alibi doesn&apos;t hold up.
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
                  {info.time}s · {info.multiplier}× score
                </div>
                <div style={{ color: C.muted, fontSize: 12 }}>
                  +{info.hitBonusSec}s correct · −{info.missPenaltySec}s wrong
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
              animation: "ag-pulse 2.4s ease-in-out infinite"
            }}
          >
            OPEN THE CASE FILE
          </button>
        </div>
      </section>
    );
  }

  if (phase === "play" && puzzle) {
    const remainSec = Math.ceil(timeMs / 1000);
    const lowOnTime = remainSec <= 10;
    return (
      <section style={{ display: "grid", gap: 14 }}>
        <style>{AG_KEYS}</style>

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
            border: `1px solid ${C.gold}`,
            background: "linear-gradient(180deg, rgba(255,193,94,.10), rgba(10,19,14,.78))",
            padding: "12px 14px"
          }}
        >
          <div style={{ color: C.gold, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>THE CASE</div>
          <div style={{ color: C.cream, fontSize: "clamp(15px, 3.8vw, 18px)", fontWeight: 800, marginTop: 4, lineHeight: 1.3 }}>
            {puzzle.crime}
          </div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
            Time on the wire: {puzzle.time}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
            animation: feedback?.kind === "bad" ? "ag-shake 380ms ease-in-out" : "none"
          }}
        >
          {puzzle.statements.map((statement, idx) => {
            const isPicked = feedback?.pickedIdx === idx;
            const isLiar = feedback && idx === feedback.liarIdx;
            const showLiar = !!feedback && isLiar;
            const showWrongPick = feedback?.kind === "bad" && isPicked && !isLiar;
            let borderColor = C.line;
            let bg = "linear-gradient(180deg, rgba(31,51,32,.85), rgba(10,19,14,.85))";
            if (showLiar) {
              borderColor = C.green;
              bg = "linear-gradient(180deg, rgba(111,176,113,.32), rgba(38,71,40,.5))";
            } else if (showWrongPick) {
              borderColor = C.hit;
              bg = "linear-gradient(180deg, rgba(207,79,69,.32), rgba(78,28,24,.5))";
            }
            const canClick = !feedback;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => accuse(idx)}
                disabled={!canClick}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${borderColor}`,
                  background: bg,
                  color: C.cream,
                  cursor: canClick ? "pointer" : "default",
                  transition: "border-color 160ms ease, background 200ms ease",
                  display: "grid",
                  gap: 6
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <span
                    style={{
                      color: showLiar ? C.green : showWrongPick ? C.hit : C.gold,
                      fontWeight: 900,
                      letterSpacing: 0.5,
                      fontSize: "clamp(13px, 3.4vw, 16px)",
                      fontVariant: "small-caps"
                    }}
                  >
                    {puzzle.names[idx]}
                  </span>
                  {showLiar && (
                    <span style={{ color: C.green, fontSize: 11, fontWeight: 900, letterSpacing: 1.2 }}>LIAR</span>
                  )}
                  {showWrongPick && (
                    <span style={{ color: C.hit, fontSize: 11, fontWeight: 900, letterSpacing: 1.2 }}>NOT THE LIAR</span>
                  )}
                </div>
                <div style={{ color: C.cream, fontSize: "clamp(13px, 3.2vw, 14px)", lineHeight: 1.4, fontStyle: "italic" }}>
                  &ldquo;{statement}&rdquo;
                </div>
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
                animation: "ag-pop 360ms ease-out"
              }}
            >
              {feedback.note}
            </span>
          )}
          {!feedback && (
            <span style={{ color: C.muted, fontSize: 12 }}>
              Tap the suspect whose story doesn&apos;t add up.
            </span>
          )}
        </div>
      </section>
    );
  }

  // result
  const newBest = score > 0 && score === best[difficulty];
  const newStreak = peakStreak > 0 && peakStreak === best.bestStreak;
  return (
    <section style={{ display: "grid", gap: 14 }}>
      <style>{AG_KEYS}</style>
      <header style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(26px, 5.5vw, 38px)", letterSpacing: 1, fontVariant: "small-caps" }}>
          Case Closed{playerName ? `, Detective ${playerName}` : ""}
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
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>CRACKED</div>
            <div style={{ color: C.green, fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 900 }}>{correctCount}</div>
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
          NEXT CASE FILE
        </button>
      </div>
    </section>
  );
}
