"use client";

import { useMemo, useState } from "react";

const DIFFICULTIES = {
  easy: { label: "Easy", soft17: false, loose16: true },
  medium: { label: "Medium", soft17: false, loose16: false },
  hard: { label: "Hard", soft17: true, loose16: false }
};

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const C = {
  dark: "#09130e",
  cream: "#fbf3e4",
  muted: "#d9d2bd",
  gold: "#ffc15e",
  line: "#81a475",
  panel: "#1f3320",
  table: "#214d34",
  table2: "#132019",
  red: "#cf4f45",
  blue: "#6fb6d8",
  green: "#6fb071"
};

function createDeck() {
  const deck = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({ rank, suit, id: `${rank}${suit}` });
    });
  });

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function draw(deck) {
  const [card, ...nextDeck] = deck;
  return { card, deck: nextDeck };
}

function cardValue(card) {
  if (card.rank === "A") return 11;
  if (["K", "Q", "J"].includes(card.rank)) return 10;
  return Number(card.rank);
}

function handValue(cards) {
  let total = cards.reduce((sum, card) => sum + cardValue(card), 0);
  let aces = cards.filter((card) => card.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  const soft = cards.some((card) => card.rank === "A") && total <= 21 && cards.reduce((sum, card) => sum + cardValue(card), 0) === total;
  return { total, soft };
}

function visibleDealerTotal(hand, reveal) {
  return reveal ? handValue(hand).total : handValue(hand.slice(0, 1)).total;
}

function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards).total === 21;
}

function settle({ playerHand, dealerHand, bet, balance, blackjack = false }) {
  const playerTotal = handValue(playerHand).total;
  const dealerTotal = handValue(dealerHand).total;

  if (blackjack) {
    const payout = Math.floor(bet * 1.5);
    return { balance: balance + payout, result: "blackjack", message: `Blackjack! You win $${payout}.` };
  }
  if (playerTotal > 21) return { balance: balance - bet, result: "loss", message: "You bust" };
  if (dealerTotal > 21) return { balance: balance + bet, result: "win", message: "You win!" };
  if (playerTotal > dealerTotal) return { balance: balance + bet, result: "win", message: "You win!" };
  if (playerTotal < dealerTotal) return { balance: balance - bet, result: "loss", message: "Dealer wins" };
  return { balance, result: "push", message: "Push" };
}

function dealerShouldHit(hand, difficulty, playerTotal) {
  const { total, soft } = handValue(hand);
  if (total < 16) return true;
  if (difficulty === "easy" && total === 16) return Math.random() < 0.65;
  if (difficulty === "hard") {
    if (soft && total === 17) return true;
    return total < 17 || (total < playerTotal && total < 19);
  }
  return total < 17 || (DIFFICULTIES[difficulty].soft17 && soft && total === 17);
}

function runDealerTurn(game) {
  let deck = [...game.deck];
  let dealerHand = [...game.dealerHand];
  const playerTotal = handValue(game.playerHand).total;

  while (dealerShouldHit(dealerHand, game.difficulty, playerTotal)) {
    const next = draw(deck);
    dealerHand = [...dealerHand, next.card];
    deck = next.deck;
  }

  const settlement = settle({
    playerHand: game.playerHand,
    dealerHand,
    bet: game.bet,
    balance: game.balance
  });

  return {
    ...game,
    deck,
    dealerHand,
    balance: settlement.balance,
    phase: "settled",
    result: settlement.result,
    message: settlement.message,
    revealDealer: true
  };
}

function newHand(balance, bet, difficulty) {
  let deck = createDeck();
  const playerHand = [];
  const dealerHand = [];

  for (let i = 0; i < 2; i += 1) {
    let next = draw(deck);
    playerHand.push(next.card);
    deck = next.deck;
    next = draw(deck);
    dealerHand.push(next.card);
    deck = next.deck;
  }

  const base = {
    difficulty,
    deck,
    playerHand,
    dealerHand,
    bet,
    balance,
    phase: "player",
    message: "Your move.",
    result: null,
    doubled: false,
    revealDealer: false
  };

  if (isBlackjack(playerHand)) {
    const settlement = settle({ playerHand, dealerHand, bet, balance, blackjack: true });
    return {
      ...base,
      balance: settlement.balance,
      phase: "settled",
      result: settlement.result,
      message: settlement.message,
      revealDealer: true
    };
  }

  return base;
}

