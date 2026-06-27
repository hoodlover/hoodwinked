import type { MetadataRoute } from "next";
import { SOLO_GAMES } from "./solo/games";

const BASE = "https://playhoodwinked.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/`,
      changeFrequency: "weekly",
      priority: 1.0
    },
    {
      url: `${BASE}/solo`,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${BASE}/about`,
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${BASE}/privacy`,
      changeFrequency: "monthly",
      priority: 0.5
    }
  ];

  const soloPaths: MetadataRoute.Sitemap = SOLO_GAMES
    .filter((game) => game.status === "playable")
    .map((game) => ({
      url: `${BASE}/solo/${game.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }));

  return [...staticPaths, ...soloPaths];
}
