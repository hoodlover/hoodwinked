"use client";

import { useEffect, useMemo, useState } from "react";

const DIFFICULTY = {
  easy: { label: "Easy", shuffles: 4, speed: 536 },
  medium: { label: "Medium", shuffles: 6, speed: 383 },
  hard: { label: "Hard", shuffles: 8, speed: 230 }
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
    arcCupId: null,
    result: null
  };
}

function Cup({ cupId, slot, phase, selected, prizeCup, onPick, arcing, shuffleStep }) {
  const reveal = phase === "revealed";
  const clickable = phase === "picking";
  const isPrize = cupId === prizeCup;
  const lifted = (phase === "hiding" && isPrize) || (reveal && (selected || isPrize));
  const slotLeft = `${slot * 33.333 + 16.666}%`;
  const liftY = lifted ? "-30%" : clickable ? "-2.5%" : "0";
  const arcName = arcing ? (shuffleStep % 2 === 0 ? "monte-arc-a" : "monte-arc-b") : "none";

  return (
    <div
      className="monte-cup"
      style={{
        position: "absolute",
        left: slotLeft,
        bottom: 20,
        width: 192,
        height: 264,
        transform: "translateX(-50%)",
        transition: "left 450ms cubic-bezier(.2,.85,.2,1)",
        zIndex: lifted ? 5 : arcing ? 4 : 2,
        animation: arcing ? `${arcName} 450ms ease-in-out both` : "none"
      }}
    >
      {(phase === "hiding" || reveal) && isPrize && (
        <div
          aria-hidden="true"
          className="monte-prize"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: 124,
            height: 84,
            display: "grid",
            placeItems: "center",
            borderRadius: 8,
            background: "transparent",
            boxShadow: "0 8px 18px rgba(0,0,0,.24)",
            zIndex: 1
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/three_marks_monte/cup_ball_cash.png"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => clickable && onPick(cupId)}
        disabled={!clickable}
        aria-label={`Pick cup ${slot + 1}`}
        className="monte-cup-btn"
        style={{
          appearance: "none",
          border: "none",
          background: "transparent",
          padding: 0,
          width: "100%",
          height: "89%",
          cursor: clickable ? "pointer" : "default",
          filter: clickable ? "drop-shadow(0 16px 18px rgba(0,0,0,.38))" : "drop-shadow(0 12px 16px rgba(0,0,0,.3))",
          transform: `translateY(${liftY})${lifted ? " rotate(-4deg)" : ""}`,
          transition: "transform 380ms ease, filter 180ms ease",
          position: "relative",
          zIndex: 2
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/three_marks_monte/solocup.png"
          alt=""
          aria-hidden="true"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
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
    }, 1400);

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
        const arcCupId = Math.random() < 0.5 ? order[a] : order[b];
        [order[a], order[b]] = [order[b], order[a]];
        return { ...current, order, shuffleStep: current.shuffleStep + 1, arcCupId };
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
      arcCupId: null,
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

  const changeDifficulty = () => {
    setGame(initialGame());
  };

  return (
    <section
      className="monte-root"
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        background: "linear-gradient(180deg, rgba(31,51,32,.96), rgba(9,19,14,.78))",
        padding: "clamp(14px, 3vw, 24px)",
        boxShadow: "0 20px 48px rgba(0,0,0,.32)",
        marginTop: 24
      }}
    >
      <style>{`
        @keyframes monte-arc-a {
          0% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -28px); }
          100% { transform: translate(-50%, 0); }
        }
        @keyframes monte-arc-b {
          0% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -28px); }
          100% { transform: translate(-50%, 0); }
        }
        @media (max-width: 640px) {
          .monte-root { padding: 10px !important; margin-top: 12px !important; }
          .monte-root .monte-header { gap: 8px !important; margin-bottom: 8px !important; flex-direction: column !important; align-items: stretch !important; }
          .monte-root .monte-header-row { gap: 10px !important; }
          .monte-root .monte-header-img { width: 52px !important; }
          .monte-root .monte-title { font-size: 22px !important; margin: 2px 0 !important; }
          .monte-root .monte-eyebrow { font-size: 10px !important; letter-spacing: 1.2px !important; }
          .monte-root .monte-blurb { font-size: 12px !important; line-height: 1.35 !important; }
          .monte-root .monte-scoreboard { min-width: 0 !important; grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 4px !important; }
          .monte-root .monte-scoreboard > div { padding: 5px 6px !important; }
          .monte-root .monte-scoreboard > div > div:first-child { font-size: 9px !important; }
          .monte-root .monte-scoreboard > div > div:last-child { font-size: 16px !important; }
          .monte-root .monte-diff-row { gap: 6px !important; margin-bottom: 10px !important; }
          .monte-root .monte-diff-row button { padding: 7px 10px !important; font-size: 12px !important; }
          .monte-root .monte-info { grid-template-columns: 1fr 1fr !important; gap: 6px !important; margin-bottom: 10px !important; min-height: 0 !important; }
          .monte-root .monte-info > div { padding: 6px !important; }
          .monte-root .monte-info-label { font-size: 9px !important; }
          .monte-root .monte-info-value { font-size: 12px !important; margin-top: 3px !important; line-height: 1.2 !important; }
          .monte-root .monte-stage { height: 200px !important; }
          .monte-root .monte-cup { width: 86px !important; height: 122px !important; bottom: 12px !important; }
          .monte-root .monte-prize { width: 56px !important; height: 38px !important; }
          .monte-root .monte-actions button { padding: 8px 10px !important; font-size: 13px !important; }
        }
      `}</style>
      <div className="monte-header" style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18 }}>
        <div className="monte-header-row" style={{ display: "flex", gap: 16, alignItems: "flex-start", maxWidth: 900 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="monte-header-img"
            src="/three_marks_monte/three-marks-monte.png"
            alt=""
            aria-hidden="true"
            style={{ width: "clamp(64px, 10vw, 104px)", height: "auto", borderRadius: 8, filter: "drop-shadow(0 12px 22px rgba(0,0,0,.42))", flex: "0 0 auto" }}
          />
          <div>
          <div className="monte-eyebrow" style={{ color: C.gold, fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>PLAYABLE SOLO CASE</div>
          <h2 className="monte-title" style={{ margin: "6px 0", color: C.cream, fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1 }}>
            Three Mark&apos;s Monte
          </h2>
          <p className="monte-blurb" style={{ color: C.muted, margin: 0, maxWidth: 680, lineHeight: 1.5 }}>
            A street-corner misdirection test from the Hoodwinked evidence locker. Watch the yellow marker vanish under a cup, track the shuffle, and call the con before the marks start laughing.
          </p>
          </div>
        </div>
        <div className="monte-scoreboard" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(70px, 1fr))", gap: 8, minWidth: "min(100%, 380px)" }}>
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
        <div className="monte-diff-row" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
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
        className="monte-info"
        style={{
          minHeight: 96,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
          marginBottom: 18
        }}
      >
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
          <div className="monte-info-label" style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12 }}>STATUS</div>
          <div className="monte-info-value" style={{ color: game.result === "win" ? C.gold : game.result === "loss" ? C.redLight : C.cream, fontWeight: 900, fontSize: 18, marginTop: 8 }}>
            {statusText}
          </div>
        </div>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
          <div className="monte-info-label" style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12 }}>DIFFICULTY</div>
          <div className="monte-info-value" style={{ color: C.cream, fontWeight: 900, fontSize: 18, marginTop: 8 }}>
            {settings ? `${settings.label}: ${settings.shuffles} shuffles at ${settings.speed}ms` : "Not selected"}
          </div>
        </div>
      </div>

      <div
        className="monte-stage"
        style={{
          position: "relative",
          height: "clamp(260px, 29vw, 312px)",
          overflow: "visible",
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
            arcing={game.arcCupId === cupId && game.phase === "shuffling"}
            shuffleStep={game.shuffleStep}
          />
        ))}
      </div>

      {game.phase === "revealed" && (
        <div className="monte-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <button
            type="button"
            onClick={replay}
            style={{
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
          <button
            type="button"
            onClick={changeDifficulty}
            style={{
              border: `1px solid ${C.gold}`,
              background: `linear-gradient(180deg, ${C.gold}, #dca33d)`,
              color: C.dark,
              borderRadius: 8,
              padding: "10px 16px",
              fontWeight: 900,
              cursor: "pointer"
            }}
          >
            Change difficulty
          </button>
        </div>
      )}
    </section>
  );
}
