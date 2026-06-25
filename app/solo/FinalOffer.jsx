"use client";

import { useEffect, useMemo, useState } from "react";

const VALUES = [0, 100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 75000, 100000, 150000, 250000, 400000, 500000, 750000, 1000000, 2000000];

const DIFFICULTIES = {
  easy: { label: "Easy", min: 0.78, max: 0.95 },
  medium: { label: "Medium", min: 0.5, max: 0.7 },
  hard: { label: "Hard", min: 0.28, max: 0.48 }
};

const C = {
  dark: "#09130e",
  cream: "#fbf3e4",
  muted: "#d9d2bd",
  gold: "#ffc15e",
  line: "#81a475",
  panel: "#1f3320",
  hit: "#cf4f45",
  blue: "#6fb6d8",
  green: "#6fb071"
};

function money(value) {
  if (value === 0) return "BANKRUPT";
  return `$${value.toLocaleString()}`;
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createCases() {
  const values = shuffle(VALUES);
  return values.map((value, index) => ({
    id: index + 1,
    value,
    opened: false
  }));
}

function calculateOffer(cases, chosenCaseId, difficulty) {
  const unopenedValues = cases
    .filter((briefcase) => !briefcase.opened)
    .map((briefcase) => briefcase.value);
  const average = unopenedValues.reduce((sum, value) => sum + value, 0) / unopenedValues.length;
  const settings = DIFFICULTIES[difficulty];
  const openedCount = cases.filter((briefcase) => briefcase.opened).length;
  const pressure = 1 + openedCount * (0.34 / Math.max(1, cases.length - 1));
  const multiplier = settings.min + Math.random() * (settings.max - settings.min);
  const chosenValue = cases.find((briefcase) => briefcase.id === chosenCaseId)?.value ?? average;
  const riskTilt = chosenValue > average ? 0.92 : 1.04;

  return Math.max(1, Math.round((average * multiplier * pressure * riskTilt) / 100) * 100);
}

function createGame(difficulty) {
  return {
    difficulty,
    cases: createCases(),
    chosenCaseId: null,
    phase: "choose",
    offer: null,
    acceptedOffer: null,
    lastOpenedId: null,
    message: "Choose the briefcase you want to keep."
  };
}

function CaseTile({ briefcase, chosen, canOpen, justOpened, onClick }) {
  const opened = briefcase.opened;
  const sealedImage = `/final_offer/${String(briefcase.id).padStart(2, "0")}-briefcase.webp`;
  const image = opened
    ? briefcase.value === 0
      ? "/final_offer/bankruptcy.webp"
      : "/final_offer/briefcase_opened.webp"
    : sealedImage;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canOpen}
      aria-label={`Briefcase ${briefcase.id}${opened ? ` opened with ${money(briefcase.value)}` : ""}`}
      style={{
        minHeight: 160,
        borderRadius: 8,
        border: chosen ? `2px solid ${C.gold}` : opened ? `1px solid ${C.gold}` : `1px solid ${C.line}`,
        background: chosen
          ? "radial-gradient(circle at 50% 30%, rgba(255,193,94,.22), rgba(9,19,14,.82))"
          : opened
            ? "linear-gradient(180deg, rgba(9,19,14,.7), rgba(31,51,32,.84))"
            : "linear-gradient(180deg, rgba(50,89,54,.52), rgba(9,19,14,.64))",
        color: opened ? C.gold : C.cream,
        cursor: canOpen ? "pointer" : "default",
        padding: 8,
        display: "grid",
        alignContent: "center",
        justifyItems: "center",
        gap: 4,
        boxShadow: chosen
          ? "0 0 0 3px rgba(255,193,94,.15), 0 14px 28px rgba(0,0,0,.3)"
          : justOpened
            ? "0 0 0 4px rgba(255,193,94,.18), 0 16px 32px rgba(0,0,0,.36)"
            : "0 12px 24px rgba(0,0,0,.24)",
        transform: justOpened ? "translateY(-5px) scale(1.02)" : "none",
        transition: "transform 220ms ease, box-shadow 220ms ease, background 220ms ease",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        aria-hidden="true"
        style={{
          width: "min(100%, 188px)",
          height: "auto",
          maxHeight: 132,
          objectFit: "contain",
          filter: opened ? "drop-shadow(0 12px 18px rgba(0,0,0,.3))" : "drop-shadow(0 10px 16px rgba(0,0,0,.34))"
        }}
      />
      {opened && (
        <span
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            top: "50%",
            transform: "translateY(-18%)",
            color: briefcase.value === 0 ? "#ffd2ce" : C.gold,
            fontSize: briefcase.value === 0 ? 12 : 13,
            fontWeight: 900,
            letterSpacing: briefcase.value === 0 ? 1 : 0,
            textShadow: "0 2px 4px rgba(0,0,0,.9)",
            pointerEvents: "none"
          }}
        >
          {money(briefcase.value)}
        </span>
      )}
      <span style={{ color: chosen ? C.gold : opened ? C.muted : "#b9c7b1", fontSize: 10, fontWeight: 900, letterSpacing: 1.1 }}>
        {chosen ? "YOUR CASE" : opened ? "OPENED" : "SEALED"}
      </span>
    </button>
  );
}

