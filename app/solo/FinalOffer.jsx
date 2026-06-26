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

const REVEAL_AMOUNT_ANIMATION = `
  @keyframes final-offer-amount-pop {
    0% { opacity: .2; transform: translate(-50%, -50%) scale(.58); }
    62% { opacity: 1; transform: translate(-50%, -50%) scale(1.14); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  @keyframes fo-bankrupt-pop {
    0% { opacity: 0; transform: scale(.4); }
    55% { opacity: 1; transform: scale(1.12); }
    100% { opacity: 1; transform: scale(1); }
  }
`;

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

function createCases(fireMode = true) {
  const sourceValues = fireMode ? VALUES : VALUES.filter((value) => value !== 0);
  const values = shuffle(sourceValues);
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

function createGame(difficulty, fireMode = true) {
  return {
    difficulty,
    fireMode,
    cases: createCases(fireMode),
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
      className="fo-case-tile"
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
      {opened && briefcase.value !== 0 && (
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "calc(100% - 12px)",
            color: C.gold,
            fontSize: "clamp(18px, 2.2vw, 27px)",
            fontWeight: 900,
            letterSpacing: 0,
            lineHeight: 1,
            textAlign: "center",
            textShadow: "0 3px 6px rgba(0,0,0,.95), 0 0 8px rgba(0,0,0,.85)",
            pointerEvents: "none",
            animation: "final-offer-amount-pop 420ms cubic-bezier(.2,.9,.2,1) both"
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

function ValueBoard({ cases, chosenCaseId, phase, offerText, message, openedCount, acceptedOffer, onAcceptOffer, onRejectOffer, values }) {
  const openedByValue = new Map(cases.filter((briefcase) => briefcase.opened).map((briefcase) => [briefcase.value, briefcase.id]));
  const chosenCase = cases.find((briefcase) => briefcase.id === chosenCaseId);
  const revealChosen = phase === "done";
  const showOfferActions = phase === "offer";
  const displayValues = values ?? VALUES;

  return (
    <div className="fo-valueboard" style={panelStyle()}>
      <div className="fo-label" style={labelStyle()}>CASE AMOUNTS</div>
      <div className="fo-vb-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 360px)", gap: 16, alignItems: "end" }}>
        <div className="fo-vb-amounts" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))", gap: 8 }}>
          {displayValues.map((value) => {
            const openedCaseId = openedByValue.get(value);
            const chosen = revealChosen && chosenCase?.value === value;
            return (
              <div
                key={value}
                className="fo-amount-tile"
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
                <span className="fo-amount-value">{money(value)}</span>
                <span className="fo-amount-state" style={{ color: openedCaseId ? C.muted : chosen ? C.cream : "#9aaa91", fontSize: 10, letterSpacing: 1.1, marginTop: 2, textDecoration: "none" }}>
                  {openedCaseId ? `CASE ${openedCaseId}` : chosen ? "YOUR CASE" : "IN PLAY"}
                </span>
              </div>
            );
          })}
        </div>
        <div
          className="fo-vb-side"
          style={{
            display: "grid",
            gap: 10,
            alignContent: "end",
            minHeight: 112,
            padding: "4px 0 0"
          }}
        >
          <div
            className="fo-banker"
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              padding: 12,
              background: "rgba(9,19,14,.55)"
            }}
          >
            <div className="fo-label" style={labelStyle()}>BANKER OFFER</div>
            <div
              className="fo-offer-value"
              style={{
                color: C.gold,
                fontWeight: 900,
                fontSize: "clamp(20px, 2.7vw, 32px)",
                lineHeight: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {offerText}
            </div>
          </div>
          <div className="fo-vb-msg" style={{ color: phase === "done" ? C.gold : C.muted, fontWeight: 900, lineHeight: 1.3, fontSize: "clamp(13px, 1.35vw, 16px)" }}>
            {message}
            {phase === "done" && chosenCase && (
              <span style={{ display: "block", color: C.cream, marginTop: 4, fontSize: 14 }}>
                Final result: {acceptedOffer ? money(acceptedOffer) : money(chosenCase.value)} after {openedCount} reveals.
              </span>
            )}
          </div>
          {showOfferActions && (
            <div className="fo-offer-actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button type="button" onClick={onAcceptOffer} style={primaryButton(true)}>
                Accept Offer
              </button>
              <button type="button" onClick={onRejectOffer} style={controlButton(true)}>
                Open Next Case
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FinalOffer() {
  const [difficulty, setDifficulty] = useState("medium");
  const [fireMode, setFireMode] = useState(true);
  const [game, setGame] = useState(null);
  const [offerText, setOfferText] = useState("Waiting");
  const activeFireMode = game?.fireMode ?? fireMode;
  const activeValues = activeFireMode ? VALUES : VALUES.filter((value) => value !== 0);

  const sealedCases = useMemo(
    () => game?.cases.filter((briefcase) => !briefcase.opened).length ?? activeValues.length,
    [game?.cases, activeValues.length]
  );
  const chosenCase = game?.cases.find((briefcase) => briefcase.id === game.chosenCaseId);
  const casesToOpen = game?.cases.filter((briefcase) => !briefcase.opened && briefcase.id !== game.chosenCaseId).length ?? activeValues.length - 1;
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
    setGame(createGame(chosenDifficulty, fireMode));
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
      className="fo-root"
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        background: "linear-gradient(180deg, rgba(31,51,32,.96), rgba(9,19,14,.78))",
        padding: "clamp(14px, 3vw, 24px)",
        boxShadow: "0 20px 48px rgba(0,0,0,.32)",
        marginTop: 24
      }}
    >
      <style>{REVEAL_AMOUNT_ANIMATION}</style>
      <style>{`
        @media (max-width: 640px) {
          .fo-root { padding: 10px !important; margin-top: 12px !important; }
          .fo-root .fo-header { gap: 8px !important; margin-bottom: 10px !important; }
          .fo-root .fo-header-img { width: 52px !important; }
          .fo-root .fo-title { font-size: 22px !important; margin: 2px 0 !important; }
          .fo-root .fo-eyebrow { font-size: 10px !important; letter-spacing: 1.2px !important; }
          .fo-root .fo-blurb { font-size: 12px !important; line-height: 1.35 !important; }
          .fo-root .fo-diff-btn { padding: 6px 9px !important; font-size: 12px !important; }
          .fo-root .fo-status-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 6px !important; margin-bottom: 10px !important; }
          .fo-root .fo-status-grid > div { padding: 6px !important; }
          .fo-root .fo-status-grid .fo-label { font-size: 9px !important; letter-spacing: .8px !important; margin-bottom: 3px !important; }
          .fo-root .fo-status-grid > div > div:last-child { font-size: 16px !important; }
          .fo-root .fo-reveal-card { padding: 10px 12px !important; margin-bottom: 10px !important; }
          .fo-root .fo-reveal-card > div:first-child { font-size: 10px !important; letter-spacing: 1.2px !important; }
          .fo-root .fo-reveal-card > div:last-child { font-size: 30px !important; }
          .fo-root .fo-valueboard { padding: 8px !important; }
          .fo-root .fo-vb-grid { grid-template-columns: 1fr !important; gap: 10px !important; align-items: stretch !important; }
          .fo-root .fo-vb-amounts { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 5px !important; }
          .fo-root .fo-amount-tile { padding: 4px 6px !important; min-height: 36px !important; }
          .fo-root .fo-amount-value { font-size: 11px !important; }
          .fo-root .fo-amount-state { font-size: 8px !important; letter-spacing: .6px !important; margin-top: 1px !important; }
          .fo-root .fo-vb-side { min-height: 0 !important; padding: 0 !important; }
          .fo-root .fo-banker { padding: 7px 9px !important; }
          .fo-root .fo-banker .fo-label { font-size: 9px !important; letter-spacing: .8px !important; margin-bottom: 2px !important; }
          .fo-root .fo-offer-value { font-size: 18px !important; }
          .fo-root .fo-vb-msg { font-size: 11px !important; line-height: 1.3 !important; }
          .fo-root .fo-offer-actions button { padding: 7px 9px !important; font-size: 12px !important; }
          .fo-root .fo-case-frame { padding: 7px !important; overflow-x: hidden !important; }
          .fo-root .fo-case-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 6px !important; min-width: 0 !important; }
          .fo-root .fo-case-tile { min-height: 92px !important; padding: 4px !important; }
          .fo-root .fo-case-tile img { max-height: 74px !important; }
          .fo-root .fo-case-tile span:last-child { font-size: 8px !important; letter-spacing: .6px !important; }
        }
      `}</style>
      <div className="fo-header" style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", maxWidth: 860 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="fo-header-img"
            src="/final_offer/final-offer.png"
            alt=""
            aria-hidden="true"
            style={{ width: "clamp(64px, 10vw, 104px)", height: "auto", borderRadius: 8, filter: "drop-shadow(0 12px 22px rgba(0,0,0,.42))", flex: "0 0 auto" }}
          />
          <div>
          <div className="fo-eyebrow" style={{ color: C.gold, fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>PLAYABLE SOLO CASE</div>
          <h2 className="fo-title" style={{ margin: "6px 0", color: C.cream, fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1 }}>
            Final Offer
          </h2>
          <p className="fo-blurb" style={{ color: C.muted, margin: 0, maxWidth: 680, lineHeight: 1.5 }}>
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
              className="fo-diff-btn"
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => canPickDifficulty && setFireMode((v) => !v)}
            disabled={!canPickDifficulty}
            title={fireMode ? "Fire Mode on — Bankrupt case in play" : "Fire Mode off — no Bankrupt case"}
            className="fo-diff-btn"
            style={{
              border: `1px solid ${fireMode ? "#cf4f45" : C.line}`,
              background: fireMode ? "linear-gradient(180deg, rgba(207,79,69,.34), rgba(109,23,29,.46))" : "rgba(9,19,14,.5)",
              color: fireMode ? "#ffd5cf" : C.cream,
              borderRadius: 8,
              padding: "10px 12px",
              fontWeight: 900,
              cursor: canPickDifficulty ? "pointer" : "default"
            }}
          >
            🔥 Fire {fireMode ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={() => start(difficulty)}
            className="fo-diff-btn"
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

      <div className="fo-status-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginBottom: 16 }}>
        <div style={panelStyle()}>
          <div className="fo-label" style={labelStyle()}>CASES TO OPEN</div>
          <div style={{ color: C.cream, fontWeight: 900, fontSize: 24 }}>{game?.chosenCaseId ? casesToOpen : VALUES.length - 1}</div>
        </div>
        <div style={panelStyle()}>
          <div className="fo-label" style={labelStyle()}>SEALED TOTAL</div>
          <div style={{ color: C.cream, fontWeight: 900, fontSize: 24 }}>{sealedCases}</div>
        </div>
        <div style={panelStyle()}>
          <div className="fo-label" style={labelStyle()}>YOUR CASE</div>
          <div style={{ color: chosenCase ? C.gold : C.cream, fontWeight: 900, fontSize: 24 }}>
            {chosenCase ? `#${chosenCase.id}` : "None"}
          </div>
        </div>
      </div>

      {lastOpenedCase && lastOpenedCase.value !== 0 && (
        <div
          className="fo-reveal-card"
          style={{
            border: `2px solid ${C.gold}`,
            borderRadius: 8,
            padding: "16px 18px",
            marginBottom: 16,
            background: "rgba(255,193,94,.13)",
            textAlign: "center",
            boxShadow: "0 18px 36px rgba(0,0,0,.28)"
          }}
        >
          <div style={{ color: C.muted, fontSize: 12, fontWeight: 900, letterSpacing: 1.8 }}>REVEALED CASE {lastOpenedCase.id}</div>
          <div
            style={{
              color: C.gold,
              fontSize: "clamp(34px, 8vw, 72px)",
              fontWeight: 900,
              lineHeight: 1
            }}
          >
            {money(lastOpenedCase.value)}
          </div>
        </div>
      )}

      {game && (
        <div style={{ marginBottom: 16 }}>
          <ValueBoard
            cases={game.cases}
            chosenCaseId={game.chosenCaseId}
            phase={game.phase}
            offerText={game?.offer && game.phase === "offer" ? offerText : "Waiting"}
            message={game.message}
            openedCount={openedCount}
            acceptedOffer={game.acceptedOffer}
            onAcceptOffer={acceptOffer}
            onRejectOffer={rejectOffer}
            values={activeValues}
          />
        </div>
      )}

      <div
        className="fo-case-frame"
        style={{
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          padding: 14,
          overflowX: "auto",
          background:
            "radial-gradient(circle at 50% 25%, rgba(255,193,94,.12), transparent 34%), linear-gradient(180deg, rgba(47,86,50,.72), rgba(9,19,14,.82))",
          marginBottom: 16,
          position: "relative"
        }}
      >
        <div className="fo-case-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(150px, 1fr))", gap: 14, minWidth: 960 }}>
          {(game?.cases ?? Array.from({ length: activeValues.length }, (_, index) => ({ id: index + 1, value: 0, opened: false }))).map((briefcase) => {
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
        {lastOpenedCase && lastOpenedCase.value === 0 && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
              zIndex: 10,
              overflow: "hidden",
              animation: "fo-bankrupt-pop 720ms cubic-bezier(.22,1.18,.36,1) both"
            }}
          >
            <div
              style={{
                transform: "rotate(-20deg)",
                color: "#ffd5cf",
                fontSize: "clamp(64px, 14vw, 168px)",
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "clamp(4px, 1.2vw, 14px)",
                whiteSpace: "nowrap",
                padding: "10px 28px",
                background: "linear-gradient(180deg, rgba(123,28,34,.92), rgba(54,16,21,.92))",
                border: "3px solid #ffd5cf",
                borderRadius: 14,
                boxShadow: "0 0 0 4px rgba(123,28,34,.32), 0 28px 60px rgba(0,0,0,.78), 0 0 40px rgba(207,79,69,.4)",
                textShadow: "0 5px 0 rgba(0,0,0,.85), 0 12px 22px rgba(0,0,0,.95)",
                WebkitTextStroke: "2px #4b1015"
              }}
            >
              BANKRUPT
            </div>
          </div>
        )}
      </div>

      {!game && (
        <div style={{ color: C.muted, fontWeight: 900, lineHeight: 1.45 }}>
          Start a game, then choose one case to keep unopened.
        </div>
      )}
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
