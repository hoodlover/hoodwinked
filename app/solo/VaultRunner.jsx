"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PlayerNameBadge from "./PlayerNameBadge";
import { readPlayerName, readScore, writeScore } from "./scoreStore";
import { hapticReveal } from "./haptics";

const DIFFICULTIES = {
  easy: { label: "Easy", time: 75, lives: 5, tipHonesty: 0.9, safeBonusSec: 2, decoyPenaltySec: 3, multiplier: 1 },
  medium: { label: "Medium", time: 60, lives: 3, tipHonesty: 0.65, safeBonusSec: 2, decoyPenaltySec: 3, multiplier: 2 },
  hard: { label: "Hard", time: 45, lives: 2, tipHonesty: 0.45, safeBonusSec: 1, decoyPenaltySec: 4, multiplier: 3 }
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
  blue: "#6fb6d8",
  amber: "#e6a14b"
};

const DOOR_LABELS = ["LEFT", "CENTER", "RIGHT"];
const DOOR_IMAGES = ["/grassdoor.png", "/metaldoor.png", "/wooddoor.png"];
const FLOORS_PER_VAULT = 5;

const TIP_TEXTS = {
  safe: [
    "Lookout whispers: the {door} door is clean.",
    "The {door} door rattles loose — looks safe.",
    "Marks on the {door} hinge say easy passage.",
    "A torn note hints the {door} door is the way.",
    "Scuff marks lead straight to the {door} door."
  ],
  trap: [
    "Smell smoke behind the {door} door.",
    "The {door} door clicks like a tripwire.",
    "Old chalk on the {door} reads 'NO'.",
    "Hear shotgun shells stacked behind {door}.",
    "The {door} door's bolt is hair-trigger."
  ],
  decoy: [
    "The {door} door looks too clean — staged.",
    "The {door} door dead-ends into a vault drill.",
    "{door} door leads back to floor one.",
    "{door} door is a mirror trick — no real way.",
    "The {door} door is a vault decoy, not the take."
  ]
};

const SCORE_SLUG = "vault-runner";
const SCORE_FALLBACK = { easy: 0, medium: 0, hard: 0, deepest: 0 };

