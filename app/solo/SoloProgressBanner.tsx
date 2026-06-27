"use client";

import { useEffect, useState } from "react";

const SLUGS = [
  "alibis-informants",
  "three-marks-monte",
  "hoodwink-or-dice",
  "the-house-always-lies",
  "final-offer",
  "the-sweep",
  "cipher-sweep",
  "alibi-grid",
  "vault-runner",
  "case-file-blitz",
  "the-lookout",
  "stakeout"
];

const PREFIX = "hoodwinked.solo.";
const TOTAL = SLUGS.length;

const C = {
  cream: "#fbf3e4",
  muted: "#d9d2bd",
  gold: "#ffc15e",
  line: "#81a475"
};

type Aggregate = {
  played: number;
  bestStreak: number;
  hydrated: boolean;
};

function streakFromRecord(value: unknown): number {
  if (!value || typeof value !== "object") return 0;
  let best = 0;
  for (const child of Object.values(value as Record<string, unknown>)) {
    if (typeof child === "number") {
      best = Math.max(best, child);
    } else if (child && typeof child === "object") {
      best = Math.max(best, streakFromRecord(child));
    }
  }
  return best;
}

function readAggregate(): Aggregate {
  if (typeof window === "undefined") return { played: 0, bestStreak: 0, hydrated: false };
  let played = 0;
  let bestStreak = 0;
  try {
    for (const slug of SLUGS) {
      const raw = window.localStorage.getItem(PREFIX + slug);
      if (!raw) continue;
      played += 1;
      try {
        const parsed = JSON.parse(raw);
        const streakKeys = ["bestStreak", "best_streak", "streak"];
        let pickedStreak = 0;
        if (parsed && typeof parsed === "object") {
          for (const key of streakKeys) {
            const value = (parsed as Record<string, unknown>)[key];
            if (typeof value === "number") pickedStreak = Math.max(pickedStreak, value);
          }
          if (pickedStreak === 0) pickedStreak = streakFromRecord(parsed);
        }
        bestStreak = Math.max(bestStreak, pickedStreak);
      } catch {
        // malformed — count it as played, no streak info
      }
    }
  } catch {
    // localStorage unavailable — return defaults
  }
  return { played, bestStreak, hydrated: true };
}

export default function SoloProgressBanner() {
  const [agg, setAgg] = useState<Aggregate>({ played: 0, bestStreak: 0, hydrated: false });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAgg(readAggregate());
  }, []);

  if (!agg.hydrated || agg.played === 0) return null;

  const pct = Math.round((agg.played / TOTAL) * 100);

  return (
    <div
      style={{
        border: `1px solid ${C.line}`,
        background: "linear-gradient(180deg, rgba(31,51,32,.66), rgba(9,19,14,.62))",
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 18,
        display: "flex",
        gap: 14,
        flexWrap: "wrap",
        alignItems: "center",
        boxShadow: "0 8px 18px rgba(0,0,0,.24)"
      }}
    >
      <div style={{ minWidth: 130, flex: "1 1 130px" }}>
        <div style={{ color: C.gold, fontSize: 10, fontWeight: 900, letterSpacing: 1.4 }}>CASES TRIED</div>
        <div style={{ color: C.cream, fontSize: 18, fontWeight: 900, lineHeight: 1.1, marginTop: 3 }}>
          {agg.played} <span style={{ color: C.muted, fontWeight: 800, fontSize: 13 }}>/ {TOTAL}</span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: "rgba(9,19,14,.6)", overflow: "hidden", marginTop: 6 }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${C.gold}, #dca33d)`,
              boxShadow: `0 0 8px ${C.gold}66`
            }}
          />
        </div>
      </div>
      {agg.bestStreak > 0 && (
        <div style={{ minWidth: 130, flex: "1 1 130px" }}>
          <div style={{ color: C.gold, fontSize: 10, fontWeight: 900, letterSpacing: 1.4 }}>BEST STREAK</div>
          <div style={{ color: C.cream, fontSize: 18, fontWeight: 900, lineHeight: 1.1, marginTop: 3 }}>
            {agg.bestStreak}
            <span style={{ color: C.muted, fontWeight: 800, fontSize: 13, marginLeft: 6 }}>across all cases</span>
          </div>
        </div>
      )}
    </div>
  );
}
