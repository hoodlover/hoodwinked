import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Crawl the lobby, solo cases, About and Privacy.
        allow: ["/", "/solo", "/about", "/privacy"],
        // Never expose live room URLs or auth endpoints to search engines.
        disallow: ["/api/", "/host/", "/host-access", "/room/", "/board/", "/play/", "/join/"]
      }
    ],
    sitemap: "https://playhoodwinked.com/sitemap.xml",
    host: "https://playhoodwinked.com"
  };
}
