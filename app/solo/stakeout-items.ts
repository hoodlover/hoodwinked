// Stakeout composite-mode item library.
//
// In "composite" scenes the engine picks N random items from this library,
// places them at random positions inside the scene's placement zones, and
// renders them as overlays on a base background. That gives every round of a
// composite scene unique item subsets + unique positions, vs. the baked-in
// scenes which have static art and static coords per scene.
//
// Each item has:
//   id            stable kebab-case id for foundIds tracking
//   name          checklist label
//   icon          emoji used as visual until a real PNG ships
//   image         optional path to a transparent PNG at /stakeout/items/...
//   sizeCategory  controls both render size and tap tolerance
//
// Radius / render-width scale (% of scene width):
//   tiny    0.05      ring, gem, coin
//   small   0.07      key, lipstick, lighter, paper clip
//   medium  0.09      wallet, notebook, watch, magnifier
//   large   0.12      money bag, hat, lantern, telephone

export type ItemSize = "tiny" | "small" | "medium" | "large";

export type StakeoutItem = {
  id: string;
  name: string;
  icon: string;
  image?: string;
  sizeCategory: ItemSize;
};

export const ITEM_LIBRARY: StakeoutItem[] = [
  // Tiny — under 5% of scene width
  { id: "diamond", name: "Diamond", icon: "💎", sizeCategory: "tiny" },
  { id: "gold-coin", name: "Gold Coin", icon: "🪙", sizeCategory: "tiny" },
  { id: "ring", name: "Ring", icon: "💍", sizeCategory: "tiny" },

  // Small
  { id: "brass-key", name: "Brass Key", icon: "🔑", sizeCategory: "small" },
  { id: "paper-clip", name: "Paper Clip", icon: "📎", sizeCategory: "small" },
  { id: "lipstick", name: "Lipstick", icon: "💄", sizeCategory: "small" },
  { id: "fountain-pen", name: "Fountain Pen", icon: "🖋️", sizeCategory: "small" },
  { id: "cigar", name: "Cigar", icon: "🚬", sizeCategory: "small" },
  { id: "matchbook", name: "Matchbook", icon: "🔥", sizeCategory: "small" },
  { id: "playing-card", name: "Playing Card", icon: "🃏", sizeCategory: "small" },
  { id: "spectacles", name: "Spectacles", icon: "👓", sizeCategory: "small" },

  // Medium
  { id: "pocket-watch", name: "Pocket Watch", icon: "🕰️", sizeCategory: "medium" },
  { id: "wristwatch", name: "Wristwatch", icon: "⌚", sizeCategory: "medium" },
  { id: "wallet", name: "Wallet", icon: "👛", sizeCategory: "medium" },
  { id: "folded-note", name: "Folded Note", icon: "✉️", sizeCategory: "medium" },
  { id: "magnifying-glass", name: "Magnifying Glass", icon: "🔍", sizeCategory: "medium" },
  { id: "envelope", name: "Envelope", icon: "📩", sizeCategory: "medium" },

  // Large
  { id: "money-bag", name: "Money Bag", icon: "💰", sizeCategory: "large" },
  { id: "fedora", name: "Fedora", icon: "🎩", sizeCategory: "large" },
  { id: "telephone", name: "Telephone", icon: "☎️", sizeCategory: "large" },
  { id: "old-photo", name: "Old Photo", icon: "🖼️", sizeCategory: "large" }
];

export const SIZE_RENDER_PCT: Record<ItemSize, number> = {
  tiny: 0.05,
  small: 0.07,
  medium: 0.09,
  large: 0.12
};

// Tap radius as fraction of scene width.
// Slightly tighter than the rendered footprint so two adjacent items don't share hit zones.
export const SIZE_HIT_RADIUS: Record<ItemSize, number> = {
  tiny: 0.04,
  small: 0.05,
  medium: 0.06,
  large: 0.07
};
