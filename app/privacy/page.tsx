import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · Hoodwinked",
  description: "How Hoodwinked handles your data."
};

const C = {
  cream: "#fbf3e4",
  creamDim: "#d9d2bd",
  gold: "#ffc15e",
  line: "#81a475",
  muted: "#b9c7b1"
};

const updated = "October 2025";

export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% 0%, rgba(255,193,94,.14), transparent 34%), linear-gradient(180deg, #254426 0%, #132019 100%)",
        color: C.cream,
        padding: "20px clamp(12px, 3vw, 34px) 64px",
        fontFamily: "Inter, system-ui, sans-serif",
        lineHeight: 1.55
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
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
          <Link href="/about" style={{ color: C.gold, textDecoration: "none", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>
            About →
          </Link>
        </nav>

        <h1 style={{ margin: "8px 0 4px", color: C.gold, fontSize: "clamp(28px, 6vw, 48px)", lineHeight: 1, letterSpacing: 1 }}>
          Privacy Policy
        </h1>
        <p style={{ color: C.muted, fontWeight: 800, letterSpacing: 1.2, fontSize: 12, marginTop: 0, marginBottom: 24 }}>
          Last updated: {updated}
        </p>

        <Section title="The short version">
          <p>
            Hoodwinked is a party game. We store the bare minimum needed to keep your name, avatar, and scores on your own device, and to sync the live game state with the other players in your room. We do not sell your data, run third-party ad tracking, or build advertising profiles.
          </p>
        </Section>

        <Section title="What we store on your device">
          <p>The app uses your browser&apos;s localStorage to remember:</p>
          <Bullets
            items={[
              "Your chosen display name and avatar",
              "Mute / sound preference",
              "An anonymous device ID used to reconnect to your in-progress game",
              "Solo case scores (wins, losses, streaks) for each of the 12 solo games",
              "If you host a room: a host token tied to the room code, so refreshing the page keeps your host privileges"
            ]}
          />
          <p style={{ marginTop: 12 }}>
            This data never leaves your device unless you actively share it (for example, your display name is sent to the other players in your room so they can see who they&apos;re playing with). You can wipe all of it at any time on the{" "}
            <Link href="/about" style={{ color: C.gold }}>About page</Link>.
          </p>
        </Section>

        <Section title="What we send to game servers">
          <p>
            Multiplayer rooms are powered by{" "}
            <ExtLink href="https://www.partykit.io/">PartyKit</ExtLink> (Cloudflare-hosted). When you join or host a room, the following are sent to the room server for the duration of the game:
          </p>
          <Bullets
            items={[
              "Your display name and avatar selection",
              "Your votes, answers, and game actions",
              "Your score for the current game"
            ]}
          />
          <p style={{ marginTop: 12 }}>
            Room state is held in memory and is discarded when the room is empty. Solo games run entirely on your device and never talk to a game server.
          </p>
        </Section>

        <Section title="Third-party services">
          <p>The app can call these services. Each is opt-in via your actions and gated behind host sign-in where noted:</p>
          <Bullets
            items={[
              "Google Sign-In (via NextAuth) — required only if you want to host a room. We receive your Google account email and profile picture so we can verify your host access. We do not store this beyond your session.",
              "OpenAI image generation — used by the host&apos;s device during the picture-reveal party mode to generate the round&apos;s artwork. The text prompt is sent to OpenAI; players&apos; personal data is not.",
              "ElevenLabs voice synthesis — used by the host&apos;s device for the announcer voice in some party modes. The short text to be spoken is sent to ElevenLabs.",
              "Pollinations.ai — used as an image-generation fallback if OpenAI is unavailable."
            ]}
          />
          <p style={{ marginTop: 12 }}>
            Each provider has its own privacy policy. We only send the minimum text or prompt the feature needs, and we do not pass personal identifiers to these providers.
          </p>
        </Section>

        <Section title="Children">
          <p>
            Hoodwinked is intended for a general audience. Because party answers and lobby chat are free-form, some game content may be created by other players. We don&apos;t knowingly collect personal information from children under 13. If you believe a child has provided personal information, please contact us and we&apos;ll delete it.
          </p>
        </Section>

        <Section title="Your rights and how to delete your data">
          <Bullets
            items={[
              "Wipe your saved name, avatar, scores, and host tokens at any time from the Clear my data button on the About page.",
              "Sign out of Google through your Google account settings to revoke our auth access.",
              "Leave or close a multiplayer room to remove your live presence from the room server.",
              "Email us with any other request — see contact below."
            ]}
          />
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make material changes, we&apos;ll update the date at the top of this page. Continued use of the app after a change means you accept the updated policy.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about privacy, data deletion, or anything else:{" "}
            <a href="mailto:lance@playhoodwinked.com" style={{ color: C.gold }}>
              lance@playhoodwinked.com
            </a>
          </p>
        </Section>

        <div style={{ color: C.line, fontSize: 11, fontWeight: 800, letterSpacing: 1.6, marginTop: 36, textAlign: "center" }}>
          <Link href="/about" style={{ color: C.line, textDecoration: "none", borderBottom: `1px dotted ${C.line}` }}>
            About this app
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <h2 style={{ margin: "0 0 8px", color: C.gold, fontSize: 18, letterSpacing: 1.1, textTransform: "uppercase", fontWeight: 900 }}>
        {title}
      </h2>
      <div style={{ color: C.creamDim, fontSize: 14.5 }}>{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "8px 0 0", paddingLeft: 22 }}>
      {items.map((item, index) => (
        <li key={index} style={{ marginBottom: 6 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: C.gold }}>
      {children}
    </a>
  );
}
