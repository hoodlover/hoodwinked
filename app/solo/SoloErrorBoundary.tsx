"use client";

import Link from "next/link";
import { Component, type ReactNode } from "react";

type Props = { gameName: string; children: ReactNode };
type State = { error: Error | null };

const C = {
  cream: "#fbf3e4",
  creamDim: "#d9d2bd",
  muted: "#b9c7b1",
  gold: "#ffc15e",
  goldDim: "#c9923c",
  line: "#81a475",
  coral: "#cf4f45",
  bgDeep: "#13201a"
};

export default class SoloErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // Best-effort signal; helps debugging without sending anything off-device.
    if (typeof console !== "undefined") {
      console.error("[SoloErrorBoundary]", this.props.gameName, error, info);
    }
  }

  retry = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section
        style={{
          border: `1px solid ${C.coral}`,
          borderRadius: 10,
          background: "linear-gradient(180deg, rgba(46,18,22,.84), rgba(9,19,14,.86))",
          padding: "clamp(16px, 4vw, 28px)",
          marginTop: 24,
          color: C.cream,
          textAlign: "center",
          boxShadow: "0 20px 48px rgba(0,0,0,.36)"
        }}
      >
        <div style={{ color: C.coral, fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
          Case file corrupted
        </div>
        <h2 style={{ margin: "0 0 8px", color: C.gold, fontSize: "clamp(22px, 5vw, 32px)", lineHeight: 1.15 }}>
          {this.props.gameName} hit a snag.
        </h2>
        <p style={{ margin: "0 auto 16px", color: C.creamDim, fontSize: 14, lineHeight: 1.5, maxWidth: 460 }}>
          Something inside this case threw an error. Your saved scores on this device are untouched. Try restarting the case, or pick a different one.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={this.retry}
            style={{
              border: `1px solid ${C.gold}`,
              background: `linear-gradient(180deg, ${C.gold}, ${C.goldDim})`,
              color: C.bgDeep,
              borderRadius: 8,
              padding: "10px 18px",
              fontWeight: 900,
              fontSize: 14,
              cursor: "pointer"
            }}
          >
            Restart case
          </button>
          <Link
            href="/solo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: `1px solid ${C.line}`,
              background: "rgba(9,19,14,.5)",
              color: C.cream,
              borderRadius: 8,
              padding: "10px 16px",
              fontWeight: 800,
              fontSize: 13,
              textDecoration: "none"
            }}
          >
            Back to solo cases
          </Link>
        </div>
        {process.env.NODE_ENV !== "production" && (
          <details style={{ marginTop: 16, color: C.muted, fontSize: 11, textAlign: "left" }}>
            <summary style={{ cursor: "pointer", fontWeight: 800, letterSpacing: 1 }}>Developer details</summary>
            <pre style={{ overflow: "auto", padding: 8, marginTop: 6, background: "rgba(0,0,0,.42)", borderRadius: 6, fontSize: 10, lineHeight: 1.4 }}>
              {String(this.state.error?.stack || this.state.error?.message)}
            </pre>
          </details>
        )}
      </section>
    );
  }
}
