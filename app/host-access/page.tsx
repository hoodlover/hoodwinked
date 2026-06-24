import Link from "next/link";
import type { CSSProperties } from "react";
import { auth } from "@/auth";
import { getHostAccess } from "@/lib/host-access";

export default async function HostAccessPage() {
  const access = getHostAccess(await auth());

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#193a20",
        color: "#fbf3e4",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center"
      }}
    >
      <section style={{ maxWidth: 520 }}>
        <h1 style={{ color: "#ffc15e", fontSize: 34, marginBottom: 12 }}>
          Host access pending approval.
        </h1>
        <p style={{ color: "#d9d0bc", lineHeight: 1.6 }}>
          {access.signedIn
            ? `${access.email ?? "This account"} is signed in, but is not on the approved host list yet.`
            : "Sign in with an approved Google account to host Hoodwinked games."}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
          {!access.signedIn && (
            <Link href="/api/auth/signin?callbackUrl=/" style={linkButton}>
              Sign in
            </Link>
          )}
          <Link href="/" style={linkButton}>
            Back home
          </Link>
          {access.signedIn && (
            <Link href="/api/auth/signout?callbackUrl=/" style={ghostButton}>
              Sign out
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

const linkButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0 18px",
  borderRadius: 10,
  background: "#ffc15e",
  color: "#102516",
  fontWeight: 800,
  textDecoration: "none"
};

const ghostButton: CSSProperties = {
  ...linkButton,
  background: "transparent",
  color: "#fbf3e4",
  border: "1px solid rgba(251, 243, 228, .35)"
};
