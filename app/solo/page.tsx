import Link from "next/link";
import SafesAndEvidence from "./SafesAndEvidence";

const soloGames = [
  {
    name: "Safes & Evidence",
    status: "Playable",
    note: "Crack the hidden safes before the AI clears your evidence board."
  },
  {
    name: "Cipher Sweep",
    status: "Coming soon",
    note: "Decode patterns against a timer."
  },
  {
    name: "Alibi Grid",
    status: "Coming soon",
    note: "Spot contradictions in a lineup of suspect claims."
  },
  {
    name: "Vault Runner",
    status: "Coming soon",
    note: "Pick the safest path through clues and decoys."
  },
  {
    name: "Case File Blitz",
    status: "Coming soon",
    note: "Quick-fire mystery trivia for one player."
  },
  {
    name: "The Lookout",
    status: "Coming soon",
    note: "Memory and observation challenges."
  }
];

export default function SoloGamesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% 0%, rgba(255,193,94,.14), transparent 34%), linear-gradient(180deg, #254426 0%, #132019 100%)",
        color: "#fbf3e4",
        padding: "24px clamp(14px, 3vw, 34px) 48px",
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 28
          }}
        >
          <div>
            <Link href="/" style={{ color: "#b9c7b1", textDecoration: "none", fontWeight: 800 }}>
              Back to Hoodwinked
            </Link>
            <h1
              style={{
                margin: "12px 0 4px",
                color: "#ffc15e",
                fontSize: "clamp(40px, 8vw, 86px)",
                lineHeight: 0.95,
                letterSpacing: 1,
                textShadow: "0 8px 24px rgba(0,0,0,.82), 0 2px 5px rgba(0,0,0,.95)"
              }}
            >
              Solo Cases
            </h1>
            <p style={{ margin: 0, color: "#d9d2bd", fontWeight: 800, letterSpacing: 1.4 }}>
              One-player games from the Hoodwinked evidence locker.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hwlogo.png"
            alt="Hoodwinked"
            width={180}
            height={180}
            style={{ width: "min(180px, 28vw)", height: "auto", filter: "drop-shadow(0 14px 26px rgba(0,0,0,.45))" }}
          />
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 10,
            marginBottom: 24
          }}
        >
          {soloGames.map((game) => (
            <article
              key={game.name}
              style={{
                border: "1px solid rgba(129,164,117,.55)",
                background: game.status === "Playable" ? "rgba(255,193,94,.12)" : "rgba(10,19,14,.52)",
                borderRadius: 8,
                padding: 14,
                boxShadow: "0 12px 28px rgba(0,0,0,.22)"
              }}
            >
              <div style={{ color: game.status === "Playable" ? "#ffc15e" : "#9aaa91", fontSize: 11, fontWeight: 900, letterSpacing: 1.4 }}>
                {game.status.toUpperCase()}
              </div>
              <div style={{ color: "#fbf3e4", fontSize: 18, fontWeight: 900, margin: "5px 0 6px" }}>
                {game.name}
              </div>
              <p style={{ color: "#d9d2bd", fontSize: 12, lineHeight: 1.4, margin: 0 }}>{game.note}</p>
            </article>
          ))}
        </section>

        <SafesAndEvidence />
      </div>
    </main>
  );
}
