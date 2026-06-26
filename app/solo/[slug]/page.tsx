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
          <Link href="/solo" aria-label="Back to solo cases" style={{ display: "inline-flex", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.42))" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/backtosolo.png"
              alt="Back to solo cases"
              width={404}
              height={51}
              style={{ height: "clamp(20px, 4vw, 26px)", width: "auto", display: "block" }}
            />
          </Link>
          <Link href="/" aria-label="Back to Hoodwinked" style={{ display: "inline-flex", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.42))" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/backtomain.png"
              alt="Back to Hoodwinked"
              width={386}
              height={54}
              style={{ height: "clamp(20px, 4vw, 26px)", width: "auto", display: "block" }}
            />
          </Link>
        </nav>
        <Game />
      </div>
    </main>
  );
}
