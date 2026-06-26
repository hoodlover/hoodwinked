import Link from "next/link";
import PlayerNameBadge from "./PlayerNameBadge";
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
            alignItems: "flex-end",
            gap: 12,
            marginBottom: 22,
            flexWrap: "wrap"
          }}
        >
          <div style={{ minWidth: 0, flex: "1 1 240px" }}>
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
              width: "min(140px, 22vw)",
              height: "auto",
              flex: "0 0 auto",
              filter: "drop-shadow(0 12px 22px rgba(0,0,0,.42))"
            }}
          />
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10
          }}
        >
          {SOLO_GAMES.map((game) => {
            const playable = game.status === "playable";
            const card = (
              <article
                style={{
                  border: playable ? "1px solid rgba(255,193,94,.55)" : "1px solid rgba(129,164,117,.35)",
                  background: playable ? "rgba(255,193,94,.10)" : "rgba(10,19,14,.55)",
                  borderRadius: 10,
                  padding: 14,
                  boxShadow: "0 10px 22px rgba(0,0,0,.22)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6
                }}
              >
                <div
                  style={{
                    color: playable ? "#ffc15e" : "#9aaa91",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 1.4
                  }}
                >
                  {playable ? "PLAY" : "COMING SOON"}
                </div>
                <div style={{ color: "#fbf3e4", fontSize: 17, fontWeight: 900, lineHeight: 1.15 }}>
                  {game.name}
                </div>
                <p style={{ color: "#d9d2bd", fontSize: 12, lineHeight: 1.4, margin: 0 }}>{game.note}</p>
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