function ValueBoard({ cases, chosenCaseId, phase }) {
  const openedByValue = new Map(cases.filter((briefcase) => briefcase.opened).map((briefcase) => [briefcase.value, briefcase.id]));
  const chosenCase = cases.find((briefcase) => briefcase.id === chosenCaseId);
  const revealChosen = phase === "done";

  return (
    <div style={panelStyle()}>
      <div style={labelStyle()}>CASE AMOUNTS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))", gap: 8 }}>
        {VALUES.map((value) => {
          const openedCaseId = openedByValue.get(value);
          const chosen = revealChosen && chosenCase?.value === value;
          return (
            <div
              key={value}
              style={{
                border: `1px solid ${openedCaseId || chosen ? C.gold : "rgba(129,164,117,.5)"}`,
                borderRadius: 8,
                padding: "8px 10px",
                background: openedCaseId
                  ? "rgba(9,19,14,.78)"
                  : chosen
                    ? "rgba(255,193,94,.2)"
                    : "rgba(47,86,50,.32)",
                color: openedCaseId ? C.muted : C.gold,
                fontWeight: 900,
                minHeight: 52,
                display: "grid",
                alignContent: "center",
                textDecoration: openedCaseId ? "line-through" : "none"
              }}
            >
              <span>{money(value)}</span>
              <span style={{ color: openedCaseId ? C.muted : chosen ? C.cream : "#9aaa91", fontSize: 10, letterSpacing: 1.1, marginTop: 2, textDecoration: "none" }}>
                {openedCaseId ? `CASE ${openedCaseId}` : chosen ? "YOUR CASE" : "IN PLAY"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FinalOffer() {
  const [difficulty, setDifficulty] = useState("medium");
  const [game, setGame] = useState(null);
  const [offerText, setOfferText] = useState("Waiting");

  const sealedCases = useMemo(
    () => game?.cases.filter((briefcase) => !briefcase.opened).length ?? VALUES.length,
    [game?.cases]
  );
  const chosenCase = game?.cases.find((briefcase) => briefcase.id === game.chosenCaseId);
  const casesToOpen = game?.cases.filter((briefcase) => !briefcase.opened && briefcase.id !== game.chosenCaseId).length ?? VALUES.length - 1;
  const openedCount = game?.cases.filter((briefcase) => briefcase.opened).length ?? 0;
  const lastOpenedCase = game?.cases.find((briefcase) => briefcase.id === game.lastOpenedId);

  useEffect(() => {
    if (!game?.offer || game.phase !== "offer") {
      return undefined;
    }

    const full = money(game.offer);
    const timers = [
      window.setTimeout(() => setOfferText("The Banker offers..."), 0),
      window.setTimeout(() => setOfferText(full.slice(0, 1)), 650)
    ];
    for (let i = 1; i < full.length; i += 1) {
      timers.push(window.setTimeout(() => setOfferText(full.slice(0, i + 1)), 650 + i * 90));
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [game?.offer, game?.phase]);

  const start = (chosenDifficulty = difficulty) => {
    setDifficulty(chosenDifficulty);
    setGame(createGame(chosenDifficulty));
  };

  const chooseCase = (caseId) => {
    setGame((current) => {
      if (!current || current.phase !== "choose") return current;
      const offer = calculateOffer(current.cases, caseId, current.difficulty);
      return {
        ...current,
        chosenCaseId: caseId,
        phase: "offer",
        offer,
        message: `Case ${caseId} is yours. The Banker is already circling.`
      };
    });
  };

  const openCase = (caseId) => {
    setGame((current) => {
      if (!current || current.phase !== "opening" || caseId === current.chosenCaseId) return current;
      const target = current.cases.find((briefcase) => briefcase.id === caseId);
      if (!target || target.opened) return current;

      const cases = current.cases.map((briefcase) =>
        briefcase.id === caseId ? { ...briefcase, opened: true } : briefcase
      );
      if (target.value === 0) {
        return {
          ...current,
          cases,
          phase: "done",
          offer: null,
          acceptedOffer: 0,
          lastOpenedId: caseId,
          message: `Case ${caseId} was the Bankrupt box. The Banker takes the file and the deal is dead.`
        };
      }
      const unopenedOtherCases = cases.filter((briefcase) => !briefcase.opened && briefcase.id !== current.chosenCaseId);

      if (unopenedOtherCases.length === 0) {
        const finalCase = cases.find((briefcase) => briefcase.id === current.chosenCaseId);
        const highFinish = finalCase.value >= 50000;
        return {
          ...current,
          cases,
          phase: "done",
          offer: null,
          lastOpenedId: caseId,
          message: highFinish
            ? `Final case revealed: ${money(finalCase.value)}. You beat the Banker.`
            : `Final case revealed: ${money(finalCase.value)}. The Banker wore you down.`
        };
      }

      const offer = calculateOffer(cases, current.chosenCaseId, current.difficulty);
      return {
        ...current,
        cases,
        phase: "offer",
        offer,
        lastOpenedId: caseId,
        message: `Opened case ${caseId}: ${money(target.value)}.`
      };
    });
  };

  const rejectOffer = () => {
    setGame((current) => {
      if (!current || current.phase !== "offer") return current;
      return {
        ...current,
        phase: "opening",
        message: "No deal. Open one case."
      };
    });
  };

  const acceptOffer = () => {
    setGame((current) => {
      if (!current || current.phase !== "offer") return current;
      const chosen = current.cases.find((briefcase) => briefcase.id === current.chosenCaseId);
      const goodDeal = current.offer >= chosen.value;
      return {
        ...current,
        phase: "done",
        acceptedOffer: current.offer,
        message: goodDeal
          ? `Deal accepted for ${money(current.offer)}. Your case had ${money(chosen.value)}.`
          : `Deal accepted for ${money(current.offer)}. Your case was worth ${money(chosen.value)}.`
      };
    });
  };

  const canPickDifficulty = !game || game.phase === "done";

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
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", maxWidth: 860 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/final_offer/final-offer.png"
            alt=""
            aria-hidden="true"
            style={{ width: "clamp(64px, 10vw, 104px)", height: "auto", borderRadius: 8, filter: "drop-shadow(0 12px 22px rgba(0,0,0,.42))", flex: "0 0 auto" }}
          />
          <div>
          <div style={{ color: C.gold, fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>PLAYABLE SOLO CASE</div>
          <h2 style={{ margin: "6px 0", color: C.cream, fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1 }}>
            Final Offer
          </h2>
          <p style={{ color: C.muted, margin: 0, maxWidth: 680, lineHeight: 1.5 }}>
            A crooked evidence auction is underway in the basement of the county lockup. Eighteen cases hold cash, leverage, and one Bankrupt bomb that can wipe out the whole play. Keep your case sealed, expose the decoys, and decide whether the Banker is buying your nerve too cheaply.
          </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {Object.entries(DIFFICULTIES).map(([value, item]) => (
            <button
              key={value}
              type="button"
              onClick={() => canPickDifficulty && setDifficulty(value)}
              disabled={!canPickDifficulty}
              style={{
                border: `1px solid ${difficulty === value ? C.gold : C.line}`,
                background: difficulty === value ? `${C.gold}22` : "rgba(9,19,14,.5)",
                color: difficulty === value ? C.gold : C.cream,
                borderRadius: 8,
                padding: "10px 12px",
                fontWeight: 900,
                cursor: canPickDifficulty ? "pointer" : "default"
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => start(difficulty)}
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
            {game ? "New game" : "Start game"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginBottom: 16 }}>
        <div style={panelStyle()}>
          <div style={labelStyle()}>BANKER OFFER</div>
          <div style={{ color: C.gold, fontWeight: 900, fontSize: "clamp(24px, 5vw, 38px)", lineHeight: 1 }}>
            {game?.offer && game.phase === "offer" ? offerText : "Waiting"}
          </div>
        </div>
        <div style={panelStyle()}>
          <div style={labelStyle()}>CASES TO OPEN</div>
          <div style={{ color: C.cream, fontWeight: 900, fontSize: 24 }}>{game?.chosenCaseId ? casesToOpen : VALUES.length - 1}</div>
        </div>
        <div style={panelStyle()}>
          <div style={labelStyle()}>SEALED TOTAL</div>
          <div style={{ color: C.cream, fontWeight: 900, fontSize: 24 }}>{sealedCases}</div>
        </div>
        <div style={panelStyle()}>
          <div style={labelStyle()}>YOUR CASE</div>
          <div style={{ color: chosenCase ? C.gold : C.cream, fontWeight: 900, fontSize: 24 }}>
            {chosenCase ? `#${chosenCase.id}` : "None"}
          </div>
        </div>
      </div>

      {lastOpenedCase && (
        <div
          style={{
            border: `2px solid ${lastOpenedCase.value === 0 ? C.hit : C.gold}`,
            borderRadius: 8,
            padding: "16px 18px",
            marginBottom: 16,
            background: lastOpenedCase.value === 0 ? "rgba(207,79,69,.18)" : "rgba(255,193,94,.13)",
            textAlign: "center",
            boxShadow: "0 18px 36px rgba(0,0,0,.28)"
          }}
        >
          <div style={{ color: C.muted, fontSize: 12, fontWeight: 900, letterSpacing: 1.8 }}>REVEALED CASE {lastOpenedCase.id}</div>
          <div style={{ color: lastOpenedCase.value === 0 ? "#ffd2ce" : C.gold, fontSize: "clamp(34px, 8vw, 72px)", fontWeight: 900, lineHeight: 1 }}>
            {money(lastOpenedCase.value)}
          </div>
        </div>
      )}

      {game && <div style={{ marginBottom: 16 }}><ValueBoard cases={game.cases} chosenCaseId={game.chosenCaseId} phase={game.phase} /></div>}

      <div
        style={{
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          padding: 14,
          overflowX: "auto",
          background:
            "radial-gradient(circle at 50% 25%, rgba(255,193,94,.12), transparent 34%), linear-gradient(180deg, rgba(47,86,50,.72), rgba(9,19,14,.82))",
          marginBottom: 16
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(150px, 1fr))", gap: 14, minWidth: 960 }}>
          {(game?.cases ?? Array.from({ length: VALUES.length }, (_, index) => ({ id: index + 1, value: 0, opened: false }))).map((briefcase) => {
            const chosen = briefcase.id === game?.chosenCaseId;
            const canOpen = game?.phase === "choose" || (game?.phase === "opening" && !chosen && !briefcase.opened);
            const onClick = game?.phase === "choose" ? () => chooseCase(briefcase.id) : () => openCase(briefcase.id);
            return (
              <CaseTile
                key={briefcase.id}
                briefcase={briefcase}
                chosen={chosen}
                canOpen={!!canOpen}
                justOpened={game?.lastOpenedId === briefcase.id}
                onClick={onClick}
              />
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) auto", gap: 12, alignItems: "center" }}>
        <div style={{ color: game?.phase === "done" ? C.gold : C.muted, fontWeight: 900, lineHeight: 1.45 }}>
          {game?.message ?? "Start a game, then choose one case to keep unopened."}
          {game?.phase === "done" && chosenCase && (
            <span style={{ display: "block", color: C.cream, marginTop: 4 }}>
              Final result: {game.acceptedOffer ? money(game.acceptedOffer) : money(chosenCase.value)} after {openedCount} reveals.
            </span>
          )}
        </div>
        {game?.phase === "offer" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button type="button" onClick={acceptOffer} style={primaryButton(true)}>
              Accept Offer
            </button>
            <button type="button" onClick={rejectOffer} style={controlButton(true)}>
              Open Next Case
            </button>
          </div>
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
