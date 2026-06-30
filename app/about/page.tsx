"use client";

import Link from "next/link";
import { useState } from "react";

const C = {
  cream: "#fbf3e4",
  creamDim: "#d9d2bd",
  gold: "#ffc15e",
  goldDim: "#c9923c",
  line: "#81a475",
  muted: "#b9c7b1",
  coral: "#cf4f45"
};

// Surfaced from package.json via next.config.ts -> env.NEXT_PUBLIC_APP_VERSION.
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

const FIXED_KEYS = ["parlor:names", "parlor:avatars", "parlor:muted", "parlor:deviceId", "parlor:custom-content-library", "parlor:active-custom-content-deck", "parlor:content-source"];
const KEY_PREFIXES = ["hoodwinked:host:", "hoodwinked.solo.", "parlor:content-bag:"];

function clearLocalData(): number {
  if (typeof window === "undefined") return 0;
  let removed = 0;
  try {
    for (const key of FIXED_KEYS) {
      if (window.localStorage.getItem(key) != null) {
        window.localStorage.removeItem(key);
        removed += 1;
      }
    }
    const matching: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        matching.push(key);
      }
    }
    for (const key of matching) {
      window.localStorage.removeItem(key);
      removed += 1;
    }
  } catch {
    // localStorage unavailable — nothing to do
  }
  return removed;
}

