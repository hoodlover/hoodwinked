import Link from "next/link";
import type { CSSProperties } from "react";
import { auth } from "@/auth";
import { getHostAccess } from "@/lib/host-access";

const C = {
  cream: "#fbf3e4",
  creamDim: "#d9d2bd",
  muted: "#b9c7b1",
  gold: "#ffc15e",
  goldDim: "#c9923c",
  line: "#81a475",
  bgDeep: "#13201a"
};

export default async function HostAccessPage() {
  const access = getHostAccess(await auth());
  const isSignedIn = access.signedIn;

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
      <section style={{ maxWidth: 520, width: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hwlogo.png"
          alt="Hoodwinked"
          width={140}
          height={140}
          style={{ width: "clamp(72px, 16vw, 110px)", height: "auto", margin: "0 auto 12px", display: "block", filter: "drop-shadow(0 12px 22px rgba(0,0,0,.42))" }}
        />
        <div style={{ color: C.gold, fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
          {isSignedIn ? "Host access pending" : "Host a game"}
        </div>
        <h1 style={{ color: C.gold, fontSize: "clamp(28px, 7vw, 40px)", margin: "0 0 12px", lineHeight: 1.1, letterSpacing: 0.5 }}>
          {isSignedIn ? "You're almost in." : "Hosting takes a quick sign-in."}
        </h1>

        {isSignedIn ? (
          <p style={{ color: C.creamDim, lineHeight: 1.6, fontSize: 15, marginBottom: 18 }}>
            <strong style={{ color: C.cream }}>{access.email ?? "This account"}</strong> is signed in, but isn&apos;t on the approved host list yet. Hosts are added manually to keep server costs and content in check.
          </p>
        ) : (
          <>
            <p style={{ color: C.creamDim, lineHeight: 1.6, fontSize: 15, marginBottom: 14 }}>
              Hoodwinked uses a single Google sign-in for room hosts so we can pin a room to a verified account, hand out host approvals one at a time, and keep voice + image generation usage under control.
            </p>
            <ul style={{ textAlign: "left", color: C.creamDim, fontSize: 14, lineHeight: 1.55, margin: "0 auto 18px", maxWidth: 420, paddingLeft: 22 }}>
              <li style={{ marginBottom: 4 }}>Players joining a room never sign in.</li>
              <li style={{ marginBottom: 4 }}>Solo cases never need sign-in either.</li>
              <li>You only need this for hosting a live room.</li>
            </ul>
            <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.5, marginBottom: 18 }}>
              We receive your Google email and profile picture and use them only to verify your host access. See the{" "}
              <Link href="/privacy" style={{ color: C.gold }}>privacy policy</Link>.
            </p>
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
          {!isSignedIn && (
            <Link href="/api/auth/signin?callbackUrl=/" style={primaryButton}>
              Sign in with Google
            </Link>
          )}
          <Link href="/" style={isSignedIn ? primaryButton : ghostButton}>
            Back home
          </Link>
          {isSignedIn && (
            <Link href="/api/auth/signout?callbackUrl=/" style={ghostButton}>
              Sign out
            </Link>
          )}
        </div>

        <div style={{ marginTop: 22, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/?local=1" style={demoLink}>
            Try demo mode →
          </Link>
          <Link href="/solo" style={demoLink}>
            Play a solo case →
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
  letterSpacing: 0.5,
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

const demoLink: CSSProperties = {
  display: "inline-flex",
  color: C.muted,
  fontSize: 12,
  fontWeight: 800,
  textDecoration: "none",
  borderBottom: `1px dotted ${C.muted}`
};
