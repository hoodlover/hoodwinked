import type { CSSProperties } from "react";
import Link from "next/link";

const C = {
  cream: "#fbf3e4",
  creamDim: "#d9d2bd",
  muted: "#b9c7b1",
  gold: "#ffc15e",
  goldDim: "#c9923c",
  line: "#81a475",
  bgDeep: "#13201a"
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px clamp(14px, 4vw, 32px)",
        background:
          "radial-gradient(circle at 50% 0%, rgba(255,193,94,.14), transparent 34%), linear-gradient(180deg, #254426 0%, #132019 100%)",
        color: C.cream,
        fontFamily: "Inter, system-ui, sans-serif",
        textAlign: "center"
      }}
    >
      <section style={{ maxWidth: 460, width: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hwlogo.png"
          alt="Hoodwinked"
          width={140}
          height={140}
          style={{ width: "clamp(72px, 16vw, 110px)", height: "auto", margin: "0 auto 14px", display: "block", filter: "drop-shadow(0 12px 22px rgba(0,0,0,.42))" }}
        />
        <div style={{ color: C.gold, fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
          Case unsolved
        </div>
        <div
          style={{
            color: C.gold,
            fontSize: "clamp(64px, 18vw, 110px)",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: 2,
            textShadow: "0 10px 22px rgba(0,0,0,.6), 0 0 18px rgba(255,193,94,.18)"
          }}
        >
          404
        </div>
        <h1 style={{ color: C.cream, fontSize: "clamp(20px, 5vw, 28px)", margin: "8px 0 8px", lineHeight: 1.2, letterSpacing: 0.5 }}>
          That trail&apos;s gone cold.
        </h1>
        <p style={{ color: C.creamDim, lineHeight: 1.55, fontSize: 14, marginBottom: 22 }}>
          The page you were looking for isn&apos;t at this address. Try the lobby, jump into a solo case, or check your room code.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={primaryButton}>
            Back to lobby
          </Link>
          <Link href="/solo" style={ghostButton}>
            Open solo cases
          </Link>
        </div>
        <div style={{ marginTop: 28, color: C.line, fontSize: 11, fontWeight: 800, letterSpacing: 1.6 }}>
          <Link href="/about" style={{ color: C.line, textDecoration: "none", borderBottom: `1px dotted ${C.line}` }}>
            About
          </Link>
          <span style={{ margin: "0 8px" }}>·</span>
          <Link href="/privacy" style={{ color: C.line, textDecoration: "none", borderBottom: `1px dotted ${C.line}` }}>
            Privacy
          </Link>
        </div>
      </section>
    </main>
  );
}

const primaryButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0 18px",
  borderRadius: 10,
  background: `linear-gradient(180deg, ${C.gold}, ${C.goldDim})`,
  border: `1px solid ${C.gold}`,
  color: C.bgDeep,
  fontWeight: 900,
  fontSize: 14,
  textDecoration: "none",
  boxShadow: "0 10px 22px rgba(0,0,0,.32)"
};

const ghostButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0 18px",
  borderRadius: 10,
  background: "rgba(9,19,14,.5)",
  color: C.cream,
  border: `1px solid ${C.line}`,
  fontWeight: 800,
  fontSize: 14,
  textDecoration: "none"
};
