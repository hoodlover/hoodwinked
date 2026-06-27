"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "parlor:seenIntro";
const STORAGE_VERSION = "1";

const C = {
  bg: "#1f3320",
  bgDeep: "#13201a",
  surface: "#2d4a2d",
  cream: "#fbf3e4",
  creamDim: "#d9d2bd",
  muted: "#b9c7b1",
  gold: "#ffc15e",
  goldDim: "#c9923c",
  line: "#81a475"
};

/**
 * First-run overlay shown once per device. Reads `parlor:seenIntro` from
 * localStorage and dismisses itself if it equals the current version, so
 * we can re-introduce the welcome when we bump STORAGE_VERSION.
 *
 * Adding `?welcome=1` to the URL force-shows the overlay (useful for the
 * About page's "Show welcome again" button).
 */
export default function WelcomeIntro() {
  const [visible, setVisible] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
    let forced = false;
    try {
      const params = new URLSearchParams(window.location.search);
      forced = params.get("welcome") === "1";
    } catch {
      // SSR or sandbox — fine
    }
    if (forced) {
      setVisible(true);
      return;
    }
    let seen = "";
    try {
      seen = window.localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      // localStorage unavailable — show the welcome anyway
    }
    if (seen !== STORAGE_VERSION) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, STORAGE_VERSION);
    } catch {
      // ignore
    }
    if (typeof window !== "undefined" && window.location.search.includes("welcome=1")) {
      // Strip the query param so a refresh doesn't reopen it.
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      window.history.replaceState(null, "", url.toString());
    }
    setVisible(false);
  };

  if (!hydrated || !visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-intro-title"
      aria-describedby="welcome-intro-desc"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(8,14,11,.82)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        padding: 18,
        overflowY: "auto"
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          background: `linear-gradient(180deg, ${C.surface}, ${C.bgDeep})`,
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          padding: "22px clamp(16px, 4vw, 26px) 18px",
          boxShadow: "0 24px 60px rgba(0,0,0,.6)",
          color: C.cream
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hwlogo.png"
            alt=""
            aria-hidden="true"
            width={140}
            height={140}
            style={{ width: 56, height: 56, flex: "0 0 auto", filter: "drop-shadow(0 8px 16px rgba(0,0,0,.42))" }}
          />
          <div>
            <div style={{ color: C.gold, fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>
              Welcome
            </div>
            <h2
              id="welcome-intro-title"
              style={{ margin: 0, color: C.gold, fontSize: "clamp(22px, 5vw, 30px)", lineHeight: 1.15, letterSpacing: 0.5 }}
            >
              Three ways to play.
            </h2>
          </div>
        </div>
        <p id="welcome-intro-desc" style={{ color: C.creamDim, fontSize: 14, lineHeight: 1.55, margin: "0 0 16px" }}>
          Hoodwinked is a party game for the room. Pick the path that fits your night.
        </p>

        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          <Step number={1} title="Solo" body="Twelve solo cases — twelve different ways to test your nerve on one device. Best for trying out a mechanic before the room gets here." />
          <Step number={2} title="Host a room" body="Open a room on the biggest screen you've got. The room shows a 5-letter code; players join from their own devices. Hosting needs a quick Google sign-in." />
          <Step number={3} title="Join a room" body="Heading to a friend's house? Go to playhoodwinked.com on your phone and type the code from their TV. No sign-in needed." />
        </div>

        <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.5, margin: "0 0 14px" }}>
          You can revisit this from the{" "}
          <Link href="/about" style={{ color: C.gold }}>
            About
          </Link>{" "}
          page at any time. Sound, data, and contact info live there too.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={dismiss}
            style={{
              border: `1px solid ${C.gold}`,
              background: `linear-gradient(180deg, ${C.gold}, ${C.goldDim})`,
              color: C.bgDeep,
              borderRadius: 8,
              padding: "10px 18px",
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: 0.5,
              cursor: "pointer",
              boxShadow: "0 10px 22px rgba(0,0,0,.32)"
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, body }: { number: number; title: string; body: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(9,19,14,.5)",
        border: "1px solid rgba(129,164,117,.4)"
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: "rgba(255,193,94,.18)",
          color: C.gold,
          fontWeight: 900,
          fontSize: 14,
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
          border: "1px solid rgba(255,193,94,.42)"
        }}
      >
        {number}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: C.gold, fontSize: 13, fontWeight: 900, letterSpacing: 0.5, marginBottom: 2 }}>{title}</div>
        <div style={{ color: C.creamDim, fontSize: 13, lineHeight: 1.45 }}>{body}</div>
      </div>
    </div>
  );
}