function Card({ card, hidden }) {
  const red = card && ["♥", "♦"].includes(card.suit);
  return (
    <div
      style={{
        width: 70,
        height: 98,
        borderRadius: 8,
        border: hidden ? "1px solid rgba(255,255,255,.22)" : "1px solid rgba(9,19,14,.22)",
        background: hidden
          ? "linear-gradient(135deg, #243f29, #09130e 48%, #243f29)"
          : "linear-gradient(180deg, #fff8e9, #f0dec1)",
        color: hidden ? C.gold : red ? "#b92822" : C.dark,
        display: "grid",
        placeItems: "center",
        fontWeight: 900,
        fontSize: hidden ? 24 : 22,
        boxShadow: "0 12px 24px rgba(0,0,0,.28)",
        position: "relative"
      }}
    >
      {hidden ? "?" : `${card.rank}${card.suit}`}
    </div>
  );
}

function Hand({ title, cards, total, hideHole }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ color: C.cream, margin: 0, fontSize: 18 }}>{title}</h3>
        <div style={{ color: C.gold, fontWeight: 900 }}>Total: {total}</div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", minHeight: 104 }}>
        {cards.map((card, index) => (
          <Card key={`${card.id}-${index}`} card={card} hidden={hideHole && index === 1} />
        ))}
      </div>
    </div>
  );
}

