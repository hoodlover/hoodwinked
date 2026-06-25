"use client";

import { useEffect, useMemo, useState } from "react";

const DIFFICULTY = {
  easy: { label: "Easy", shuffles: 4, speed: 500 },
  medium: { label: "Medium", shuffles: 6, speed: 300 },
  hard: { label: "Hard", shuffles: 8, speed: 150 }
};

const C = {
  bg: "#132019",
  dark: "#09130e",
  panel: "#1f3320",
  panel2: "#2f5632",
  cream: "#fbf3e4",
  muted: "#d9d2bd",
  gold: "#ffc15e",
  line: "#81a475",
  red: "#cf3d33",
  redDark: "#8d211c",
  redLight: "#f05b4c"
};

function randomCup() {
  return Math.floor(Math.random() * 3);
}

function nextSwap() {
  const first = randomCup();
  let second = randomCup();
  while (second === first) second = randomCup();
  return [first, second];
}

function slotForCup(order, cupId) {
  return order.indexOf(cupId);
}

function initialGame() {
  return {
    phase: "setup",
    difficulty: null,
    order: [0, 1, 2],
    prizeCup: null,
    selectedCup: null,
    shuffleStep: 0,
    result: null
  };
}

function Cup({ cupId, slot, phase, selected, prizeCup, onPick }) {
  const reveal = phase === "revealed";
  const lifted = reveal && selected;
  const clickable = phase === "picking";
  const isPrize = cupId === prizeCup;
  const slotLeft = `calc(${slot * 33.333 + 16.666}% - 48px)`;

  return (
    <div
      style={{
        position: "absolute",
        left: slotLeft,
        bottom: 20,
        width: 96,
        height: 132,
        transition: "left 260ms ease, transform 260ms ease",
        transform: lifted ? "translateY(-44px) rotate(-4deg)" : "translateY(0)",
        zIndex: lifted ? 3 : 2
      }}
    >
      {reveal && isPrize && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: 48,
            height: 48,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #fff4bf, #ffc15e 52%, #a76819)",
            boxShadow: "0 8px 18px rgba(0,0,0,.36)",
            fontSize: 26
          }}
        >
          ★
        </div>
      )}

      <button
        type="button"
        onClick={() => clickable && onPick(cupId)}
        disabled={!clickable}
        aria-label={`Pick cup ${slot + 1}`}
        style={{
          appearance: "none",
          border: "none",
          background: "transparent",
          padding: 0,
          width: 96,
          height: 118,
          cursor: clickable ? "pointer" : "default",
          filter: clickable ? "drop-shadow(0 16px 18px rgba(0,0,0,.38))" : "drop-shadow(0 12px 16px rgba(0,0,0,.3))",
          transform: clickable ? "translateY(-4px)" : "none",
          transition: "transform 180ms ease, filter 180ms ease"
        }}
      >
        <span
          style={{
            display: "block",
            position: "relative",
            width: 88,
            height: 108,
            margin: "4px auto 0",
            background: `linear-gradient(90deg, ${C.redDark}, ${C.red} 18%, ${C.redLight} 45%, ${C.red} 72%, ${C.redDark})`,
            clipPath: "polygon(10% 0, 90% 0, 76% 100%, 24% 100%)",
            borderRadius: "12px 12px 20px 20px",
            boxShadow: "inset 0 8px 0 rgba(255,255,255,.16), inset 0 -10px 0 rgba(0,0,0,.16)"
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 7,
              right: 7,
              top: 8,
              height: 12,
              borderRadius: 999,
              background: "rgba(255,255,255,.34)"
            }}
          />
          <span
            style={{
              position: "absolute",
              left: 25,
              right: 25,
              top: 34,
              height: 26,
              borderLeft: "2px solid rgba(255,255,255,.22)",
              borderRight: "2px solid rgba(0,0,0,.14)"
            }}
          />
        </span>
      </button>
    </div>
  );
}

