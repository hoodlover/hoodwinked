import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  // Single source of truth for the app version is package.json. Bump it with
  // `npm version patch|minor|major` and the lobby footer + About page pick it
  // up automatically at build time.
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
        ]
      }
    ];
  }
};

export default nextConfig;
