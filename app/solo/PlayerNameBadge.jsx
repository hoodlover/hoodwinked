"use client";

import { useEffect, useRef, useState } from "react";
import { readPlayerName, writePlayerName } from "./scoreStore";

export default function PlayerNameBadge() {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const stored = readPlayerName();
    // SSR returns ""; hydrate the real value on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(stored);
    setMounted(true);
    if (!stored) setEditing(true);
  }, []);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (!mounted) return null;

  const commit = () => {
    const trimmed = draft.trim();
    setName(trimmed);
    writePlayerName(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(name);
    if (name) setEditing(false);
  };

  if (editing) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid #ffc15e",
          background: "rgba(255,193,94,.12)",
          fontFamily: "Inter, system-ui, sans-serif"
        }}
      >
        <span style={{ color: "#ffc15e", fontWeight: 900, letterSpacing: 1.1, fontSize: 11 }}>DETECTIVE</span>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          maxLength={24}
          placeholder="Your name"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          onBlur={() => {
            if (draft.trim()) commit();
            else cancel();
          }}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#fbf3e4",
            fontWeight: 800,
            fontSize: 14,
            width: "8.5em",
            maxWidth: "60vw",
            padding: 0
          }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(name);
        setEditing(true);
      }}
      title="Change name"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        border: "1px solid rgba(129,164,117,.55)",
        background: "rgba(10,19,14,.55)",
        color: "#fbf3e4",
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 800,
        fontSize: 13,
        cursor: "pointer"
      }}
    >
      <span style={{ color: "#ffc15e", fontWeight: 900, letterSpacing: 1.1, fontSize: 11 }}>DETECTIVE</span>
      <span style={{ fontVariant: "small-caps" }}>{name}</span>
      <span aria-hidden="true" style={{ color: "#d9d2bd", fontSize: 11 }}>✎</span>
    </button>
  );
}
