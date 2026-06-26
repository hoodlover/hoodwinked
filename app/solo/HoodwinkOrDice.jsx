"use client";

import { useMemo, useState } from "react";

const DIFFICULTIES = {
  easy: {
    label: "Easy",
    callThreshold: 0.2,
    bluffChance: 0.14,
    raiseValueChance: 0.62
  },
  medium: {
    label: "Medium",
    callThreshold: 0.48,
    bluffChance: 0.3,
    raiseValueChance: 0.5
  },
  hard: {
    label: "Hard",
    callThreshold: 0.68,
    bluffChance: 0.48,
    raiseValueChance: 0.38
  }
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
  blue: "#6fb6d8",
  green: "#6fb071"
};

function rollHand() {
  return Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
}

function plural(value) {
  return value === 1 ? "one" : value === 2 ? "twos" : value === 3 ? "threes" : value === 4 ? "fours" : value === 5 ? "fives" : "sixes";
}

function bidText(bid) {
  if (!bid) return "No bid yet";
  return `${bid.player === "you" ? "You bid" : "AI bids"} ${bid.count} ${plural(bid.value)}`;
}

function isHigherBid(next, current) {
  if (!current) return next.count >= 1 && next.value >= 1 && next.value <= 6;
  return next.count > current.count || (next.count === current.count && next.value > current.value);
}

function nextMinimumBid(current) {
  if (!current) return { count: 1, value: 1 };
  if (current.value < 6) return { count: current.count, value: current.value + 1 };
  return { count: current.count + 1, value: 1 };
}

function matchingDice(bid, youDice, aiDice) {
  return [...youDice, ...aiDice].filter((die) => die === bid.value).length;
}

function clampBid(bid) {
  return {
    count: Math.min(10, Math.max(1, bid.count)),
    value: Math.min(6, Math.max(1, bid.value))
  };
}

function chooseAiBid(currentBid, aiDice, difficulty) {
  const settings = DIFFICULTIES[difficulty];
  const minimum = nextMinimumBid(currentBid);
  const counts = Array.from({ length: 6 }, (_, i) => aiDice.filter((die) => die === i + 1).length);
  const bestValue = counts.reduce((best, count, index) => (count > counts[best - 1] ? index + 1 : best), 1);
  const knownCount = counts[bestValue - 1];
  const honestCount = Math.min(10, Math.max(minimum.count, knownCount + (difficulty === "hard" ? 2 : difficulty === "medium" ? 1 : 0)));
  const wantsBluff = Math.random() < settings.bluffChance;

  let candidate = wantsBluff
    ? { count: Math.min(10, minimum.count + (difficulty === "hard" ? 2 : 1)), value: Math.random() < 0.5 ? 6 : bestValue }
    : { count: honestCount, value: bestValue };

  if (!isHigherBid(candidate, currentBid)) {
    candidate = Math.random() < settings.raiseValueChance && currentBid?.value < 6
      ? { count: currentBid.count, value: currentBid.value + 1 }
      : { count: minimum.count, value: minimum.value };
  }

  return clampBid(candidate);
}

function shouldAiCall(currentBid, aiDice, difficulty, playerBidCount) {
  if (!currentBid) return false;
  const settings = DIFFICULTIES[difficulty];
  const aiMatches = aiDice.filter((die) => die === currentBid.value).length;
  const expectedOtherMatches = difficulty === "hard" ? 1.25 : difficulty === "medium" ? 0.95 : 0.7;
  const suspicion = currentBid.count - aiMatches - expectedOtherMatches + playerBidCount * (difficulty === "hard" ? 0.08 : 0.03);
  return suspicion > settings.callThreshold && Math.random() > (difficulty === "easy" ? 0.45 : 0.18);
}