export default function AboutPage() {
  const [clearState, setClearState] = useState<{ phase: "idle" | "confirm" | "done"; removed: number }>({
    phase: "idle",
    removed: 0
  });

  const onClearClick = () => {
    if (clearState.phase === "idle") {
      setClearState({ phase: "confirm", removed: 0 });
      return;
    }
    if (clearState.phase === "confirm") {
      const removed = clearLocalData();
      setClearState({ phase: "done", removed });
    }
  };

  const onCancelClear = () => setClearState({ phase: "idle", removed: 0 });

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% 0%, rgba(255,193,94,.14), transparent 34%), linear-gradient(180deg, #254426 0%, #132019 100%)",
        color: C.cream,
        padding: "20px clamp(12px, 3vw, 34px) 64px",
        fontFamily: "Inter, system-ui, sans-serif",
        lineHeight: 1.55
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <Link href="/" aria-label="Back to Hoodwinked" style={{ display: "inline-flex", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.42))" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/backtomain.png?v=2"
              alt="Back to Hoodwinked"
              width={386}
              height={54}
              style={{ height: "clamp(20px, 4vw, 26px)", width: "auto", display: "block" }}
            />
          </Link>
          <Link href="/privacy" style={{ color: C.gold, textDecoration: "none", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>
            Privacy →
          </Link>
        </nav>

        <header style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hwlogo.png"
            alt="Hoodwinked"
            width={140}
            height={140}
            style={{ width: "clamp(72px, 16vw, 110px)", height: "auto", filter: "drop-shadow(0 12px 22px rgba(0,0,0,.42))", flex: "0 0 auto" }}
          />
          <div>
            <h1 style={{ margin: 0, color: C.gold, fontSize: "clamp(28px, 6vw, 48px)", lineHeight: 1, letterSpacing: 1 }}>
              Hoodwinked
            </h1>
            <p style={{ margin: "6px 0 4px", color: C.muted, fontWeight: 800, letterSpacing: 1.4, fontSize: 12, textTransform: "uppercase" }}>
              Fool the room. Win the night.
            </p>
            <p style={{ margin: 0, color: C.creamDim, fontSize: 13, fontWeight: 800, letterSpacing: 1.2 }}>
              Version {APP_VERSION}
            </p>
          </div>
        </header>

        <Section title="What's inside">
          <p>
            Hoodwinked is a party game for phones and laptops. The host opens a room on a big screen, players join from their own devices, and the room scores everyone&apos;s answers in real time.
          </p>
          <Bullets
            items={[
              "6 party modes: The Setup, Two-Faced, The Score, Now You See Me, Letter Heist, The Usual Suspects",
              "12 solo cases you can play on a single device — no room, no internet required"
            ]}
          />
        </Section>

        <Section title="How to play">
          <Bullets
            items={[
              "Solo: tap Open Solo Cases on the home screen and pick one of the twelve cases.",
              "With friends: the host taps Host a room, shares the 5-letter room code, and everyone else enters it at playhoodwinked.com from their own device."
            ]}
          />
          <p style={{ marginTop: 10 }}>
            <Link href="/?welcome=1" style={{ color: C.gold }}>
              Show the welcome tour again →
            </Link>
          </p>
        </Section>

        <Section title="Privacy and your data">
          <p>
            Hoodwinked keeps your name, avatar, mute preference, and solo scores on your own device using your browser&apos;s localStorage. We do not run ad tracking or sell your data. For the full breakdown of what gets stored and shared, see the{" "}
            <Link href="/privacy" style={{ color: C.gold }}>Privacy Policy</Link>.
          </p>

          <div
            style={{
              marginTop: 14,
              border: `1px solid ${clearState.phase === "confirm" ? C.coral : C.line}`,
              borderRadius: 10,
              padding: 14,
              background: "rgba(9,19,14,.55)"
            }}
          >
            <div style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.2, fontSize: 12, textTransform: "uppercase", marginBottom: 6 }}>
              Clear my data
            </div>
            {clearState.phase === "idle" && (
              <>
                <p style={{ margin: "0 0 10px", color: C.creamDim, fontSize: 13 }}>
                  Wipe the saved name, avatar, mute preference, solo scores, and host tokens stored on this device. This does not affect other devices or other players.
                </p>
                <button
                  type="button"
                  onClick={onClearClick}
                  style={{
                    border: `1px solid ${C.coral}`,
                    background: "rgba(207,79,69,.18)",
                    color: "#ffd2ce",
                    borderRadius: 8,
                    padding: "9px 14px",
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: "pointer"
                  }}
                >
                  Clear my data
                </button>
              </>
            )}
            {clearState.phase === "confirm" && (
              <>
                <p style={{ margin: "0 0 10px", color: "#ffd2ce", fontSize: 13, fontWeight: 800 }}>
                  Are you sure? This cannot be undone.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={onClearClick}
                    style={{
                      border: `1px solid ${C.coral}`,
                      background: `linear-gradient(180deg, ${C.coral}, #8d211c)`,
                      color: C.cream,
                      borderRadius: 8,
                      padding: "9px 14px",
                      fontWeight: 900,
                      fontSize: 13,
                      cursor: "pointer"
                    }}
                  >
                    Yes, clear it
                  </button>
                  <button
                    type="button"
                    onClick={onCancelClear}
                    style={{
                      border: `1px solid ${C.line}`,
                      background: "rgba(9,19,14,.5)",
                      color: C.cream,
                      borderRadius: 8,
                      padding: "9px 14px",
                      fontWeight: 900,
                      fontSize: 13,
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            {clearState.phase === "done" && (
              <p style={{ margin: 0, color: C.gold, fontWeight: 900, fontSize: 13 }}>
                Done — {clearState.removed} item{clearState.removed === 1 ? "" : "s"} removed from this device.
              </p>
            )}
          </div>
        </Section>

        <Section title="Contact">
          <p>
            Bug reports, feature requests, account questions, or just to say hi:{" "}
            <a href="mailto:lance@playhoodwinked.com" style={{ color: C.gold }}>
              lance@playhoodwinked.com
            </a>
          </p>
        </Section>

        <div style={{ color: C.line, fontSize: 11, fontWeight: 800, letterSpacing: 1.6, marginTop: 36, textAlign: "center" }}>
          <Link href="/privacy" style={{ color: C.line, textDecoration: "none", borderBottom: `1px dotted ${C.line}` }}>
            Privacy Policy
          </Link>
          <span style={{ margin: "0 10px" }}>·</span>
          v{APP_VERSION}
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <h2 style={{ margin: "0 0 8px", color: C.gold, fontSize: 18, letterSpacing: 1.1, textTransform: "uppercase", fontWeight: 900 }}>
        {title}
      </h2>
      <div style={{ color: C.creamDim, fontSize: 14.5 }}>{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "8px 0 0", paddingLeft: 22 }}>
      {items.map((item, index) => (
        <li key={index} style={{ marginBottom: 6 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}