export default function OwnTheHouse() {
  const [difficulty, setDifficulty] = useState("medium");
  const [balance, setBalance] = useState(1000);
  const [betInput, setBetInput] = useState(50);
  const [game, setGame] = useState(null);

  const activeBalance = game?.balance ?? balance;
  const bet = Math.max(1, Math.min(Number(betInput) || 1, activeBalance));
  const playerTotal = game ? handValue(game.playerHand).total : 0;
  const dealerTotal = game ? visibleDealerTotal(game.dealerHand, game.revealDealer) : 0;
  const canAct = game?.phase === "player";
  const canDouble = canAct && game.playerHand.length === 2 && activeBalance >= game.bet * 2;

  const statusColor = useMemo(() => {
    if (!game?.result) return C.cream;
    if (game.result === "win" || game.result === "blackjack") return C.gold;
    if (game.result === "loss") return C.red;
    return C.blue;
  }, [game?.result]);

  const deal = () => {
    const next = newHand(activeBalance, bet, difficulty);
    setGame(next);
    setBalance(next.balance);
  };

  const hit = () => {
    setGame((current) => {
      if (!current || current.phase !== "player") return current;
      const next = draw(current.deck);
      const playerHand = [...current.playerHand, next.card];
      const total = handValue(playerHand).total;
      if (total > 21) {
        const settlement = settle({
          playerHand,
          dealerHand: current.dealerHand,
          bet: current.bet,
          balance: current.balance
        });
        setBalance(settlement.balance);
        return {
          ...current,
          deck: next.deck,
          playerHand,
          balance: settlement.balance,
          phase: "settled",
          result: settlement.result,
          message: settlement.message,
          revealDealer: true
        };
      }
      return { ...current, deck: next.deck, playerHand, message: "Hit, stand, or double down." };
    });
  };

  const stand = () => {
    setGame((current) => {
      if (!current || current.phase !== "player") return current;
      const next = runDealerTurn({ ...current, phase: "dealer", revealDealer: true });
      setBalance(next.balance);
      return next;
    });
  };

  const doubleDown = () => {
    setGame((current) => {
      if (!current || current.phase !== "player" || current.playerHand.length !== 2 || current.balance < current.bet * 2) return current;
      const next = draw(current.deck);
      const playerHand = [...current.playerHand, next.card];
      const doubled = { ...current, deck: next.deck, playerHand, bet: current.bet * 2, doubled: true };
      if (handValue(playerHand).total > 21) {
        const settlement = settle({
          playerHand,
          dealerHand: current.dealerHand,
          bet: doubled.bet,
          balance: current.balance
        });
        setBalance(settlement.balance);
        return {
          ...doubled,
          balance: settlement.balance,
          phase: "settled",
          result: settlement.result,
          message: settlement.message,
          revealDealer: true
        };
      }
      const finished = runDealerTurn({ ...doubled, phase: "dealer", revealDealer: true });
      setBalance(finished.balance);
      return finished;
    });
  };

  const resetBank = () => {
    setBalance(1000);
    setBetInput(50);
    setGame(null);
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
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", maxWidth: 900 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/the_house_always_lies/the-house-always-lies.webp"
            alt=""
            aria-hidden="true"
            style={{ width: "clamp(82px, 13vw, 132px)", height: "auto", borderRadius: 8, filter: "drop-shadow(0 12px 22px rgba(0,0,0,.42))", flex: "0 0 auto" }}
          />
          <div>
          <div style={{ color: C.gold, fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>PLAYABLE SOLO CASE</div>
          <h2 style={{ margin: "6px 0", color: C.cream, fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1 }}>
            The House Always Lies
          </h2>
          <p style={{ color: C.muted, margin: 0, maxWidth: 680, lineHeight: 1.5 }}>
            An undercover blackjack table in the back room of a crooked club. Beat the dealer without crossing 21, double your stake when the read is strong, and remember: the house smiles most when it is setting a trap.
          </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {Object.entries(DIFFICULTIES).map(([value, item]) => (
            <button
              key={value}
              type="button"
              onClick={() => !canAct && setDifficulty(value)}
              disabled={canAct}
              style={{
                border: `1px solid ${difficulty === value ? C.gold : C.line}`,
                background: difficulty === value ? `${C.gold}22` : "rgba(9,19,14,.5)",
                color: difficulty === value ? C.gold : C.cream,
                borderRadius: 8,
                padding: "10px 12px",
                fontWeight: 900,
                cursor: canAct ? "default" : "pointer"
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.45)", color: C.muted, fontWeight: 800, lineHeight: 1.45, marginBottom: 16 }}>
        How to play: Hit draws another card. Stand keeps your total and lets the dealer play. Double Down doubles your bet, gives you exactly one more card, then forces you to stand. Beginner tip: stand on 17 or more, usually hit 11 or less, and consider doubling when your first two cards total 10 or 11 and the dealer is showing a weak card.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 16 }}>
        <div style={panelStyle()}>
          <div style={labelStyle()}>BALANCE</div>
          <div style={{ color: C.cream, fontWeight: 900, fontSize: 24 }}>${activeBalance}</div>
        </div>
        <div style={panelStyle()}>
          <div style={labelStyle()}>BET</div>
          <input
            type="number"
            min="1"
            max={activeBalance}
            value={betInput}
            onChange={(event) => setBetInput(event.target.value)}
            disabled={canAct}
            style={{
              width: "100%",
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              background: "rgba(9,19,14,.72)",
              color: C.cream,
              padding: "9px 10px",
              fontWeight: 900,
              fontSize: 16
            }}
          />
        </div>
        <div style={panelStyle()}>
          <div style={labelStyle()}>STATUS</div>
          <div style={{ color: statusColor, fontWeight: 900, fontSize: 18, marginTop: 6 }}>
            {game?.message ?? "Set your bet and deal."}
          </div>
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          padding: "clamp(14px, 3vw, 22px)",
          background: `radial-gradient(circle at 50% 45%, rgba(255,193,94,.12), transparent 34%), linear-gradient(180deg, ${C.table}, ${C.table2})`
        }}
      >
        {game ? (
          <div style={{ display: "grid", gap: 28 }}>
            <Hand title="Dealer" cards={game.dealerHand} total={dealerTotal} hideHole={!game.revealDealer} />
            <div style={{ height: 1, background: "rgba(129,164,117,.42)" }} />
            <Hand title="Player" cards={game.playerHand} total={playerTotal} hideHole={false} />
          </div>
        ) : (
          <div style={{ minHeight: 236, display: "grid", placeItems: "center", color: C.muted, fontWeight: 900 }}>
            The table is clear.
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
        {!canAct && (
          <button type="button" onClick={deal} disabled={activeBalance <= 0} style={primaryButton(activeBalance > 0)}>
            Deal
          </button>
        )}
        {canAct && (
          <>
            <button type="button" onClick={hit} style={primaryButton(true)}>
              Hit
            </button>
            <button type="button" onClick={stand} style={controlButton(true)}>
              Stand
            </button>
            {canDouble && (
              <button type="button" onClick={doubleDown} style={controlButton(true)}>
                Double Down
              </button>
            )}
          </>
        )}
        {activeBalance <= 0 && (
          <button type="button" onClick={resetBank} style={controlButton(true)}>
            Reset bank
          </button>
        )}
      </div>
    </section>
  );
}

function panelStyle() {
  return {
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    padding: 12,
    background: "rgba(9,19,14,.55)"
  };
}

function labelStyle() {
  return {
    color: C.gold,
    fontWeight: 900,
    letterSpacing: 1.3,
    fontSize: 12,
    marginBottom: 8
  };
}

function primaryButton(enabled) {
  return {
    border: `1px solid ${C.gold}`,
    background: enabled ? `linear-gradient(180deg, ${C.gold}, #dca33d)` : "rgba(120,120,120,.28)",
    color: enabled ? C.dark : C.muted,
    borderRadius: 8,
    padding: "10px 16px",
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
    padding: "10px 14px",
    fontWeight: 900,
    cursor: enabled ? "pointer" : "default"
  };
}
