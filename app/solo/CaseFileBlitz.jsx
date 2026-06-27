"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlayerNameBadge from "./PlayerNameBadge";
import { readPlayerName, readScore, writeScore } from "./scoreStore";
import { hapticReveal } from "./haptics";

const DIFFICULTIES = {
  easy: { label: "Easy", time: 75, bonusSec: 3, penaltySec: 0, multiplier: 1 },
  medium: { label: "Medium", time: 60, bonusSec: 2, penaltySec: 3, multiplier: 2 },
  hard: { label: "Hard", time: 45, bonusSec: 0, penaltySec: 5, multiplier: 3 }
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

const QUESTIONS = [
  { q: "In police radio codes, \"10-4\" means:", o: ["Repeat that", "Acknowledged", "Suspect in custody", "End of shift"], a: 1 },
  { q: "A \"rap sheet\" is:", o: ["A criminal record", "A song recording", "An interrogation report", "A list of suspects"], a: 0 },
  { q: "In 1930s mob slang, a \"heater\" is a:", o: ["Hat", "Gun", "Getaway car", "Bribe"], a: 1 },
  { q: "In noir fiction, a \"femme fatale\" is:", o: ["An innocent bystander", "A dangerous, alluring woman", "A female detective", "The grieving widow"], a: 1 },
  { q: "Sherlock Holmes' famous address is on:", o: ["Pall Mall", "Baker Street", "Carnaby Street", "Fleet Street"], a: 1 },
  { q: "Agatha Christie's famous Belgian detective is:", o: ["Inspector Maigret", "Hercule Poirot", "Auguste Dupin", "Sam Spade"], a: 1 },
  { q: "A \"cat burglar\" specializes in:", o: ["Stealing pets", "Climbing and rooftop entry", "Distraction tactics", "Insider jobs"], a: 1 },
  { q: "In dice, \"snake eyes\" is a roll of:", o: ["1-1", "2-2", "6-6", "1-2"], a: 0 },
  { q: "A \"gumshoe\" is slang for a:", o: ["Smuggler", "Detective", "Getaway driver", "Lookout"], a: 1 },
  { q: "The Pinkerton Agency was a:", o: ["Criminal syndicate", "Private detective agency", "Police division", "Tabloid newspaper"], a: 1 },
  { q: "A \"fence\" in criminal slang is:", o: ["A weapon dealer", "Someone who buys stolen goods", "A lookout", "A safe-cracker"], a: 1 },
  { q: "Which is NOT a classic Clue weapon?", o: ["Candlestick", "Revolver", "Lead pipe", "Crossbow"], a: 3 },
  { q: "In poker, to \"muck\" means to:", o: ["Bluff", "Fold and discard", "Win the pot", "Slow play"], a: 1 },
  { q: "\"Casing the joint\" means:", o: ["Robbing it", "Surveilling it before a crime", "Escaping from it", "Buying it"], a: 1 },
  { q: "A \"patsy\" is the:", o: ["Mastermind", "Fall guy", "Lookout", "Driver"], a: 1 },
  { q: "\"Blowing the safe\" refers to:", o: ["Burning evidence", "Cracking it open with explosives", "A robbery gone wrong", "Tipping off the police"], a: 1 },
  { q: "In 1920s slang, \"the bee's knees\" meant:", o: ["Excellent", "Suspicious", "Dangerous", "Tired"], a: 0 },
  { q: "A \"speakeasy\" was:", o: ["A getaway car", "An illegal bar during Prohibition", "An informant", "A coded telegram"], a: 1 },
  { q: "The mob term \"made man\" refers to:", o: ["A wealthy criminal", "A fully initiated member", "The boss's son", "A retired criminal"], a: 1 },
  { q: "\"Crooked dice\" are:", o: ["Worn down", "Weighted to favor certain rolls", "Painted differently", "Rolled improperly"], a: 1 },
  { q: "A \"skeleton key\" can:", o: ["Open many locks of a type", "Only open certain locks", "Disable alarms", "Open vaults"], a: 0 },
  { q: "In heist stories, the \"inside man\" is:", o: ["The driver", "Someone working at the target", "The mastermind", "The fall guy"], a: 1 },
  { q: "\"Tailing\" a suspect means:", o: ["Arresting them", "Following them secretly", "Threatening them", "Interrogating them"], a: 1 },
  { q: "A \"stool pigeon\" is slang for:", o: ["A poker tell", "An informant", "A lookout", "A bartender"], a: 1 },
  { q: "Sherlock Holmes' arch-nemesis is:", o: ["Mycroft", "Moriarty", "Watson", "Lestrade"], a: 1 },
  { q: "The word \"alibi\" comes from Latin meaning:", o: ["I was guilty", "Elsewhere", "Witness", "Trial"], a: 1 },
  { q: "A \"frame job\" means:", o: ["A photo crime", "Falsely blaming someone", "A type of con", "A burglary"], a: 1 },
  { q: "A \"bagman\" in mob slang carries:", o: ["Weapons", "Money or payments", "Documents", "Tools"], a: 1 },
  { q: "\"Throwing the case\" means:", o: ["Filing it away", "Intentionally losing it", "Solving it", "Going to trial"], a: 1 },
  { q: "A \"wire\" in undercover work is:", o: ["A getaway car", "A hidden recording device", "A weapon", "An informant"], a: 1 },
  { q: "A \"long con\" is:", o: ["A quick scam", "An elaborate scheme over time", "A failed con", "A double-cross"], a: 1 },
  { q: "\"Hot\" stolen goods are:", o: ["Valuable", "Recently stolen and risky", "Easy to sell", "Marked with paint"], a: 1 },
  { q: "A \"rat\" in criminal slang is:", o: ["A thief", "An informant", "A lookout", "A boss"], a: 1 },
  { q: "\"The big house\" refers to:", o: ["The bank", "Prison", "The courthouse", "Headquarters"], a: 1 },
  { q: "In gambling, \"the house\" is:", o: ["The casino itself", "The biggest bet", "The dealer's hand", "The cashier"], a: 0 },
  { q: "A \"lookout\" is responsible for:", o: ["Robbing the safe", "Watching for danger", "Driving", "Disabling alarms"], a: 1 },
  { q: "\"Going to the mattresses\" is mob slang for:", o: ["Falling asleep", "Going into hiding during a war", "Surrendering", "Retiring"], a: 1 },
  { q: "\"Capisce?\" is Italian for:", o: ["Goodbye", "Understand?", "Watch out", "Sorry"], a: 1 },
  { q: "A \"dead drop\" is:", o: ["A killing", "Leaving items in a secret place", "A police raid", "A fatal mistake"], a: 1 },
  { q: "\"Wet work\" is mob slang for:", o: ["Money laundering", "Killing", "Bartending", "Smuggling at sea"], a: 1 },
  { q: "In casino security, \"eye in the sky\" refers to:", o: ["Overhead cameras", "Spotters in the rafters", "The pit boss", "A secret manager"], a: 0 },
  { q: "The \"blue wall\" in policing refers to:", o: ["Department barriers", "Officers covering for each other", "Crime scene tape", "Backup units"], a: 1 },
  { q: "\"Booking\" a suspect means:", o: ["Photographing them", "Officially recording their arrest", "Charging them", "Releasing them on bail"], a: 1 },
  { q: "The \"third degree\" in interrogation means:", o: ["The third question", "Intense, often coercive questioning", "Third strike sentencing", "A third trial"], a: 1 },
  { q: "In card sharking, a \"mechanic\" is a:", o: ["Repairman", "Skilled cheat", "Casino tech", "Bartender"], a: 1 },
  { q: "\"Spilling the beans\" likely originated from:", o: ["Ancient voting practices", "Prohibition bars", "Police interrogations", "Sailing ships"], a: 0 },
  { q: "A \"con\" in \"con man\" is short for:", o: ["Convict", "Confidence", "Connection", "Conviction"], a: 1 },
  { q: "Raymond Chandler's hardboiled detective is:", o: ["Sam Spade", "Philip Marlowe", "Mike Hammer", "Lew Archer"], a: 1 },
  { q: "Dashiell Hammett created which detective?", o: ["Hercule Poirot", "Sam Spade", "Philip Marlowe", "Nero Wolfe"], a: 1 },
  { q: "A \"plant\" in a crime scene is:", o: ["A potted herb", "Evidence placed to mislead", "A hidden microphone", "A buried body"], a: 1 },
  { q: "In gangster slang, \"sleeping with the fishes\" means:", o: ["On vacation", "Dead in the water", "In hiding", "On the take"], a: 1 },
  { q: "A \"sting\" operation is:", o: ["A sudden raid", "An undercover trap to catch a criminal", "An assault charge", "A wire tap"], a: 1 },
  { q: "\"Beat cop\" refers to an officer who:", o: ["Boxes for the precinct", "Patrols a fixed neighborhood on foot", "Interrogates suspects", "Runs informants"], a: 1 },
  { q: "A \"perp\" is short for:", o: ["Person of interest", "Perpetrator", "Perimeter", "Perjury"], a: 1 }
];

const SCORE_SLUG = "case-file-blitz";
const SCORE_FALLBACK = { easy: 0, medium: 0, hard: 0, mostCorrect: 0 };

const FLASH_KEYS = `
  @keyframes blitz-pop {
    0% { opacity: 0; transform: scale(.6); }
    60% { opacity: 1; transform: scale(1.18); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes blitz-shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-5px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }
  @keyframes blitz-pulse {
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

function buildQuestion(template) {
  const indices = shuffle([0, 1, 2, 3]);
  return {
    q: template.q,
    options: indices.map((i) => template.o[i]),
    correct: indices.indexOf(template.a)
  };
}

function buildQueue() {
  return shuffle(QUESTIONS).map(buildQuestion);
}

export default function CaseFileBlitz() {
  const [phase, setPhase] = useState("setup");
  const [difficulty, setDifficulty] = useState("medium");
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [timeMs, setTimeMs] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
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
      hapticReveal();
      setScore((finalScore) => {
        setCorrectCount((correctTally) => {
          setBest((prev) => {
            const prior = prev[difficulty] || 0;
            const mostCorrect = Math.max(prev.mostCorrect || 0, correctTally);
            if (finalScore > prior || mostCorrect > (prev.mostCorrect || 0)) {
              const next = { ...prev, [difficulty]: Math.max(prior, finalScore), mostCorrect };
              writeScore(SCORE_SLUG, next);
              return next;
            }
            return prev;
          });
          return correctTally;
        });
        return finalScore;
      });
      return "result";
    });
  }, [difficulty]);

  const advance = useCallback((nextQueue) => {
    if (nextQueue.length === 0) {
      const refilled = buildQueue();
      setQueue(refilled.slice(1));
      setCurrent(refilled[0]);
      return;
    }
    setCurrent(nextQueue[0]);
    setQueue(nextQueue.slice(1));
  }, []);

  const startRound = useCallback(
    (chosen) => {
      const lvl = chosen || difficulty;
      const lvlSettings = DIFFICULTIES[lvl];
      setDifficulty(lvl);
      const fresh = buildQueue();
      setQueue(fresh.slice(1));
      setCurrent(fresh[0]);
      setScore(0);
      setCorrectCount(0);
      setWrongCount(0);
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

  /* eslint-disable react-hooks/purity -- click handlers, not called during render */
  const flashFeedback = (kind, picked, note) => {
    setFeedback({ kind, picked, note, at: Date.now() });
  };

  const submitAnswer = (idx) => {
    if (phase !== "play" || !current || feedback) return;
    const isCorrect = idx === current.correct;
    if (isCorrect) {
      const remainSec = Math.max(0, Math.floor(timeMs / 1000));
      const gain = (100 + remainSec) * settings.multiplier;
      setScore((s) => s + gain);
      setCorrectCount((n) => n + 1);
      const bonusMs = settings.bonusSec * 1000;
      endRef.current = Math.min(Date.now() + settings.time * 1000, endRef.current + bonusMs);
      flashFeedback("good", idx, `+${gain}`);
    } else {
      const penaltyMs = settings.penaltySec * 1000;
      endRef.current = endRef.current - penaltyMs;
      const remain = Math.max(0, endRef.current - Date.now());
      setTimeMs(remain);
      setWrongCount((n) => n + 1);
      flashFeedback("bad", idx, settings.penaltySec > 0 ? `−${settings.penaltySec}s` : "Wrong");
      if (remain <= 0) {
        finishRound();
        return;
      }
    }
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      advance(queue);
      setFeedback(null);
    }, 700);
  };

  const skip = () => {
    if (phase !== "play" || !current || feedback) return;
    const penaltyMs = 3000;
    endRef.current = endRef.current - penaltyMs;
    const remain = Math.max(0, endRef.current - Date.now());
    setTimeMs(remain);
    flashFeedback("bad", -1, "−3s · skip");
    if (remain <= 0) {
      finishRound();
      return;
    }
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      advance(queue);
      setFeedback(null);
    }, 500);
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
        <style>{FLASH_KEYS}</style>
        <header style={{ display: "grid", gap: 4 }}>
          <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(26px, 5.5vw, 38px)", letterSpacing: 1, fontVariant: "small-caps" }}>Case File Blitz</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.5 }}>
            Rapid-fire crime trivia. Read fast, tap faster. Every right answer banks score and time.
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
                  {info.bonusSec > 0 ? `+${info.bonusSec}s correct · ` : "No bonus · "}
                  {info.penaltySec > 0 ? `−${info.penaltySec}s wrong` : "no penalty"}
                </div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Best: {best[key] || 0}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", justifyItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>
            Most correct in a round: <span style={{ color: C.gold, fontWeight: 900 }}>{best.mostCorrect || 0}</span>
          </span>
          <button
            type="button"
            onClick={() => startRound(difficulty)}
            style={{
              padding: "12px 22px",
              borderRadius: 10,
              border: `1px solid ${C.gold}`,
              background: "linear-gradient(180deg, #ffd07a, #ffc15e)",
              color: C.dark,
              fontWeight: 900,
              letterSpacing: 1.2,
              fontSize: 14,
              cursor: "pointer",
              animation: "blitz-pulse 2.4s ease-in-out infinite"
            }}
          >
            OPEN THE FILE
          </button>
        </div>
      </section>
    );
  }

  if (phase === "play" && current) {
    const remainSec = Math.ceil(timeMs / 1000);
    const lowOnTime = remainSec <= 10;
    return (
      <section style={{ display: "grid", gap: 14 }}>
        <style>{FLASH_KEYS}</style>

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
                border: `1px solid ${C.hit}`,
                background: "rgba(207,79,69,.14)",
                fontSize: 12,
                fontWeight: 800,
                color: C.hit
              }}
            >
              Wrong: {wrongCount}
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
            padding: "18px clamp(14px, 4vw, 26px)",
            display: "grid",
            gap: 14,
            animation: feedback?.kind === "bad" ? "blitz-shake 350ms ease-in-out" : "none"
          }}
        >
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4, textAlign: "center" }}>
            CASE FILE
          </div>
          <div
            style={{
              textAlign: "center",
              color: C.cream,
              fontSize: "clamp(17px, 4.6vw, 22px)",
              lineHeight: 1.4,
              fontWeight: 700,
              minHeight: "2.6em"
            }}
          >
            {current.q}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            {current.options.map((opt, idx) => {
              const isPicked = feedback?.picked === idx;
              const isCorrectChoice = idx === current.correct;
              const showCorrect = feedback && isCorrectChoice;
              const showWrongPick = feedback?.kind === "bad" && isPicked;
              const borderColor = showCorrect ? C.green : showWrongPick ? C.hit : C.line;
              const bg = showCorrect
                ? "linear-gradient(180deg, rgba(111,176,113,.32), rgba(38,71,40,.5))"
                : showWrongPick
                  ? "linear-gradient(180deg, rgba(207,79,69,.32), rgba(78,28,24,.5))"
                  : "rgba(10,19,14,.7)";
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => submitAnswer(idx)}
                  disabled={!!feedback}
                  style={{
                    padding: "14px 12px",
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    background: bg,
                    color: C.cream,
                    fontWeight: 800,
                    fontSize: "clamp(13px, 3.4vw, 15px)",
                    lineHeight: 1.3,
                    textAlign: "left",
                    cursor: feedback ? "default" : "pointer",
                    minHeight: 64,
                    transition: "background 160ms ease, border-color 160ms ease"
                  }}
                >
                  <span style={{ color: C.gold, fontWeight: 900, marginRight: 6 }}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={skip}
              disabled={!!feedback}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${C.line}`,
                background: "rgba(10,19,14,.6)",
                color: C.muted,
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: 1,
                cursor: feedback ? "default" : "pointer"
              }}
            >
              SKIP −3s
            </button>
            <div style={{ minHeight: 22, textAlign: "right" }}>
              {feedback && (
                <span
                  key={feedback.at}
                  style={{
                    display: "inline-block",
                    color: feedback.kind === "good" ? C.green : C.hit,
                    fontWeight: 900,
                    letterSpacing: 1.2,
                    animation: "blitz-pop 360ms ease-out"
                  }}
                >
                  {feedback.note}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // result
  const newBest = score > 0 && score === best[difficulty];
  return (
    <section style={{ display: "grid", gap: 14 }}>
      <style>{FLASH_KEYS}</style>
      <header style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(26px, 5.5vw, 38px)", letterSpacing: 1, fontVariant: "small-caps" }}>
          File Closed{playerName ? `, Detective ${playerName}` : ""}
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
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>CORRECT</div>
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
          OPEN ANOTHER
        </button>
      </div>
    </section>
  );
}
