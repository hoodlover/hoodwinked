export type SoloGameStatus = "playable" | "coming-soon";

export type SoloGameMeta = {
  slug: string;
  name: string;
  status: SoloGameStatus;
  note: string;
};

export const SOLO_GAMES: SoloGameMeta[] = [
  {
    slug: "alibis-informants",
    name: "Alibis & Informants",
    status: "playable",
    note: "Sweep rival police-station maps for hidden alibis and informants."
  },
  {
    slug: "three-marks-monte",
    name: "Three Mark's Monte",
    status: "playable",
    note: "Track the hidden prize through a fast red-cup shuffle."
  },
  {
    slug: "hoodwink-or-dice",
    name: "Hoodwink or Dice",
    status: "playable",
    note: "Raise bids, call bluffs, and outlast the AI at liar's dice."
  },
  {
    slug: "the-house-always-lies",
    name: "The House Always Lies",
    status: "playable",
    note: "Play the crooked blackjack table with bets, doubles, and dealer tells."
  },
  {
    slug: "final-offer",
    name: "Final Offer",
    status: "playable",
    note: "Open briefcases, read the Banker, and decide when to take the deal."
  },
  {
    slug: "the-sweep",
    name: "The Sweep",
    status: "playable",
    note: "Reveal genuine clues on a 10x10 board without tripping red herrings."
  },
  {
    slug: "cipher-sweep",
    name: "Cipher Sweep",
    status: "playable",
    note: "Decode patterns against a timer."
  },
  {
    slug: "alibi-grid",
    name: "Alibi Grid",
    status: "coming-soon",
    note: "Spot contradictions in a lineup of suspect claims."
  },
  {
    slug: "vault-runner",
    name: "Vault Runner",
    status: "playable",
    note: "Pick the safest path through clues and decoys."
  },
  {
    slug: "case-file-blitz",
    name: "Case File Blitz",
    status: "playable",
    note: "Quick-fire mystery trivia for one player."
  },
  {
    slug: "the-lookout",
    name: "The Lookout",
    status: "coming-soon",
    note: "Memory and observation challenges."
  }
];

export function findSoloGame(slug: string): SoloGameMeta | undefined {
  return SOLO_GAMES.find((g) => g.slug === slug);
}