export default function ShellGame() {
  const [game, setGame] = useState(initialGame);
  const [score, setScore] = useState({ wins: 0, losses: 0, streak: 0, bestStreak: 0 });

  const settings = game.difficulty ? DIFFICULTY[game.difficulty] : null;
  const statusText = useMemo(() => {
    if (game.phase === "setup") return "Choose a difficulty. The cups move as soon as the prize is hidden.";
    if (game.phase === "hiding") return "Watch closely. The mark is going under one cup.";
    if (game.phase === "shuffling") return `Shuffle ${game.shuffleStep} of ${settings?.shuffles ?? 0}`;
    if (game.phase === "picking") return "Pick a cup.";
    if (game.result === "win") return "You found the prize!";
    return "Empty cup—better luck next time";
  }, [game.phase, game.result, game.shuffleStep, settings?.shuffles]);

  useEffect(() => {
    if (game.phase !== "hiding") return undefined;

    const timer = window.setTimeout(() => {
      setGame((current) => (current.phase === "hiding" ? { ...current, phase: "shuffling" } : current));
    }, 650);

    return () => window.clearTimeout(timer);
  }, [game.phase]);

  useEffect(() => {
    if (game.phase !== "shuffling" || !settings) return undefined;

    if (game.shuffleStep >= settings.shuffles) {
      const timer = window.setTimeout(() => {
        setGame((current) => (current.phase === "shuffling" ? { ...current, phase: "picking" } : current));
      }, settings.speed);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setGame((current) => {
        if (current.phase !== "shuffling") return current;
        const [a, b] = nextSwap();
        const order = [...current.order];
        [order[a], order[b]] = [order[b], order[a]];
        return { ...current, order, shuffleStep: current.shuffleStep + 1 };
      });
    }, settings.speed);

    return () => window.clearTimeout(timer);
  }, [game.phase, game.shuffleStep, settings]);

  const start = (difficulty) => {
    setGame({
      phase: "hiding",
      difficulty,
      order: [0, 1, 2],
      prizeCup: randomCup(),
      selectedCup: null,
      shuffleStep: 0,
      result: null
    });
  };

  const pickCup = (cupId) => {
    if (game.phase !== "picking") return;
    const won = cupId === game.prizeCup;
    setScore((currentScore) => {
      const streak = won ? currentScore.streak + 1 : 0;
      return {
        wins: currentScore.wins + (won ? 1 : 0),
        losses: currentScore.losses + (won ? 0 : 1),
        streak,
        bestStreak: Math.max(currentScore.bestStreak, streak)
      };
    });
    setGame((current) => ({ ...current, phase: "revealed", selectedCup: cupId, result: won ? "win" : "loss" }));
  };

  const replay = () => {
    if (game.difficulty) start(game.difficulty);
    else setGame(initialGame());
  };

  return (
    <section
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        background: "linear-gradient(180deg, rgba(31,51,32,.96), rgba(9,19,14,.78))",
        padding: "clamp(14px, 3vw, 24px)",
        boxShadow: "0 20px 48px rgba(0,0,0,.32)",
        marginTop: 24
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ color: C.gold, fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>PLAYABLE SOLO CASE</div>
          <h2 style={{ margin: "6px 0", color: C.cream, fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1 }}>
            Three Mark&apos;s Monte
          </h2>
          <p style={{ color: C.muted, margin: 0, maxWidth: 680, lineHeight: 1.5 }}>
            A classic shell-game hustle with three red cups, one hidden prize, and a single clean pick.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(70px, 1fr))", gap: 8, minWidth: "min(100%, 380px)" }}>
          {[
            ["Wins", score.wins],
            ["Losses", score.losses],
            ["Streak", score.streak],
            ["Best", score.bestStreak]
          ].map(([label, value]) => (
            <div key={label} style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 10px", background: "rgba(9,19,14,.5)" }}>
              <div style={{ color: C.gold, fontSize: 10, fontWeight: 900, letterSpacing: 1.2 }}>{label}</div>
              <div style={{ color: C.cream, fontSize: 22, fontWeight: 900 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {game.phase === "setup" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {Object.entries(DIFFICULTY).map(([value, item]) => (
            <button
              key={value}
              type="button"
              onClick={() => start(value)}
              style={{
                border: `1px solid ${C.gold}`,
                background: value === "medium" ? `linear-gradient(180deg, ${C.gold}, #dca33d)` : "rgba(9,19,14,.5)",
                color: value === "medium" ? C.dark : C.cream,
                borderRadius: 8,
                padding: "10px 12px",
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          minHeight: 96,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
          marginBottom: 18
        }}
      >
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
          <div style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12 }}>STATUS</div>
          <div style={{ color: game.result === "win" ? C.gold : game.result === "loss" ? C.redLight : C.cream, fontWeight: 900, fontSize: 18, marginTop: 8 }}>
            {statusText}
          </div>
        </div>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
          <div style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12 }}>DIFFICULTY</div>
          <div style={{ color: C.cream, fontWeight: 900, fontSize: 18, marginTop: 8 }}>
            {settings ? `${settings.label}: ${settings.shuffles} shuffles at ${settings.speed}ms` : "Not selected"}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          height: "clamp(220px, 36vw, 300px)",
          overflow: "hidden",
          borderRadius: 8,
          border: `1px solid ${C.line}`,
          background:
            "radial-gradient(circle at 50% 35%, rgba(255,193,94,.12), transparent 32%), linear-gradient(180deg, rgba(47,86,50,.72), rgba(9,19,14,.82))"
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "5%",
            right: "5%",
            bottom: 18,
            height: 22,
            borderRadius: "50%",
            background: "rgba(0,0,0,.26)",
            filter: "blur(3px)"
          }}
        />
        {[0, 1, 2].map((cupId) => (
          <Cup
            key={cupId}
            cupId={cupId}
            slot={slotForCup(game.order, cupId)}
            phase={game.phase}
            selected={game.selectedCup === cupId}
            prizeCup={game.prizeCup}
            onPick={pickCup}
          />
        ))}
      </div>

      {game.phase === "revealed" && (
        <button
          type="button"
          onClick={replay}
          style={{
            marginTop: 16,
            border: `1px solid ${C.gold}`,
            background: `linear-gradient(180deg, ${C.gold}, #dca33d)`,
            color: C.dark,
            borderRadius: 8,
            padding: "10px 16px",
            fontWeight: 900,
            cursor: "pointer"
          }}
        >
          Replay
        </button>
      )}
    </section>
  );
}
