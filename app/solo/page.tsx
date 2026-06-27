import Link from "next/link";
import PlayerNameBadge from "./PlayerNameBadge";
import SoloCardBadge from "./SoloCardBadge";
import SoloProgressBanner from "./SoloProgressBanner";
import { SOLO_GAMES } from "./games";

export default function SoloGamesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% 0%, rgba(255,193,94,.14), transparent 34%), linear-gradient(180deg, #254426 0%, #132019 100%)",
        color: "#fbf3e4",
        padding: "20px clamp(12px, 3vw, 34px) 48px",
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            gap: 12,
            marginBottom: 22,
            flexWrap: "nowrap"
          }}
        >
          <div style={{ minWidth: 0, flex: "1 1 0" }}>
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
            <h1
              style={{
                margin: "10px 0 4px",
                color: "#ffc15e",
                fontSize: "clamp(30px, 7vw, 64px)",
                lineHeight: 1,
                letterSpacing: 1,
                overflowWrap: "anywhere",
                fontVariant: "small-caps",
                textShadow: "0 8px 18px rgba(0,0,0,.6), 0 0 10px rgba(0,0,0,.5)"
              }}
            >
              Solo Cases
            </h1>
            <p style={{ margin: "6px 0 0", color: "#d9d2bd", fontWeight: 800, letterSpacing: 1.2, fontSize: 13 }}>
              Grab a case and get ready!
            </p>
            <div style={{ marginTop: 10 }}>
              <PlayerNameBadge />
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hwlogo.png"
            alt="Hoodwinked"
            width={140}
            height={140}
            style={{
              width: "auto",
              height: "auto",
              maxWidth: "min(220px, 28vw)",
              maxHeight: "min(260px, 32vw)",
              alignSelf: "stretch",
              objectFit: "contain",
              flex: "0 0 auto",
              filter: "drop-shadow(0 12px 22px rgba(0,0,0,.42))"
            }}
          />
        </header>

        <SoloProgressBanner />

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10
          }}
        >
          {SOLO_GAMES.map((game, idx) => {
            const playable = game.status === "playable";
            // Subtle randomized crack-line pattern per card so they don't all look identical.
            // Pure CSS — three thin diagonal "fractures" at varied angles using linear-gradients.
            const seed = (idx * 137) % 360;
            const a1 = (seed + 18) % 60 + 100; // 100..160 deg
            const a2 = (seed + 41) % 70 + 70;  // 70..140 deg
            const a3 = (seed + 73) % 80 + 30;  // 30..110 deg
            const crackOverlay = playable
              ? `
                  linear-gradient(${a1}deg, transparent 49.6%, rgba(255,255,255,.18) 49.85%, rgba(255,255,255,.06) 50.15%, transparent 50.5%),
                  linear-gradient(${a2}deg, transparent 36%, rgba(255,255,255,.08) 36.12%, transparent 36.32%),
                  linear-gradient(${a3}deg, transparent 64%, rgba(0,0,0,.32) 64.1%, rgba(0,0,0,.18) 64.25%, transparent 64.5%)
                `
              : `linear-gradient(${a1}deg, transparent 49.7%, rgba(255,255,255,.06) 49.9%, transparent 50.2%)`;
            const card = (
              <article
                style={{
                  position: "relative",
                  border: playable ? "1px solid rgba(255,193,94,.55)" : "1px solid rgba(129,164,117,.35)",
                  background: playable ? "rgba(255,193,94,.10)" : "rgba(10,19,14,.55)",
                  borderRadius: 10,
                  padding: 14,
                  boxShadow: playable
                    ? "0 10px 22px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.18), inset 0 -1px 0 rgba(0,0,0,.45)"
                    : "0 10px 22px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.06)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  overflow: "hidden",
                  backdropFilter: "blur(1px)"
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: crackOverlay,
                    pointerEvents: "none",
                    mixBlendMode: "screen",
                    opacity: playable ? 0.85 : 0.55
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    color: playable ? "#ffc15e" : "#9aaa91",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 1.4
                  }}
                >
                  {playable ? "PLAY" : "COMING SOON"}
                </div>
                <div style={{ position: "relative", color: "#fbf3e4", fontSize: 17, fontWeight: 900, lineHeight: 1.15, fontVariant: "small-caps" }}>
                  {game.name}
                </div>
                <p style={{ position: "relative", color: "#d9d2bd", fontSize: 12, lineHeight: 1.4, margin: 0 }}>{game.note}</p>
                {playable && (
                  <div style={{ position: "relative" }}>
                    <SoloCardBadge slug={game.slug} />
                  </div>
                )}
              </article>
            );

            if (!playable) {
              return (
                <div key={game.slug} aria-disabled style={{ opacity: 0.7 }}>
                  {card}
                </div>
              );
            }

            return (
              <Link
                key={game.slug}
                href={`/solo/${game.slug}`}
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                {card}
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
