import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FinalOffer from "../FinalOffer";
import HoodwinkOrDice from "../HoodwinkOrDice";
import OwnTheHouse from "../OwnTheHouse";
import SafesAndEvidence from "../SafesAndEvidence";
import ShellGame from "../ShellGame";
import TheSweep from "../TheSweep";
import { findSoloGame, SOLO_GAMES } from "../games";

type ComponentMap = Record<string, React.ComponentType>;

const COMPONENTS: ComponentMap = {
  "alibis-informants": SafesAndEvidence,
  "three-marks-monte": ShellGame,
  "hoodwink-or-dice": HoodwinkOrDice,
  "the-house-always-lies": OwnTheHouse,
  "final-offer": FinalOffer,
  "the-sweep": TheSweep
};

export function generateStaticParams() {
  return SOLO_GAMES.filter((g) => g.status === "playable").map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = findSoloGame(slug);
  if (!game) return { title: "Solo case · Hoodwinked" };
  return { title: `${game.name} · Hoodwinked Solo` };
}

export default async function SoloGamePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = findSoloGame(slug);
  const Game = COMPONENTS[slug];
  if (!game || !Game) notFound();

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% 0%, rgba(255,193,94,.14), transparent 34%), linear-gradient(180deg, #254426 0%, #132019 100%)",
        color: "#fbf3e4",
        padding: "16px clamp(10px, 3vw, 28px) 40px",
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
            flexWrap: "wrap"
          }}
        >
          <Link
            href="/solo"
            style={{
              color: "#ffc15e",
              textDecoration: "none",
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: 1,
              border: "1px solid rgba(255,193,94,.45)",
              borderRadius: 999,
              padding: "8px 14px",
              background: "rgba(9,19,14,.45)"
            }}
          >
            ← Solo cases
          </Link>
          <Link
            href="/"
            style={{
              color: "#b9c7b1",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: 13
            }}
          >
            Hoodwinked
          </Link>
        </nav>
        <Game />
      </div>
    </main>
  );
}
