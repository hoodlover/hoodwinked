"use client";

import { useEffect, useState } from "react";

const PREFIX = "hoodwinked.solo.";

type Raw = Record<string, unknown> | null;

function readRaw(slug: string): Raw {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + slug);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Raw) : null;
  } catch {
    return null;
  }
}

function pickNumber(obj: Raw, ...keys: string[]): number {
  if (!obj) return 0;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

function bestStreakAcrossDifficulties(obj: Raw): number {
  if (!obj) return 0;
  let best = pickNumber(obj, "bestStreak");
  for (const diff of ["easy", "medium", "hard"]) {
    const child = obj[diff];
    if (child && typeof child === "object") {
      const childBest = pickNumber(child as Raw, "bestStreak");
      if (childBest > best) best = childBest;
    }
  }
  return best;
}

function bestScoreAcrossDifficulties(obj: Raw): number {
  if (!obj) return 0;
  let best = 0;
  for (const diff of ["easy", "medium", "hard"]) {
    const value = obj[diff];
    if (typeof value === "number" && value > best) best = value;
  }
  return best;
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`;
  return `$${n}`;
}

function summarize(slug: string, data: Raw): { label: string; value: string } | null {
  if (!data) return null;
  switch (slug) {
    case "the-sweep":
    case "three-marks-monte":
    case "hoodwink-or-dice":
    case "alibis-informants": {
      const streak = bestStreakAcrossDifficulties(data);
      if (streak <= 0) return null;
      return { label: "Best streak", value: String(streak) };
    }
    case "the-house-always-lies": {
      const peak = pickNumber(data, "peakBalance", "balance");
      if (peak <= 0) return null;
      return { label: "Peak", value: formatMoney(peak) };
    }
    case "final-offer": {
      const biggest = pickNumber(data, "biggest");
      if (biggest <= 0) return null;
      return { label: "Best take", value: formatMoney(biggest) };
    }
    case "cipher-sweep":
    case "vault-runner":
    case "case-file-blitz":
    case "the-lookout":
    case "stakeout":
    case "alibi-grid": {
      const score = bestScoreAcrossDifficulties(data);
      const streak = pickNumber(data, "bestStreak");
      const mostCorrect = pickNumber(data, "mostCorrect");
      if (score > 0) return { label: "Best score", value: String(score) };
      if (streak > 0) return { label: "Best streak", value: String(streak) };
      if (mostCorrect > 0) return { label: "Most correct", value: String(mostCorrect) };
      return null;
    }
    default:
      return null;
  }
}

export default function SoloCardBadge({ slug }: { slug: string }) {
  const [summary, setSummary] = useState<{ label: string; value: string } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSummary(summarize(slug, readRaw(slug)));
  }, [slug]);

  if (!summary) return null;
  return (
    <div
      style={{
        marginTop: 6,
        display: "inline-flex",
        alignItems: "baseline",
        gap: 6,
        padding: "3px 8px",
        borderRadius: 999,
        border: "1px solid rgba(255,193,94,.42)",
        background: "rgba(255,193,94,.10)",
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 1,
        color: "#ffc15e",
        alignSelf: "flex-start"
      }}
    >
      <span style={{ color: "#d9d2bd", textTransform: "uppercase", letterSpacing: 1.2 }}>{summary.label}</span>
      <span>{summary.value}</span>
    </div>
  );
}
