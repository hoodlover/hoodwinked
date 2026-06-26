"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readPlayerName, readScore, writeScore } from "./scoreStore";

const DIFFICULTIES = {
  easy: { label: "Easy", time: 90, hitBonusSec: 3, missPenaltySec: 0, hintCount: 3, hintCostSec: 5, multiplier: 1 },
  medium: { label: "Medium", time: 60, hitBonusSec: 2, missPenaltySec: 1, hintCount: 2, hintCostSec: 5, multiplier: 2 },
  hard: { label: "Hard", time: 45, hitBonusSec: 1, missPenaltySec: 2, hintCount: 1, hintCostSec: 5, multiplier: 3 }
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

// Scene schema:
//   id, name, image, aspectRatio ("w / h" string), items
// Item schema:
//   id, name, icon (emoji), x, y (0..1 of rect), radius (0..1 of rect width)
// Radius conventions (per item size):
//   tiny  (diamond, ring, coin)         -> 0.04-0.05
//   small (key, paper clip, lighter)    -> 0.05-0.06
//   med   (wallet, notebook, revolver)  -> 0.06
//   large (money bag, hat, lantern)     -> 0.07
const SCENES = [
  {
    id: "vault-office",
    name: "The Bank Manager's Office",
    image: "/stakeout/scenes/vault-office.webp",
    aspectRatio: "1024 / 1150",
    items: [
      { id: "diamond", name: "Diamond", icon: "💎", x: 0.24, y: 0.85, radius: 0.05 },
      { id: "golden-key", name: "Golden Key", icon: "🔑", x: 0.50, y: 0.46, radius: 0.06 },
      { id: "paper-clip", name: "Paper Clip", icon: "📎", x: 0.70, y: 0.92, radius: 0.05 },
      { id: "gold-coin", name: "Gold Coin", icon: "🪙", x: 0.89, y: 0.93, radius: 0.05 },
      { id: "sticky-note", name: "Sticky Note", icon: "📒", x: 0.13, y: 0.83, radius: 0.06 },
      { id: "old-photograph", name: "Old Photo", icon: "🖼️", x: 0.75, y: 0.80, radius: 0.07 },
      { id: "evidence-tag", name: "Evidence Tag", icon: "🏷️", x: 0.63, y: 0.70, radius: 0.06 },
      { id: "bull-statue", name: "Bull Statue", icon: "🐂", x: 0.87, y: 0.80, radius: 0.06 },
      { id: "lock-notebook", name: "Lock Notebook", icon: "🔒", x: 0.37, y: 0.80, radius: 0.07 },
      { id: "money-bag", name: "Money Bag", icon: "💰", x: 0.55, y: 0.32, radius: 0.07 }
    ]
  },
  {
    id: "detectives-study",
    name: "Detective's Study",
    image: "/stakeout/scenes/detectives-study.webp",
    aspectRatio: "1 / 1",
    items: [
      { id: "diamond", name: "Diamond", icon: "💎", x: 0.78, y: 0.86, radius: 0.04 },
      { id: "golden-key", name: "Golden Key", icon: "🔑", x: 0.54, y: 0.60, radius: 0.06 },
      { id: "paper-clip", name: "Paper Clip", icon: "📎", x: 0.60, y: 0.90, radius: 0.05 },
      { id: "gold-coin", name: "Gold Coin", icon: "🪙", x: 0.81, y: 0.88, radius: 0.05 },
      { id: "sticky-note", name: "Sticky Note (CALL ME)", icon: "📒", x: 0.10, y: 0.93, radius: 0.07 },
      { id: "old-photograph", name: "Old Photograph", icon: "🖼️", x: 0.08, y: 0.68, radius: 0.07 },
      { id: "evidence-tag", name: "Evidence Tag (07)", icon: "🏷️", x: 0.30, y: 0.72, radius: 0.05 },
      { id: "bull-statue", name: "Bull Statue", icon: "🐂", x: 0.83, y: 0.26, radius: 0.06 },
      { id: "lock-notebook", name: "Combination Notebook", icon: "🔒", x: 0.32, y: 0.84, radius: 0.07 },
      { id: "money-bag", name: "Money Bag", icon: "💰", x: 0.96, y: 0.93, radius: 0.07 }
    ]
  },
  {
    id: "midnight-prowler",
    name: "Midnight Window Prowler",
    image: "/stakeout/scenes/midnight-prowler.webp",
    aspectRatio: "1080 / 1440",
    items: [
      { id: "brass-key", name: "Brass Key", icon: "🔑", x: 0.566, y: 0.711, radius: 0.05 },
      { id: "pocket-watch", name: "Pocket Watch", icon: "🕰️", x: 0.602, y: 0.806, radius: 0.06 },
      { id: "diamond", name: "Diamond", icon: "💎", x: 0.720, y: 0.634, radius: 0.04 },
      { id: "revolver", name: "Revolver", icon: "🔫", x: 0.900, y: 0.922, radius: 0.06 },
      { id: "folded-note", name: "Folded Note", icon: "✉️", x: 0.231, y: 0.896, radius: 0.05 },
      { id: "cigar", name: "Cigar", icon: "🚬", x: 0.465, y: 0.718, radius: 0.05 },
      { id: "gold-coin", name: "Gold Coin", icon: "🪙", x: 0.676, y: 0.818, radius: 0.04 },
      { id: "wristwatch", name: "Wristwatch", icon: "⌚", x: 0.861, y: 0.662, radius: 0.06 },
      { id: "wallet", name: "Wallet", icon: "👛", x: 0.268, y: 0.938, radius: 0.06 },
      { id: "lipstick", name: "Lipstick Tube", icon: "💄", x: 0.485, y: 0.949, radius: 0.05 }
    ]
  },
  {
    id: "vault-entrance",
    name: "Vault Entrance",
    image: "/stakeout/scenes/vault-entrance.webp",
    aspectRatio: "1080 / 1440",
    items: [
      { id: "brass-key", name: "Brass Key", icon: "🔑", x: 0.665, y: 0.551, radius: 0.05 },
      { id: "pocket-watch", name: "Pocket Watch", icon: "🕰️", x: 0.575, y: 0.548, radius: 0.06 },
      { id: "diamond", name: "Diamond", icon: "💎", x: 0.705, y: 0.433, radius: 0.04 },
      { id: "revolver", name: "Revolver", icon: "🔫", x: 0.358, y: 0.578, radius: 0.06 },
      { id: "folded-note", name: "Folded Note", icon: "✉️", x: 0.544, y: 0.558, radius: 0.05 },
      { id: "cigar", name: "Cigar", icon: "🚬", x: 0.318, y: 0.431, radius: 0.05 },
      { id: "gold-coin", name: "Gold Coin", icon: "🪙", x: 0.745, y: 0.423, radius: 0.04 },
      { id: "wristwatch", name: "Wristwatch", icon: "⌚", x: 0.633, y: 0.547, radius: 0.05 },
      { id: "wallet", name: "Wallet", icon: "👛", x: 0.606, y: 0.549, radius: 0.06 },
      { id: "lipstick", name: "Lipstick Tube", icon: "💄", x: 0.693, y: 0.552, radius: 0.05 }
    ]
  },
  {
    id: "speakeasy-backroom",
    name: "Speakeasy Backroom",
    image: "/stakeout/scenes/speakeasy-backroom.webp",
    aspectRatio: "1080 / 1440",
    items: [
      { id: "magnifying-glass", name: "Magnifying Glass", icon: "🔍", x: 0.20, y: 0.72, radius: 0.07 },
      { id: "wallet", name: "Wallet", icon: "👛", x: 0.25, y: 0.83, radius: 0.06 },
      { id: "gold-coin", name: "Gold Coin", icon: "🪙", x: 0.28, y: 0.93, radius: 0.04 },
      { id: "diamond", name: "Diamond", icon: "💎", x: 0.49, y: 0.91, radius: 0.04 },
      { id: "pocket-watch", name: "Pocket Watch", icon: "🕰️", x: 0.53, y: 0.77, radius: 0.06 },
      { id: "wristwatch", name: "Wristwatch", icon: "⌚", x: 0.69, y: 0.76, radius: 0.06 },
      { id: "brass-key", name: "Brass Key", icon: "🔑", x: 0.68, y: 0.88, radius: 0.05 },
      { id: "lipstick", name: "Lipstick Tube", icon: "💄", x: 0.79, y: 0.85, radius: 0.05 },
      { id: "fountain-pen", name: "Fountain Pen", icon: "🖋️", x: 0.86, y: 0.75, radius: 0.05 },
      { id: "folded-note", name: "Folded Note", icon: "✉️", x: 0.90, y: 0.88, radius: 0.06 }
    ]
  },
  {
    id: "fireplace-crime-scene",
    name: "Fireplace Crime Scene",
    image: "/stakeout/scenes/fireplace-crime-scene.webp",
    aspectRatio: "1080 / 1440",
    items: [
      { id: "pocket-watch", name: "Pocket Watch", icon: "🕰️", x: 0.27, y: 0.67, radius: 0.06 },
      { id: "diamond", name: "Diamond", icon: "💎", x: 0.35, y: 0.66, radius: 0.04 },
      { id: "folded-note", name: "Folded Note", icon: "✉️", x: 0.34, y: 0.76, radius: 0.06 },
      { id: "gold-coin", name: "Gold Coin", icon: "🪙", x: 0.07, y: 0.72, radius: 0.04 },
      { id: "wristwatch", name: "Wristwatch", icon: "⌚", x: 0.34, y: 0.90, radius: 0.06 },
      { id: "wallet", name: "Wallet", icon: "👛", x: 0.17, y: 0.86, radius: 0.06 },
      { id: "lipstick", name: "Lipstick Tube", icon: "💄", x: 0.06, y: 0.82, radius: 0.05 },
      { id: "brass-key", name: "Brass Key", icon: "🔑", x: 0.44, y: 0.90, radius: 0.05 },
      { id: "cigar", name: "Cigar", icon: "🚬", x: 0.14, y: 0.57, radius: 0.05 },
      { id: "revolver", name: "Revolver", icon: "🔫", x: 0.80, y: 0.82, radius: 0.06 }
    ]
  }
];

const SCORE_SLUG = "stakeout";
const SCORE_FALLBACK = { easy: 0, medium: 0, hard: 0, scenesCleared: 0 };

const SO_KEYS = `
  @keyframes so-pop {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(.4); }
    55% { opacity: 1; transform: translate(-50%, -50%) scale(1.4); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(2.2); }
  }
  @keyframes so-miss {
    0% { opacity: 0.95; transform: translate(-50%, -50%) scale(.4); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
  }
  @keyframes so-hint-pulse {
    0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(.4); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  @keyframes so-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,193,94,.55); }
    50% { box-shadow: 0 0 0 14px rgba(255,193,94,0); }
  }
  @keyframes so-confetti {
    0% { transform: translateY(-12px) scale(.6); opacity: 0; }
    25% { transform: translateY(0) scale(1.18); opacity: 1; }
    100% { transform: translateY(12px) scale(1); opacity: 1; }
  }
`;

function pickScene() {
  return SCENES[Math.floor(Math.random() * SCENES.length)];
}

export default function Stakeout() {
  const [phase, setPhase] = useState("setup");
  const [difficulty, setDifficulty] = useState("medium");
  const [scene, setScene] = useState(SCENES[0]);
  const [foundIds, setFoundIds] = useState([]);
  const [timeMs, setTimeMs] = useState(0);
  const [score, setScore] = useState(0);
  const [scenesCleared, setScenesCleared] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [hintsLeft, setHintsLeft] = useState(0);
  const [hintTarget, setHintTarget] = useState(null);
  const [best, setBest] = useState(SCORE_FALLBACK);
  const [playerName, setPlayerName] = useState("");
  const tickRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const hintTimerRef = useRef(null);
  const endRef = useRef(0);

  useEffect(() => {
    // SSR returns fallback; hydrate the real value on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBest(readScore(SCORE_SLUG, SCORE_FALLBACK));
    setPlayerName(readPlayerName());
  }, []);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }, []);

  const settings = DIFFICULTIES[difficulty];

  const finishRound = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    setPhase((current) => {
      if (current !== "play") return current;
      setScore((finalScore) => {
        setScenesCleared((finalCleared) => {
          setBest((prev) => {
            const prior = prev[difficulty] || 0;
            const priorCleared = prev.scenesCleared || 0;
            const nextCleared = Math.max(priorCleared, finalCleared);
            if (finalScore > prior || nextCleared > priorCleared) {
              const next = { ...prev, [difficulty]: Math.max(prior, finalScore), scenesCleared: nextCleared };
              writeScore(SCORE_SLUG, next);
              return next;
            }
            return prev;
          });
          return finalCleared;
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
      setScene(pickScene());
      setFoundIds([]);
      setScore(0);
      setScenesCleared(0);
      setHintsLeft(lvlSettings.hintCount);
      setHintTarget(null);
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

  const handleSceneTap = (event) => {
    if (phase !== "play") return;
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    // Find which (unfound) item we hit, if any
    const aspect = rect.width / rect.height;
    let hitItem = null;
    let hitDistSq = Infinity;
    for (const item of scene.items) {
      if (foundIds.includes(item.id)) continue;
      // Convert to comparable space: radius is % of width; y distance scaled by aspect ratio
      const dxPct = item.x - x;
      const dyPct = (item.y - y) / aspect;
      const ds = dxPct * dxPct + dyPct * dyPct;
      if (ds < item.radius * item.radius && ds < hitDistSq) {
        hitItem = item;
        hitDistSq = ds;
      }
    }

    if (hitItem) {
      const nextFound = [...foundIds, hitItem.id];
      setFoundIds(nextFound);
      const remainSec = Math.max(0, Math.floor(timeMs / 1000));
      const gain = (50 + remainSec) * settings.multiplier;
      setScore((s) => s + gain);
      endRef.current = Math.min(Date.now() + settings.time * 1000, endRef.current + settings.hitBonusSec * 1000);
      setFeedback({ kind: "hit", x, y, note: `+${gain} · ${hitItem.name}`, at: Date.now() });
      if (hintTarget === hitItem.id) setHintTarget(null);

      // All found?
      if (nextFound.length === scene.items.length) {
        const clearBonus = 500 * settings.multiplier;
        setScore((s) => s + clearBonus);
        endRef.current = Math.min(Date.now() + settings.time * 1000, endRef.current + 5000);
        setScenesCleared((n) => n + 1);
        setFeedback({ kind: "clear", x: 0.5, y: 0.5, note: `SCENE CLEARED · +${clearBonus} · +5s`, at: Date.now() });
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => {
          setScene(pickScene());
          setFoundIds([]);
          setFeedback(null);
        }, 1600);
        return;
      }
    } else {
      if (settings.missPenaltySec > 0) {
        endRef.current = endRef.current - settings.missPenaltySec * 1000;
        const remain = Math.max(0, endRef.current - Date.now());
        setTimeMs(remain);
        if (remain <= 0) {
          finishRound();
          return;
        }
      }
      setFeedback({
        kind: "miss",
        x,
        y,
        note: settings.missPenaltySec > 0 ? `−${settings.missPenaltySec}s` : "",
        at: Date.now()
      });
    }

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 900);
  };

  const useHint = () => {
    if (phase !== "play" || hintsLeft <= 0 || hintTarget) return;
    const unfound = scene.items.filter((it) => !foundIds.includes(it.id));
    if (unfound.length === 0) return;
    const pick = unfound[Math.floor(Math.random() * unfound.length)];
    setHintTarget(pick.id);
    setHintsLeft((n) => n - 1);
    endRef.current = endRef.current - settings.hintCostSec * 1000;
    const remain = Math.max(0, endRef.current - Date.now());
    setTimeMs(remain);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintTarget(null), 1400);
    if (remain <= 0) finishRound();
  };

  const itemsFoundCount = foundIds.length;
  const totalItems = scene.items.length;
  const hintItem = useMemo(() => scene.items.find((it) => it.id === hintTarget), [scene.items, hintTarget]);

  if (phase === "setup") {
    return (
      <section style={{ display: "grid", gap: 14 }}>
        <style>{SO_KEYS}</style>
        <header style={{ display: "grid", gap: 4 }}>
          <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(26px, 5.5vw, 38px)", letterSpacing: 1, fontVariant: "small-caps" }}>The Stakeout</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.5 }}>
            Cased the joint. Now find every piece of evidence before the clock runs out.
          </p>
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
                  {info.hintCount} hint{info.hintCount === 1 ? "" : "s"} · {info.missPenaltySec > 0 ? `−${info.missPenaltySec}s wrong` : "free misses"}
                </div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Best: {best[key] || 0}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", justifyItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>
            Scenes cleared: <span style={{ color: C.gold, fontWeight: 900 }}>{best.scenesCleared || 0}</span>
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
              animation: "so-pulse 2.4s ease-in-out infinite"
            }}
          >
            BEGIN STAKEOUT
          </button>
        </div>
      </section>
    );
  }

  if (phase === "play") {
    const remainSec = Math.ceil(timeMs / 1000);
    const lowOnTime = remainSec <= 10;
    return (
      <section style={{ display: "grid", gap: 12 }}>
        <style>{SO_KEYS}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>
              {settings.label.toUpperCase()}
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
              {itemsFoundCount} / {totalItems}
            </div>
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${C.green}`,
                background: "rgba(111,176,113,.12)",
                fontSize: 12,
                fontWeight: 800,
                color: C.green
              }}
            >
              Score: {score}
            </div>
            <button
              type="button"
              onClick={useHint}
              disabled={hintsLeft <= 0 || !!hintTarget}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${hintsLeft > 0 ? C.blue : C.line}`,
                background: hintsLeft > 0 ? "rgba(111,182,216,.14)" : "rgba(10,19,14,.5)",
                color: hintsLeft > 0 ? C.blue : C.muted,
                fontWeight: 800,
                fontSize: 12,
                cursor: hintsLeft > 0 && !hintTarget ? "pointer" : "default"
              }}
            >
              Hint ({hintsLeft})
            </button>
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
          onClick={handleSceneTap}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 720,
            aspectRatio: scene.aspectRatio || "1 / 1",
            margin: "0 auto",
            borderRadius: 14,
            border: `1px solid ${C.gold}`,
            overflow: "hidden",
            cursor: "crosshair",
            boxShadow: "0 12px 28px rgba(0,0,0,.32)"
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scene.image}
            alt={scene.name}
            draggable={false}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              userSelect: "none",
              pointerEvents: "none"
            }}
          />
          {/* Found markers */}
          {scene.items.map((item) =>
            foundIds.includes(item.id) ? (
              <div
                key={`mark-${item.id}`}
                style={{
                  position: "absolute",
                  left: `${item.x * 100}%`,
                  top: `${item.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `3px solid ${C.green}`,
                  background: "rgba(111,176,113,.3)",
                  pointerEvents: "none",
                  boxShadow: "0 0 12px rgba(111,176,113,.6)"
                }}
              />
            ) : null
          )}
          {/* Hint pulse */}
          {hintItem && (
            <div
              key={`hint-${hintItem.id}`}
              style={{
                position: "absolute",
                left: `${hintItem.x * 100}%`,
                top: `${hintItem.y * 100}%`,
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: `3px dashed ${C.blue}`,
                background: "rgba(111,182,216,.18)",
                pointerEvents: "none",
                animation: "so-hint-pulse 1400ms ease-in-out",
                transform: "translate(-50%, -50%)"
              }}
            />
          )}
          {/* Tap feedback */}
          {feedback && feedback.kind === "hit" && (
            <div
              key={`hit-${feedback.at}`}
              style={{
                position: "absolute",
                left: `${feedback.x * 100}%`,
                top: `${feedback.y * 100}%`,
                width: 70,
                height: 70,
                borderRadius: "50%",
                border: `4px solid ${C.green}`,
                background: "rgba(111,176,113,.35)",
                pointerEvents: "none",
                animation: "so-pop 700ms ease-out"
              }}
            />
          )}
          {feedback && feedback.kind === "miss" && (
            <div
              key={`miss-${feedback.at}`}
              style={{
                position: "absolute",
                left: `${feedback.x * 100}%`,
                top: `${feedback.y * 100}%`,
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `2px solid ${C.hit}`,
                background: "rgba(207,79,69,.35)",
                pointerEvents: "none",
                animation: "so-miss 600ms ease-out"
              }}
            />
          )}
          {feedback && feedback.kind === "clear" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                pointerEvents: "none",
                background: "rgba(9,19,14,.6)"
              }}
            >
              <div
                style={{
                  color: C.gold,
                  fontSize: "clamp(22px, 5vw, 36px)",
                  fontWeight: 900,
                  letterSpacing: 1.8,
                  fontVariant: "small-caps",
                  padding: "14px 22px",
                  background: "rgba(9,19,14,.78)",
                  border: `2px solid ${C.gold}`,
                  borderRadius: 14,
                  boxShadow: "0 0 0 4px rgba(255,193,94,.18)",
                  textAlign: "center",
                  lineHeight: 1.2,
                  animation: "so-confetti 600ms cubic-bezier(.22,1.18,.36,1) both"
                }}
              >
                {feedback.note}
              </div>
            </div>
          )}
        </div>

        <div style={{ minHeight: 22, textAlign: "center" }}>
          {feedback && feedback.kind === "hit" && (
            <span style={{ color: C.green, fontWeight: 900, letterSpacing: 1, fontSize: 13 }}>
              {feedback.note}
            </span>
          )}
          {feedback && feedback.kind === "miss" && feedback.note && (
            <span style={{ color: C.hit, fontWeight: 900, letterSpacing: 1, fontSize: 13 }}>
              {feedback.note}
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: "8px 4px",
            scrollbarWidth: "thin"
          }}
        >
          {scene.items.map((item) => {
            const found = foundIds.includes(item.id);
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: `1px solid ${found ? C.green : C.line}`,
                  background: found ? "rgba(111,176,113,.14)" : "rgba(10,19,14,.55)",
                  color: found ? C.green : C.cream,
                  fontWeight: 800,
                  fontSize: "clamp(11px, 2.6vw, 13px)",
                  flex: "0 0 auto",
                  textDecoration: found ? "line-through" : "none",
                  opacity: found ? 0.75 : 1
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
                <span>{item.name}</span>
                {found && <span style={{ color: C.green, fontWeight: 900, marginLeft: 2 }}>✓</span>}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // result
  const newBest = score > 0 && score === best[difficulty];
  return (
    <section style={{ display: "grid", gap: 14 }}>
      <style>{SO_KEYS}</style>
      <header style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(26px, 5.5vw, 38px)", letterSpacing: 1, fontVariant: "small-caps" }}>
          Stakeout Over{playerName ? `, Detective ${playerName}` : ""}
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
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>SCENES</div>
            <div style={{ color: C.blue, fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 900 }}>{scenesCleared}</div>
          </div>
          <div>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>FOUND</div>
            <div style={{ color: C.cream, fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 900 }}>{foundIds.length}</div>
          </div>
        </div>
        <div style={{ color: C.cream, fontSize: 13 }}>
          Personal best{" "}
          <span style={{ color: C.gold, fontWeight: 900 }}>{best[difficulty] || 0}</span>
          {newBest && <span style={{ color: C.green, fontWeight: 900, marginLeft: 8 }}>NEW</span>}
          <span style={{ marginLeft: 14, color: C.muted }}>·</span>
          <span style={{ marginLeft: 14 }}>Career scenes </span>
          <span style={{ color: C.gold, fontWeight: 900 }}>{best.scenesCleared || 0}</span>
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
          RUN ANOTHER
        </button>
      </div>
    </section>
  );
}