const VR_KEYS = `
  @keyframes vr-pop {
    0% { opacity: 0; transform: scale(.55); }
    55% { opacity: 1; transform: scale(1.16); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes vr-shake {
    0%, 100% { transform: translateX(0); }
    18% { transform: translateX(-7px); }
    36% { transform: translateX(6px); }
    54% { transform: translateX(-5px); }
    72% { transform: translateX(4px); }
  }
  @keyframes vr-vault-burst {
    0% { opacity: 0; transform: scale(.3) rotate(-10deg); }
    55% { opacity: 1; transform: scale(1.15) rotate(2deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes vr-pulse {
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

function makeFloor(tipHonesty) {
  const doors = shuffle(["safe", "decoy", "trap"]);
  const doorImages = [0, 1, 2].map(() => pickRandom(DOOR_IMAGES));
  const subject = Math.floor(Math.random() * 3);
  const actualType = doors[subject];
  const honest = Math.random() < tipHonesty;
  const claimedType = honest
    ? actualType
    : pickRandom(["safe", "decoy", "trap"].filter((t) => t !== actualType));
  const template = pickRandom(TIP_TEXTS[claimedType]);
  const text = template.replace("{door}", DOOR_LABELS[subject]);
  return {
    doors,
    doorImages,
    tip: { subject, claimedType, honest, text }
  };
}

export default function VaultRunner() {
  const [phase, setPhase] = useState("setup");
  const [difficulty, setDifficulty] = useState("medium");
  const [floor, setFloor] = useState(null);
  const [depth, setDepth] = useState(0);
  const [lives, setLives] = useState(0);
  const [score, setScore] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [reveal, setReveal] = useState(null);
  const [vaultBurst, setVaultBurst] = useState(null);
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
        setDepth((finalDepth) => {
          setBest((prev) => {
            const priorScore = prev[difficulty] || 0;
            const priorDeepest = prev.deepest || 0;
            if (finalScore > priorScore || finalDepth > priorDeepest) {
              const next = {
                ...prev,
                [difficulty]: Math.max(priorScore, finalScore),
                deepest: Math.max(priorDeepest, finalDepth)
              };
              writeScore(SCORE_SLUG, next);
              return next;
            }
            return prev;
          });
          return finalDepth;
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
      setFloor(makeFloor(lvlSettings.tipHonesty));
      setDepth(0);
      setLives(lvlSettings.lives);
      setScore(0);
      setReveal(null);
      setVaultBurst(null);
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
  const pickDoor = (idx) => {
    if (phase !== "play" || !floor || reveal) return;
    const result = floor.doors[idx];
    setReveal({ index: idx, result, at: Date.now() });

    if (result === "safe") {
      const nextDepth = depth + 1;
      const gain = (50 + nextDepth * 10) * settings.multiplier;
      setScore((s) => s + gain);
      setDepth(nextDepth);
      endRef.current = Math.min(Date.now() + settings.time * 1000, endRef.current + settings.safeBonusSec * 1000);

      const hitVault = nextDepth > 0 && nextDepth % FLOORS_PER_VAULT === 0;
      if (hitVault) {
        const vaultGain = 500 * settings.multiplier;
        setScore((s) => s + vaultGain);
        endRef.current = Math.min(Date.now() + settings.time * 1000, endRef.current + 5000);
        setVaultBurst({ depth: nextDepth, gain: vaultGain, at: Date.now() });
      }

      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        setFloor(makeFloor(settings.tipHonesty));
        setReveal(null);
        if (hitVault) setVaultBurst(null);
      }, hitVault ? 1100 : 650);
    } else if (result === "trap") {
      const remainingLives = lives - 1;
      setLives(remainingLives);
      if (remainingLives <= 0) {
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = setTimeout(() => {
          finishRound();
        }, 750);
        return;
      }
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        setFloor(makeFloor(settings.tipHonesty));
        setReveal(null);
      }, 750);
    } else {
      endRef.current = endRef.current - settings.decoyPenaltySec * 1000;
      const remain = Math.max(0, endRef.current - Date.now());
      setTimeMs(remain);
      if (remain <= 0) {
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = setTimeout(() => {
          finishRound();
        }, 600);
        return;
      }
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        setFloor(makeFloor(settings.tipHonesty));
        setReveal(null);
      }, 650);
    }
  };
  /* eslint-enable react-hooks/purity */

  const progressInVault = depth % FLOORS_PER_VAULT;
  const floorsToVault = progressInVault === 0 && depth > 0 ? 0 : FLOORS_PER_VAULT - progressInVault;

  if (phase === "setup") {
    return (
      <section style={{ display: "grid", gap: 14 }}>
        <style>{VR_KEYS}</style>
        <header style={{ display: "grid", gap: 4 }}>
          <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(26px, 5.5vw, 38px)", letterSpacing: 1, fontVariant: "small-caps" }}>Vault Runner</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.5 }}>
            Three doors a floor. One is safe, one is a decoy, one is a trap. The Lookout&apos;s tips might be straight — or a setup. How deep can you take the score before your luck runs out?
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
                  {info.time}s · {info.lives} lives · {info.multiplier}× score
                </div>
                <div style={{ color: C.muted, fontSize: 12 }}>
                  Tips {Math.round(info.tipHonesty * 100)}% honest
                </div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Best: {best[key] || 0}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", justifyItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>
            Deepest run: <span style={{ color: C.gold, fontWeight: 900 }}>{best.deepest || 0}</span> floors
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
              animation: "vr-pulse 2.4s ease-in-out infinite"
            }}
          >
            ENTER THE VAULT
          </button>
        </div>
      </section>
    );
  }

  if (phase === "play" && floor) {
    const remainSec = Math.ceil(timeMs / 1000);
    const lowOnTime = remainSec <= 10;
    return (
      <section style={{ display: "grid", gap: 14 }}>
        <style>{VR_KEYS}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>
              {settings.label.toUpperCase()}
            </div>
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${C.hit}`,
                background: "rgba(207,79,69,.14)",
                fontSize: 12,
                fontWeight: 800,
                color: C.hit,
                letterSpacing: 0.6
              }}
              title={`${lives} ${lives === 1 ? "life" : "lives"} left`}
            >
              {"♥".repeat(lives)}{"·".repeat(Math.max(0, settings.lives - lives))}
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
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${C.blue}`,
                background: "rgba(111,182,216,.14)",
                fontSize: 12,
                fontWeight: 800,
                color: C.blue
              }}
            >
              Floor: {depth + 1}
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

        <div style={{ position: "relative" }}>
          <div
            style={{
              borderRadius: 14,
              border: `1px solid ${C.line}`,
              background: "linear-gradient(180deg, rgba(31,51,32,.85), rgba(10,19,14,.85))",
              padding: "16px clamp(12px, 4vw, 22px) 22px",
              display: "grid",
              gap: 14,
              animation: reveal?.result === "trap" ? "vr-shake 380ms ease-in-out" : "none"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 10,
                color: C.muted,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1.4
              }}
            >
              <span>FLOOR {depth + 1}</span>
              <span style={{ color: floorsToVault === 0 ? C.gold : C.muted }}>
                VAULT IN {floorsToVault || FLOORS_PER_VAULT}
              </span>
            </div>

            <div
              style={{
                border: `1px dashed ${C.gold}`,
                borderRadius: 10,
                background: "rgba(255,193,94,.09)",
                padding: "10px 12px",
                color: C.cream,
                lineHeight: 1.4,
                fontSize: "clamp(13px, 3.4vw, 15px)"
              }}
            >
              <span style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.2, fontSize: 11, marginRight: 8 }}>TIP</span>
              {floor.tip.text}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              {floor.doors.map((doorType, idx) => {
                const isRevealed = reveal !== null;
                const isPicked = reveal?.index === idx;
                const showType = isRevealed ? doorType : null;
                let borderColor = C.line;
                let tintBg = "transparent";
                let imgFilter = "drop-shadow(0 8px 16px rgba(0,0,0,.45))";
                if (isRevealed) {
                  if (doorType === "safe") {
                    borderColor = C.green;
                    tintBg = "radial-gradient(circle at 50% 60%, rgba(111,176,113,.42), rgba(38,71,40,.0) 70%)";
                    imgFilter = "drop-shadow(0 8px 16px rgba(0,0,0,.45)) brightness(1.05) saturate(1.2)";
                  } else if (doorType === "trap") {
                    borderColor = isPicked ? C.hit : "rgba(207,79,69,.55)";
                    tintBg = isPicked
                      ? "radial-gradient(circle at 50% 60%, rgba(207,79,69,.55), rgba(78,28,24,.0) 70%)"
                      : "radial-gradient(circle at 50% 60%, rgba(207,79,69,.28), rgba(78,28,24,.0) 70%)";
                    imgFilter = "drop-shadow(0 8px 16px rgba(0,0,0,.45)) sepia(.4) hue-rotate(-30deg)";
                  } else {
                    borderColor = isPicked ? C.amber : "rgba(230,161,75,.55)";
                    tintBg = isPicked
                      ? "radial-gradient(circle at 50% 60%, rgba(230,161,75,.42), rgba(110,68,18,.0) 70%)"
                      : "radial-gradient(circle at 50% 60%, rgba(230,161,75,.22), rgba(110,68,18,.0) 70%)";
                    imgFilter = "drop-shadow(0 8px 16px rgba(0,0,0,.45)) sepia(.3)";
                  }
                }
                const icon =
                  showType === "safe" ? "💰" : showType === "trap" ? "⚠" : showType === "decoy" ? "⌛" : "";
                const caption =
                  showType === "safe" ? "OPEN" : showType === "trap" ? "TRAP" : showType === "decoy" ? "DECOY" : "";
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => pickDoor(idx)}
                    disabled={isRevealed}
                    style={{
                      position: "relative",
                      aspectRatio: "2 / 3",
                      borderRadius: 10,
                      border: `2px solid ${borderColor}`,
                      background: "transparent",
                      color: C.cream,
                      cursor: isRevealed ? "default" : "pointer",
                      padding: 0,
                      overflow: "hidden",
                      transition: "transform 140ms ease, border-color 160ms ease",
                      transform: isPicked && isRevealed ? "translateY(-3px)" : "translateY(0)",
                      minWidth: 0
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={floor.doorImages[idx]}
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        filter: imgFilter,
                        transition: "filter 200ms ease"
                      }}
                    />
                    {tintBg !== "transparent" && (
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: tintBg,
                          pointerEvents: "none",
                          mixBlendMode: "screen"
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        color: C.gold,
                        fontWeight: 900,
                        letterSpacing: 1.8,
                        fontSize: "clamp(13px, 3.6vw, 17px)",
                        textShadow: "0 2px 6px rgba(0,0,0,.95), 0 0 8px rgba(0,0,0,.8)"
                      }}
                    >
                      {DOOR_LABELS[idx]}
                    </div>
                    {icon && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "grid",
                          placeItems: "center",
                          fontSize: "clamp(34px, 11vw, 60px)",
                          textShadow: "0 6px 18px rgba(0,0,0,.65)",
                          animation: "vr-pop 360ms ease-out",
                          pointerEvents: "none"
                        }}
                      >
                        {icon}
                      </div>
                    )}
                    {caption && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 4,
                          left: 0,
                          right: 0,
                          textAlign: "center",
                          color:
                            showType === "safe" ? C.green : showType === "trap" ? "#ffd2ce" : C.amber,
                          fontWeight: 900,
                          letterSpacing: 1.2,
                          fontSize: "clamp(10px, 2.4vw, 12px)",
                          textShadow: "0 2px 6px rgba(0,0,0,.85)"
                        }}
                      >
                        {caption}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ minHeight: 22, textAlign: "center" }}>
              {reveal && (
                <span
                  key={reveal.at}
                  style={{
                    display: "inline-block",
                    color:
                      reveal.result === "safe"
                        ? C.green
                        : reveal.result === "trap"
                          ? C.hit
                          : C.amber,
                    fontWeight: 900,
                    letterSpacing: 1.2,
                    animation: "vr-pop 360ms ease-out"
                  }}
                >
                  {reveal.result === "safe" && `Floor cleared · +${settings.safeBonusSec}s`}
                  {reveal.result === "trap" && `Trap! −1 life`}
                  {reveal.result === "decoy" && `Decoy · −${settings.decoyPenaltySec}s`}
                </span>
              )}
            </div>
          </div>

          {vaultBurst && (
            <div
              key={vaultBurst.at}
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                pointerEvents: "none",
                animation: "vr-vault-burst 700ms cubic-bezier(.22,1.18,.36,1) both",
                zIndex: 5
              }}
            >
              <div
                style={{
                  color: C.gold,
                  fontSize: "clamp(28px, 8vw, 48px)",
                  fontWeight: 900,
                  letterSpacing: 2,
                  fontVariant: "small-caps",
                  padding: "12px 24px",
                  background: "rgba(9,19,14,.84)",
                  border: `2px solid ${C.gold}`,
                  borderRadius: 14,
                  boxShadow: "0 0 0 4px rgba(255,193,94,.18), 0 22px 44px rgba(0,0,0,.7)",
                  textShadow: "0 4px 18px rgba(0,0,0,.85)",
                  textAlign: "center",
                  lineHeight: 1.1
                }}
              >
                Vault {Math.floor(vaultBurst.depth / FLOORS_PER_VAULT)} cracked
                <div style={{ color: C.cream, fontSize: "clamp(14px, 3.6vw, 18px)", marginTop: 6, letterSpacing: 1.2 }}>
                  +{vaultBurst.gain} · +5s
                </div>
              </div>
            </div>
          )}
        </div>

        <p style={{ margin: 0, color: C.muted, fontSize: 12, lineHeight: 1.5, textAlign: "center" }}>
          Trust the tip — or don&apos;t. Vault {Math.floor(depth / FLOORS_PER_VAULT) + 1} in {floorsToVault || FLOORS_PER_VAULT} floors.
        </p>
      </section>
    );
  }

  // result
  const newBest = score > 0 && score === best[difficulty];
  const newDeepest = depth > 0 && depth === best.deepest;
  return (
    <section style={{ display: "grid", gap: 14 }}>
      <style>{VR_KEYS}</style>
      <header style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(26px, 5.5vw, 38px)", letterSpacing: 1, fontVariant: "small-caps" }}>
          Run Over{playerName ? `, Detective ${playerName}` : ""}
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
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>DEPTH</div>
            <div style={{ color: C.blue, fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 900 }}>{depth}</div>
          </div>
          <div>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>VAULTS</div>
            <div style={{ color: C.cream, fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 900 }}>{Math.floor(depth / FLOORS_PER_VAULT)}</div>
          </div>
        </div>
        <div style={{ color: C.cream, fontSize: 13 }}>
          Personal best{" "}
          <span style={{ color: C.gold, fontWeight: 900 }}>{best[difficulty] || 0}</span>
          {newBest && <span style={{ color: C.green, fontWeight: 900, marginLeft: 8 }}>NEW</span>}
          <span style={{ marginLeft: 14, color: C.muted }}>·</span>
          <span style={{ marginLeft: 14 }}>Deepest </span>
          <span style={{ color: C.gold, fontWeight: 900 }}>{best.deepest || 0}</span>
          {newDeepest && <span style={{ color: C.green, fontWeight: 900, marginLeft: 8 }}>NEW</span>}
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
          RUN IT AGAIN
        </button>
      </div>
    </section>
  );
}