function Die({ value, hidden, owner }) {
  return (
    <span
      className="hod-die"
      style={{
        width: 58,
        height: 58,
        borderRadius: 8,
        display: "grid",
        placeItems: "center",
        border: `1px solid ${hidden ? C.line : owner === "you" ? C.gold : C.blue}`,
        background: hidden
          ? "linear-gradient(180deg, rgba(9,19,14,.92), rgba(31,51,32,.86))"
          : owner === "you"
            ? "linear-gradient(180deg, #fff3bf, #ffc15e)"
            : "linear-gradient(180deg, #d7f2ff, #6fb6d8)",
        color: hidden ? C.muted : C.dark,
        fontSize: 22,
        fontWeight: 900,
        boxShadow: "0 10px 20px rgba(0,0,0,.26)",
        flex: "0 0 auto"
      }}
    >
      {hidden ? "?" : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/hoodwin_or_dice/${value}.webp`}
          alt={`${value}`}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 7 }}
        />
      )}
    </span>
  );
}

function createRound(lives, difficulty, starter = "you") {
  return {
    difficulty,
    lives,
    phase: "playing",
    turn: starter,
    youDice: rollHand(),
    aiDice: rollHand(),
    currentBid: null,
    bidHistory: [],
    selectedBid: { count: 1, value: 1 },
    message: starter === "you" ? "You rolled first. Open with a bid." : "AI opens this round.",
    roundWinner: null,
    lastCaller: null,
    lastLoser: null
  };
}

export default function HoodwinkOrDice() {
  const [difficulty, setDifficulty] = useState("medium");
  const [game, setGame] = useState(null);
  const currentBid = game?.currentBid ?? null;
  const minBid = useMemo(() => nextMinimumBid(currentBid), [currentBid]);
  const selectedBid = game?.selectedBid ?? minBid;
  const reveal = game?.phase === "reveal" || game?.phase === "gameover";
  const playerBidCount = game?.bidHistory.filter((bid) => bid.player === "you").length ?? 0;

  const start = (chosenDifficulty = difficulty) => {
    setDifficulty(chosenDifficulty);
    setGame(createRound({ you: 3, ai: 3 }, chosenDifficulty, Math.random() > 0.5 ? "you" : "ai"));
  };

  const setBid = (patch) => {
    setGame((current) => {
      if (!current || current.phase !== "playing" || current.turn !== "you") return current;
      return { ...current, selectedBid: clampBid({ ...current.selectedBid, ...patch }) };
    });
  };

  const applyLoss = (current, loser, caller) => {
    const nextLives = { ...current.lives, [loser]: current.lives[loser] - 1 };
    const gameover = nextLives.you <= 0 || nextLives.ai <= 0;
    const youWonCall = caller === "you" && loser === "ai";
    const youLostCall = caller === "you" && loser === "you";
    const aiLostCall = caller === "ai" && loser === "ai";
    const message = youWonCall
      ? "You called correctly!"
      : youLostCall
        ? "Bluff failed—AI wins!"
        : aiLostCall
          ? "AI called wrong. You win the round."
          : "AI caught the bluff.";

    return {
      ...current,
      lives: nextLives,
      phase: gameover ? "gameover" : "reveal",
      message: gameover ? `${message} ${nextLives.ai <= 0 ? "You win the match." : "AI wins the match."}` : message,
      roundWinner: loser === "you" ? "ai" : "you",
      lastCaller: caller,
      lastLoser: loser
    };
  };

  const resolveBluff = (caller) => {
    setGame((current) => {
      if (!current || !current.currentBid || current.phase !== "playing") return current;
      const matches = matchingDice(current.currentBid, current.youDice, current.aiDice);
      const loser = matches >= current.currentBid.count ? caller : current.currentBid.player;
      return applyLoss(current, loser, caller);
    });
  };

  const aiTurn = (current) => {
    if (shouldAiCall(current.currentBid, current.aiDice, current.difficulty, playerBidCount)) {
      const matches = matchingDice(current.currentBid, current.youDice, current.aiDice);
      const loser = matches >= current.currentBid.count ? "ai" : current.currentBid.player;
      return applyLoss(current, loser, "ai");
    }

    const aiBid = { ...chooseAiBid(current.currentBid, current.aiDice, current.difficulty), player: "ai" };
    return {
      ...current,
      currentBid: aiBid,
      selectedBid: nextMinimumBid(aiBid),
      bidHistory: [...current.bidHistory, aiBid],
      turn: "you",
      message: bidText(aiBid)
    };
  };

  const submitBid = () => {
    setGame((current) => {
      if (!current || current.phase !== "playing" || current.turn !== "you") return current;
      if (!isHigherBid(current.selectedBid, current.currentBid)) {
        return { ...current, message: "Raise the bid: more dice, or the same count with a higher value." };
      }
      const playerBid = { ...current.selectedBid, player: "you" };
      const afterPlayer = {
        ...current,
        currentBid: playerBid,
        bidHistory: [...current.bidHistory, playerBid],
        turn: "ai",
        message: bidText(playerBid)
      };
      return aiTurn(afterPlayer);
    });
  };

  const pass = () => {
    setGame((current) => {
      if (!current || current.phase !== "playing" || current.turn !== "you") return current;
      if (!current.currentBid) return { ...current, message: "No bid to pass on yet. Open with a bid." };
      return aiTurn({ ...current, message: "You passed. AI presses the table." });
    });
  };

  const nextRound = () => {
    setGame((current) => {
      if (!current) return current;
      const starter = current.lastLoser === "you" ? "ai" : "you";
      return createRound(current.lives, current.difficulty, starter);
    });
  };

  const changeDifficulty = () => {
    setGame(null);
  };

  return (
    <section
      className="hod-root"
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
        @media (max-width: 640px) {
          .hod-root { padding: 10px !important; margin-top: 12px !important; }
          .hod-root .hod-header { gap: 8px !important; margin-bottom: 10px !important; }
          .hod-root .hod-header-img { width: 52px !important; }
          .hod-root .hod-title { font-size: 22px !important; margin: 2px 0 !important; }
          .hod-root .hod-eyebrow { font-size: 10px !important; letter-spacing: 1.2px !important; }
          .hod-root .hod-blurb { font-size: 12px !important; line-height: 1.35 !important; }
          .hod-root .hod-diff-btn { padding: 6px 9px !important; font-size: 12px !important; }
          .hod-root .hod-howto { padding: 8px !important; font-size: 11px !important; line-height: 1.35 !important; margin-bottom: 10px !important; }
          .hod-root .hod-info { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 6px !important; margin-bottom: 10px !important; }
          .hod-root .hod-info > div { padding: 6px !important; }
          .hod-root .hod-info-label { font-size: 9px !important; letter-spacing: .8px !important; }
          .hod-root .hod-info-value { font-size: 13px !important; margin-top: 3px !important; line-height: 1.2 !important; }
          .hod-root .hod-dice-grid { grid-template-columns: 1fr !important; gap: 8px !important; margin-bottom: 10px !important; }
          .hod-root .hod-dice-grid > div { padding: 7px !important; }
          .hod-root .hod-dice-row { gap: 5px !important; flex-wrap: nowrap !important; justify-content: space-between; }
          .hod-root .hod-die { width: 46px !important; height: 46px !important; font-size: 16px !important; }
          .hod-root .hod-action-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
          .hod-root .hod-action-grid > div { padding: 7px !important; }
          .hod-root .hod-history-list { max-height: 110px !important; }
          .hod-root .hod-history-item { font-size: 12px !important; padding: 5px 7px !important; }
          .hod-root .hod-move-row button { padding: 7px 9px !important; font-size: 12px !important; }
          .hod-root .hod-bid-readout { font-size: 12px !important; }
        }
      `}</style>
      <div className="hod-header" style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", maxWidth: 900 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="hod-header-img"
            src="/hoodwin_or_dice/hoodwink-or-dice.png"
            alt=""
            aria-hidden="true"
            style={{ width: "clamp(64px, 10vw, 104px)", height: "auto", borderRadius: 8, filter: "drop-shadow(0 12px 22px rgba(0,0,0,.42))", flex: "0 0 auto" }}
          />
          <div>
          <div className="hod-eyebrow" style={{ color: C.gold, fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>PLAYABLE SOLO CASE</div>
          <h2 className="hod-title" style={{ margin: "6px 0", color: C.cream, fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1 }}>
            Hoodwink or Dice
          </h2>
          <p className="hod-blurb" style={{ color: C.muted, margin: 0, maxWidth: 680, lineHeight: 1.5 }}>
            Down in the jailhouse rec room, every suspect has a cup of dice and a story that does not quite hold. Bid how many matching dice you think are hidden across both hands, raise the pressure, or call the AI&apos;s bluff when the alibi sounds too clean.
          </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {Object.entries(DIFFICULTIES).map(([value, item]) => (
            <button
              key={value}
              type="button"
              onClick={() => (game ? null : setDifficulty(value))}
              disabled={!!game && game.phase !== "gameover"}
              style={{
                border: `1px solid ${difficulty === value ? C.gold : C.line}`,
                background: difficulty === value ? `${C.gold}22` : "rgba(9,19,14,.5)",
                color: difficulty === value ? C.gold : C.cream,
                borderRadius: 8,
                padding: "10px 12px",
                fontWeight: 900,
                cursor: !game || game.phase === "gameover" ? "pointer" : "default"
              }}
              className="hod-diff-btn"
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => start(difficulty)}
            className="hod-diff-btn"
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
            {game ? "New match" : "Start match"}
          </button>
        </div>
      </div>

      <div className="hod-howto" style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.45)", color: C.muted, fontWeight: 800, lineHeight: 1.45, marginBottom: 16 }}>
        How to play: both sides roll five hidden dice. A bid like 3 fives means there are at least three dice showing 5 across both hands. Each new bid must raise the count or keep the count and raise the value. Call Bluff to reveal; if the bid is true, the caller loses a life. If it is false, the bidder loses a life.
      </div>

      <div className="hod-info" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginBottom: 16 }}>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
          <div className="hod-info-label" style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12 }}>LIVES</div>
          <div className="hod-info-value" style={{ color: C.cream, fontWeight: 900, fontSize: 18, marginTop: 8 }}>
            You {game?.lives.you ?? 3} / AI {game?.lives.ai ?? 3}
          </div>
        </div>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
          <div className="hod-info-label" style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12 }}>CURRENT BID</div>
          <div className="hod-info-value" style={{ color: C.cream, fontWeight: 900, fontSize: 18, marginTop: 8 }}>{bidText(currentBid)}</div>
        </div>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
          <div className="hod-info-label" style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12 }}>STATUS</div>
          <div className="hod-info-value" style={{ color: game?.phase === "gameover" ? C.gold : C.cream, fontWeight: 900, fontSize: 18, marginTop: 8 }}>
            {game?.message ?? "Pick a difficulty and start the match."}
          </div>
        </div>
      </div>

      {game && (
        <>
          <div className="hod-dice-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 16 }}>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
              <div className="hod-info-label" style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12, marginBottom: 10 }}>YOUR DICE</div>
              <div className="hod-dice-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {game.youDice.map((die, index) => (
                  <Die key={`${die}-${index}`} value={die} hidden={game.turn === "ai" && !reveal} owner="you" />
                ))}
              </div>
            </div>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
              <div className="hod-info-label" style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12, marginBottom: 10 }}>AI DICE</div>
              <div className="hod-dice-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {game.aiDice.map((die, index) => (
                  <Die key={`${die}-${index}`} value={die} hidden={!reveal} owner="ai" />
                ))}
              </div>
            </div>
          </div>

          <div className="hod-action-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, alignItems: "start" }}>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
              <div className="hod-info-label" style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12, marginBottom: 10 }}>BID HISTORY</div>
              <div className="hod-history-list" style={{ display: "grid", gap: 6, maxHeight: 190, overflow: "auto" }}>
                {game.bidHistory.length ? game.bidHistory.map((bid, index) => (
                  <div
                    key={`${bid.player}-${bid.count}-${bid.value}-${index}`}
                    className="hod-history-item"
                    style={{
                      color: C.cream,
                      border: "1px solid rgba(129,164,117,.38)",
                      borderRadius: 6,
                      padding: "7px 9px",
                      background: bid.player === "you" ? "rgba(255,193,94,.12)" : "rgba(111,182,216,.13)",
                      fontWeight: 800
                    }}
                  >
                    {index + 1}. {bidText(bid)}
                  </div>
                )) : (
                  <div style={{ color: C.muted, fontWeight: 800 }}>No bids yet.</div>
                )}
              </div>
            </div>

            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
              <div className="hod-info-label" style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12, marginBottom: 10 }}>YOUR MOVE</div>
              {game.phase === "playing" ? (
                <>
                  <div className="hod-move-row" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
                    <button type="button" onClick={() => setBid({ count: selectedBid.count + 1 })} disabled={game.turn !== "you"} style={controlButton(game.turn === "you")}>
                      +1 die
                    </button>
                    <button type="button" onClick={() => setBid({ value: selectedBid.value < 6 ? selectedBid.value + 1 : 1, count: selectedBid.value < 6 ? selectedBid.count : selectedBid.count + 1 })} disabled={game.turn !== "you"} style={controlButton(game.turn === "you")}>
                      +1 value
                    </button>
                    <div className="hod-bid-readout" style={{ color: C.cream, fontWeight: 900 }}>
                      I bid {selectedBid.count} {plural(selectedBid.value)}
                    </div>
                  </div>
                  <div className="hod-move-row" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button type="button" onClick={submitBid} disabled={game.turn !== "you"} style={primaryButton(game.turn === "you")}>
                      Bid Higher
                    </button>
                    <button type="button" onClick={() => resolveBluff("you")} disabled={game.turn !== "you" || !currentBid} style={dangerButton(game.turn === "you" && !!currentBid)}>
                      Call Bluff
                    </button>
                    <button type="button" onClick={pass} disabled={game.turn !== "you"} style={controlButton(game.turn === "you")}>
                      Pass
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ color: C.muted, fontWeight: 800, lineHeight: 1.4 }}>
                    {currentBid ? `${currentBid.count} ${plural(currentBid.value)} were bid. Actual total: ${matchingDice(currentBid, game.youDice, game.aiDice)}.` : "Round complete."}
                  </div>
                  {game.phase === "reveal" && (
                    <button type="button" onClick={nextRound} style={primaryButton(true)}>
                      Next round
                    </button>
                  )}
                  {(game.phase === "reveal" || game.phase === "gameover") && (
                    <button type="button" onClick={changeDifficulty} style={controlButton(true)}>
                      Change difficulty
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function primaryButton(enabled) {
  return {
    border: `1px solid ${C.gold}`,
    background: enabled ? `linear-gradient(180deg, ${C.gold}, #dca33d)` : "rgba(120,120,120,.28)",
    color: enabled ? C.dark : C.muted,
    borderRadius: 8,
    padding: "10px 14px",
    fontWeight: 900,
    cursor: enabled ? "pointer" : "default"
  };
}

function dangerButton(enabled) {
  return {
    border: `1px solid ${enabled ? C.hit : C.line}`,
    background: enabled ? "rgba(207,79,69,.24)" : "rgba(120,120,120,.18)",
    color: enabled ? "#ffd2ce" : C.muted,
    borderRadius: 8,
    padding: "10px 14px",
    fontWeight: 900,
    cursor: enabled ? "pointer" : "default"
  };
}

function controlButton(enabled) {
  return {
    border: `1px solid ${C.line}`,
    background: enabled ? "rgba(9,19,14,.55)" : "rgba(120,120,120,.18)",
    color: enabled ? C.cream : C.muted,
    borderRadius: 8,
    padding: "10px 12px",
    fontWeight: 900,
    cursor: enabled ? "pointer" : "default"
  };
}
