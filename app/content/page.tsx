"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  emptyCustomContentDeck,
  loadCustomContentDecks,
  normalizeCustomContentDeck,
  saveCustomContentDecks,
  setActiveCustomContentDeck,
  type CustomContentDeck
} from "@/lib/custom-content";
import type { FeudQuestion, PictureItem, TriviaQuestion, WheelPuzzle } from "@/lib/engine";

type Tab = "prompts" | "trivia" | "feud" | "picture" | "wheel";

const C = {
  bg: "#13201a",
  surface: "#223a24",
  surface2: "#2d4a2d",
  line: "#81a475",
  cream: "#fbf3e4",
  creamDim: "#d9d2bd",
  muted: "#b9c7b1",
  gold: "#ffc15e",
  goldDim: "#c9923c",
  coral: "#cf4f45",
  blue: "#6fb6d8"
};

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "prompts", label: "Prompts" },
  { id: "trivia", label: "Trivia" },
  { id: "feud", label: "Surveys" },
  { id: "picture", label: "Images" },
  { id: "wheel", label: "Puzzles" }
];

function newTrivia(deckId: string, index: number): TriviaQuestion {
  return {
    id: `${deckId}-t${Date.now().toString(36)}-${index}`,
    category: "Custom",
    text: "",
    choices: ["", "", "", ""],
    correctIndex: 0
  };
}

function newFeud(deckId: string, index: number): FeudQuestion {
  return {
    id: `${deckId}-f${Date.now().toString(36)}-${index}`,
    prompt: "",
    answers: [
      { text: "", points: 40, aliases: [] },
      { text: "", points: 30, aliases: [] },
      { text: "", points: 20, aliases: [] },
      { text: "", points: 10, aliases: [] }
    ]
  };
}

function newPicture(deckId: string, index: number): PictureItem {
  return {
    id: `${deckId}-p${Date.now().toString(36)}-${index}`,
    src: "",
    answer: "",
    hint: "",
    aliases: [],
    imagePrompt: "",
    imageStatus: "idle"
  };
}

function newWheel(deckId: string, index: number): WheelPuzzle {
  return {
    id: `${deckId}-w${Date.now().toString(36)}-${index}`,
    category: "Custom",
    text: ""
  };
}

function splitList(value: string): string[] {
  return value.split(",").map((part) => part.trim()).filter(Boolean);
}

function joinList(value: string[] | undefined): string {
  return (value ?? []).join(", ");
}

function inputStyle(multiline = false): React.CSSProperties {
  return {
    width: "100%",
    border: `1px solid ${C.line}`,
    background: "rgba(9,19,14,.62)",
    color: C.cream,
    borderRadius: 6,
    padding: multiline ? "10px 11px" : "9px 10px",
    font: "inherit",
    minHeight: multiline ? 84 : undefined,
    resize: multiline ? "vertical" : undefined
  };
}

function buttonStyle(kind: "primary" | "quiet" | "danger" = "quiet"): React.CSSProperties {
  const primary = kind === "primary";
  const danger = kind === "danger";
  return {
    border: `1px solid ${danger ? C.coral : primary ? C.gold : C.line}`,
    background: primary
      ? `linear-gradient(180deg, ${C.gold}, ${C.goldDim})`
      : danger
        ? "rgba(207,79,69,.16)"
        : "rgba(9,19,14,.46)",
    color: primary ? C.bg : danger ? C.coral : C.cream,
    borderRadius: 7,
    padding: "9px 12px",
    fontWeight: 900,
    cursor: "pointer"
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error("Could not read workbook."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read workbook."));
    reader.readAsArrayBuffer(file);
  });
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function cellText(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  return value == null ? "" : String(value).trim();
}

function cellNumber(row: Record<string, unknown>, key: string, fallback: number): number {
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : fallback;
}

async function deckFromWorkbook(file: File): Promise<CustomContentDeck | null> {
  const XLSX = await import("xlsx");
  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetRows = (name: string): Record<string, unknown>[] => {
    const worksheet = workbook.Sheets[name];
    return worksheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" }) : [];
  };
  const deckName = file.name.replace(/\.(xlsx|xls)$/i, "").replace(/[-_]?hoodwinked[-_]?content[-_]?template/i, "").trim();
  const deck = emptyCustomContentDeck(deckName || "Imported Workbook");

  deck.prompts = sheetRows("Prompts")
    .map((row) => cellText(row, "Prompt"))
    .filter(Boolean);

  deck.trivia = sheetRows("Trivia")
    .map((row, index) => {
      const text = cellText(row, "Question");
      const choices = ["Choice 1", "Choice 2", "Choice 3", "Choice 4"].map((key) => cellText(row, key)).filter(Boolean);
      if (!text || choices.length < 2) return null;
      const correctIndex = Math.max(0, Math.min(choices.length - 1, Math.round(cellNumber(row, "Correct Choice Number", 1)) - 1));
      return {
        id: `${deck.id}-t${index + 1}`,
        category: cellText(row, "Category") || "Custom",
        text,
        choices,
        correctIndex
      } satisfies TriviaQuestion;
    })
    .filter((question): question is TriviaQuestion => !!question);

  deck.feud = sheetRows("Surveys")
    .map((row, index) => {
      const prompt = cellText(row, "Survey Prompt");
      const answers = [1, 2, 3, 4, 5, 6, 7, 8]
        .map((answerIndex) => {
          const text = cellText(row, `Answer ${answerIndex}`);
          if (!text) return null;
          return {
            text,
            points: Math.max(1, Math.round(cellNumber(row, `Points ${answerIndex}`, Math.max(1, 40 - answerIndex * 5)))),
            aliases: splitList(cellText(row, `Aliases ${answerIndex}`))
          };
        })
        .filter((answer): answer is { text: string; points: number; aliases: string[] } => !!answer);
      if (!prompt || answers.length === 0) return null;
      const question: FeudQuestion = {
        id: `${deck.id}-f${index + 1}`,
        prompt,
        answers
      };
      return question;
    })
    .filter(Boolean) as FeudQuestion[];

  deck.picture = sheetRows("Images")
    .map((row, index) => {
      const answer = cellText(row, "Answer");
      const src = cellText(row, "Image URL");
      const imagePrompt = cellText(row, "AI Image Prompt");
      if (!answer || (!src && !imagePrompt)) return null;
      const item: PictureItem = {
        id: `${deck.id}-p${index + 1}`,
        src,
        answer,
        hint: cellText(row, "Hint"),
        aliases: splitList(cellText(row, "Aliases")),
        imagePrompt,
        imageStatus: src ? "ready" as const : "idle" as const
      };
      return item;
    })
    .filter(Boolean) as PictureItem[];

  deck.wheel = sheetRows("Puzzles")
    .map((row, index) => {
      const text = cellText(row, "Puzzle Phrase").toUpperCase();
      if (!text) return null;
      return {
        id: `${deck.id}-w${index + 1}`,
        category: cellText(row, "Category") || "Custom",
        text
      } satisfies WheelPuzzle;
    })
    .filter((puzzle): puzzle is WheelPuzzle => !!puzzle);

  return deck.prompts.length || deck.trivia.length || deck.feud.length || deck.picture.length || deck.wheel.length ? deck : null;
}

function slugifyFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "hoodwinked-deck";
}

export default function ContentStudioPage() {
  const [decks, setDecks] = useState<CustomContentDeck[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tab, setTab] = useState<Tab>("prompts");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [importMessage, setImportMessage] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect -- initializes editor state from localStorage after mount */
  useEffect(() => {
    const saved = loadCustomContentDecks();
    if (saved.length) {
      setDecks(saved);
      setSelectedId(saved[0].id);
      return;
    }
    const first = emptyCustomContentDeck("Teaching Deck");
    setDecks([first]);
    setSelectedId(first.id);
    saveCustomContentDecks([first]);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const selected = decks.find((deck) => deck.id === selectedId) ?? decks[0];
  const counts = useMemo(() => {
    if (!selected) return null;
    return {
      prompts: selected.prompts.length,
      trivia: selected.trivia.length,
      feud: selected.feud.length,
      picture: selected.picture.length,
      wheel: selected.wheel.length
    };
  }, [selected]);

  const updateDeck = (updater: (deck: CustomContentDeck) => CustomContentDeck) => {
    setDecks((current) => current.map((deck) => (deck.id === selected?.id ? { ...updater(deck), updatedAt: Date.now() } : deck)));
  };

  const saveAll = (nextDecks = decks) => {
    saveCustomContentDecks(nextDecks);
    setSavedAt(Date.now());
  };

  const createDeck = () => {
    const deck = emptyCustomContentDeck("New Deck");
    const next = [...decks, deck];
    setDecks(next);
    setSelectedId(deck.id);
    saveAll(next);
  };

  const deleteDeck = () => {
    if (!selected || decks.length <= 1) return;
    if (!window.confirm(`Delete "${selected.name}"?`)) return;
    const next = decks.filter((deck) => deck.id !== selected.id);
    setDecks(next);
    setSelectedId(next[0]?.id ?? "");
    saveAll(next);
  };

  const useForHosting = () => {
    if (!selected) return;
    saveAll();
    setActiveCustomContentDeck(selected.id);
    setSavedAt(Date.now());
  };

  const exportDeck = () => {
    if (!selected) return;
    const exportable = {
      format: "hoodwinked.custom-content.deck",
      version: 1,
      exportedAt: new Date().toISOString(),
      deck: selected
    };
    downloadTextFile(`${slugifyFilename(selected.name)}-hoodwinked-deck.json`, JSON.stringify(exportable, null, 2));
  };

  const importDeckFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const isWorkbook = /\.(xlsx|xls)$/i.test(file.name);
      let normalized: CustomContentDeck | null;
      if (isWorkbook) {
        normalized = await deckFromWorkbook(file);
      } else {
        const text = await readFileAsText(file);
        const parsed = JSON.parse(text) as unknown;
        const maybeWrapped = parsed && typeof parsed === "object" && "deck" in parsed
          ? (parsed as { deck: unknown }).deck
          : parsed;
        normalized = normalizeCustomContentDeck(maybeWrapped);
      }
      if (!normalized) {
        setImportMessage("That file did not look like a Hoodwinked Deck file or filled Excel template.");
        return;
      }
      const imported = {
        ...normalized,
        id: `${normalized.id}-import-${Date.now().toString(36)}`,
        name: decks.some((deck) => deck.name === normalized.name) ? `${normalized.name} (imported)` : normalized.name,
        updatedAt: Date.now()
      };
      const next = [...decks, imported];
      setDecks(next);
      setSelectedId(imported.id);
      saveAll(next);
      setImportMessage(`Imported "${imported.name}".`);
    } catch {
      setImportMessage("Could not open that file. Choose a Hoodwinked Deck file or filled Excel template from Downloads.");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% 0%, rgba(255,193,94,.12), transparent 34%), linear-gradient(180deg, #254426 0%, #132019 100%)",
        color: C.cream,
        padding: "20px clamp(12px, 3vw, 34px) 60px",
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <Link href="/" style={{ color: C.gold, fontWeight: 900, textDecoration: "none", borderBottom: `1px dotted ${C.gold}` }}>
              Back to lobby
            </Link>
            <h1 style={{ margin: "12px 0 5px", color: C.gold, fontSize: "clamp(30px, 6vw, 58px)", lineHeight: 1, fontVariant: "small-caps" }}>
              Content Studio
            </h1>
            <p style={{ margin: 0, color: C.creamDim, fontWeight: 800, maxWidth: 720, whiteSpace: "nowrap", overflowX: "auto" }}>
              Build custom teaching decks for group games, save them on this device, and use them when hosting.
            </p>
            <p style={{ margin: "8px 0 0", color: C.muted, fontWeight: 800, maxWidth: 760, fontSize: 13, lineHeight: 1.45, whiteSpace: "nowrap", overflowX: "auto" }}>
              Spreadsheet option: download the Excel template, fill in any tabs you need, save it, then use Open from File to turn it into a deck.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button type="button" onClick={createDeck} style={buttonStyle()}>
              New deck
            </button>
            <a href="/templates/hoodwinked-content-template.xlsx" download style={{ ...buttonStyle(), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Download Excel Template
            </a>
            <label style={{ ...buttonStyle(), display: "inline-flex", alignItems: "center", gap: 6 }}>
              Open from File
              <input
                type="file"
                accept=".json,.hoodwinked-deck.json,.xlsx,.xls,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={(event) => {
                  void importDeckFile(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
                style={{ display: "none" }}
              />
            </label>
            <button type="button" onClick={exportDeck} disabled={!selected} style={{ ...buttonStyle(), opacity: selected ? 1 : 0.45 }}>
              Save to File
            </button>
            <button type="button" onClick={() => saveAll()} style={buttonStyle("primary")}>
              Save
            </button>
            <button type="button" onClick={useForHosting} style={buttonStyle("primary")}>
              Use for hosting
            </button>
          </div>
        </header>

        {importMessage && (
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, color: C.creamDim, background: "rgba(9,19,14,.42)", fontWeight: 800, marginBottom: 14 }}>
            {importMessage}
          </div>
        )}

        {selected && (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 14, alignItems: "start" }}>
              <aside style={{ border: `1px solid ${C.line}`, background: "rgba(9,19,14,.38)", borderRadius: 8, padding: 12 }}>
                <label style={{ display: "grid", gap: 6, color: C.muted, fontWeight: 900, fontSize: 12 }}>
                  Deck
                  <select value={selected.id} onChange={(event) => setSelectedId(event.target.value)} style={inputStyle()}>
                    {decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6, color: C.muted, fontWeight: 900, fontSize: 12, marginTop: 12 }}>
                  Name
                  <input value={selected.name} onChange={(event) => updateDeck((deck) => ({ ...deck, name: event.target.value }))} style={inputStyle()} />
                </label>
                <div style={{ display: "grid", gap: 7, marginTop: 14 }}>
                  {TABS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      style={{
                        ...buttonStyle(tab === item.id ? "primary" : "quiet"),
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span>{item.label}</span>
                      <span>{counts?.[item.id] ?? 0}</span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={deleteDeck} disabled={decks.length <= 1} style={{ ...buttonStyle("danger"), width: "100%", marginTop: 14, opacity: decks.length <= 1 ? 0.45 : 1 }}>
                  Delete deck
                </button>
                <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.4, marginTop: 12 }}>
                  {savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : "Changes save when you press Save or Use for hosting."}
                </div>
                <div style={{ color: C.creamDim, fontSize: 12, lineHeight: 1.45, marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                  Save to File downloads a Hoodwinked Deck file, usually to Downloads. Open from File accepts Hoodwinked Deck files or completed Excel templates. Local image attachments are included in deck files, but large images can make them big.
                </div>
              </aside>

              <section style={{ border: `1px solid ${C.line}`, background: "rgba(9,19,14,.32)", borderRadius: 8, padding: "14px clamp(12px, 2vw, 18px)" }}>
                {tab === "prompts" && <PromptsEditor deck={selected} updateDeck={updateDeck} />}
                {tab === "trivia" && <TriviaEditor deck={selected} updateDeck={updateDeck} />}
                {tab === "feud" && <FeudEditor deck={selected} updateDeck={updateDeck} />}
                {tab === "picture" && <PictureEditor deck={selected} updateDeck={updateDeck} />}
                {tab === "wheel" && <WheelEditor deck={selected} updateDeck={updateDeck} />}
              </section>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SectionTitle({ title, action }: { title: string; action: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
      <h2 style={{ margin: 0, color: C.gold, fontSize: "clamp(22px, 4vw, 34px)", lineHeight: 1 }}>{title}</h2>
      {action}
    </div>
  );
}

function HelpBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${C.line}`,
        background: "rgba(111,182,216,.10)",
        color: C.creamDim,
        borderRadius: 8,
        padding: 12,
        fontSize: 13,
        lineHeight: 1.45,
        fontWeight: 800,
        marginBottom: 14
      }}
    >
      {children}
    </div>
  );
}

function PromptsEditor({ deck, updateDeck }: { deck: CustomContentDeck; updateDeck: (updater: (deck: CustomContentDeck) => CustomContentDeck) => void }) {
  return (
    <>
      <SectionTitle
        title="Writing Prompts"
        action={<button type="button" onClick={() => updateDeck((d) => ({ ...d, prompts: [...d.prompts, ""] }))} style={buttonStyle("primary")}>Add prompt</button>}
      />
      <HelpBox>
        Used by The Setup and Two-Faced. Enter open-ended prompts players answer on their phones, like review questions, funny icebreakers, vocabulary checks, or discussion starters.
      </HelpBox>
      <div style={{ display: "grid", gap: 10 }}>
        {deck.prompts.map((prompt, index) => (
          <div key={index} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8 }}>
            <textarea
              value={prompt}
              onChange={(event) => updateDeck((d) => ({ ...d, prompts: d.prompts.map((p, i) => (i === index ? event.target.value : p)) }))}
              placeholder="A discussion prompt, joke prompt, review question..."
              style={inputStyle(true)}
            />
            <button type="button" onClick={() => updateDeck((d) => ({ ...d, prompts: d.prompts.filter((_, i) => i !== index) }))} style={buttonStyle("danger")}>
              Remove
            </button>
          </div>
        ))}
        {deck.prompts.length === 0 && <EmptyState text="Add prompts for The Setup and Two-Faced." />}
      </div>
    </>
  );
}

function TriviaEditor({ deck, updateDeck }: { deck: CustomContentDeck; updateDeck: (updater: (deck: CustomContentDeck) => CustomContentDeck) => void }) {
  return (
    <>
      <SectionTitle
        title="Multiple Choice"
        action={<button type="button" onClick={() => updateDeck((d) => ({ ...d, trivia: [...d.trivia, newTrivia(d.id, d.trivia.length + 1)] }))} style={buttonStyle("primary")}>Add question</button>}
      />
      <HelpBox>
        Used by The Score. Add a question, 2-4 possible answers, and select the correct one. Players score more for answering correctly and quickly.
      </HelpBox>
      <div style={{ display: "grid", gap: 12 }}>
        {deck.trivia.map((question, index) => (
          <div key={question.id} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "160px minmax(0, 1fr)", gap: 8, marginBottom: 8 }}>
              <input value={question.category} onChange={(event) => updateDeck((d) => ({ ...d, trivia: d.trivia.map((q) => (q.id === question.id ? { ...q, category: event.target.value } : q)) }))} placeholder="Category" style={inputStyle()} />
              <input value={question.text} onChange={(event) => updateDeck((d) => ({ ...d, trivia: d.trivia.map((q) => (q.id === question.id ? { ...q, text: event.target.value } : q)) }))} placeholder="Question" style={inputStyle()} />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {question.choices.map((choice, choiceIndex) => (
                <label key={choiceIndex} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 8, alignItems: "center", color: C.muted, fontSize: 12, fontWeight: 900 }}>
                  <input
                    type="radio"
                    checked={question.correctIndex === choiceIndex}
                    onChange={() => updateDeck((d) => ({ ...d, trivia: d.trivia.map((q) => (q.id === question.id ? { ...q, correctIndex: choiceIndex } : q)) }))}
                  />
                  <input value={choice} onChange={(event) => updateDeck((d) => ({ ...d, trivia: d.trivia.map((q) => (q.id === question.id ? { ...q, choices: q.choices.map((c, i) => (i === choiceIndex ? event.target.value : c)) } : q)) }))} placeholder={`Answer ${choiceIndex + 1}`} style={inputStyle()} />
                </label>
              ))}
            </div>
            <button type="button" onClick={() => updateDeck((d) => ({ ...d, trivia: d.trivia.filter((_, i) => i !== index) }))} style={{ ...buttonStyle("danger"), marginTop: 8 }}>
              Remove question
            </button>
          </div>
        ))}
        {deck.trivia.length === 0 && <EmptyState text="Add multiple-choice questions for The Score." />}
      </div>
    </>
  );
}

function FeudEditor({ deck, updateDeck }: { deck: CustomContentDeck; updateDeck: (updater: (deck: CustomContentDeck) => CustomContentDeck) => void }) {
  return (
    <>
      <SectionTitle
        title="Survey Questions"
        action={<button type="button" onClick={() => updateDeck((d) => ({ ...d, feud: [...d.feud, newFeud(d.id, d.feud.length + 1)] }))} style={buttonStyle("primary")}>Add survey</button>}
      />
      <HelpBox>
        Used by The Usual Suspects. Write a survey-style prompt and the accepted answers. Points decide how valuable each answer is. Aliases are alternate spellings or phrases that should count as the same answer.
      </HelpBox>
      <div style={{ display: "grid", gap: 12 }}>
        {deck.feud.map((question, index) => (
          <div key={question.id} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
            <input value={question.prompt} onChange={(event) => updateDeck((d) => ({ ...d, feud: d.feud.map((q) => (q.id === question.id ? { ...q, prompt: event.target.value } : q)) }))} placeholder="Survey prompt" style={inputStyle()} />
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {question.answers.map((answer, answerIndex) => (
                <div key={answerIndex} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                  <input value={answer.text} onChange={(event) => updateDeck((d) => ({ ...d, feud: d.feud.map((q) => (q.id === question.id ? { ...q, answers: q.answers.map((a, i) => (i === answerIndex ? { ...a, text: event.target.value } : a)) } : q)) }))} placeholder={`Answer ${answerIndex + 1}`} style={inputStyle()} />
                  <input type="number" value={answer.points} onChange={(event) => updateDeck((d) => ({ ...d, feud: d.feud.map((q) => (q.id === question.id ? { ...q, answers: q.answers.map((a, i) => (i === answerIndex ? { ...a, points: Number(event.target.value) || 1 } : a)) } : q)) }))} style={inputStyle()} />
                  <input value={joinList(answer.aliases)} onChange={(event) => updateDeck((d) => ({ ...d, feud: d.feud.map((q) => (q.id === question.id ? { ...q, answers: q.answers.map((a, i) => (i === answerIndex ? { ...a, aliases: splitList(event.target.value) } : a)) } : q)) }))} placeholder="Aliases" style={inputStyle()} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => updateDeck((d) => ({ ...d, feud: d.feud.map((q) => (q.id === question.id ? { ...q, answers: [...q.answers, { text: "", points: 5, aliases: [] }] } : q)) }))} style={buttonStyle()}>
                Add answer
              </button>
              <button type="button" onClick={() => updateDeck((d) => ({ ...d, feud: d.feud.filter((_, i) => i !== index) }))} style={buttonStyle("danger")}>
                Remove survey
              </button>
            </div>
          </div>
        ))}
        {deck.feud.length === 0 && <EmptyState text="Add survey questions for The Usual Suspects." />}
      </div>
    </>
  );
}

function PictureEditor({ deck, updateDeck }: { deck: CustomContentDeck; updateDeck: (updater: (deck: CustomContentDeck) => CustomContentDeck) => void }) {
  const attachFile = async (itemId: string, file: File | undefined) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    updateDeck((d) => ({
      ...d,
      picture: d.picture.map((p) =>
        p.id === itemId ? { ...p, src: dataUrl, imageStatus: "ready" as const } : p
      )
    }));
  };

  return (
    <>
      <SectionTitle
        title="Image Reveal"
        action={<button type="button" onClick={() => updateDeck((d) => ({ ...d, picture: [...d.picture, newPicture(d.id, d.picture.length + 1)] }))} style={buttonStyle("primary")}>Add image item</button>}
      />
      <HelpBox>
        Used by Now You See Me. Add the answer players should guess, optional hints/aliases, and either paste an image URL, choose an image from this device, or describe an AI image to generate. Local files are saved only in this browser.
      </HelpBox>
      <div style={{ display: "grid", gap: 12 }}>
        {deck.picture.map((item, index) => (
          <div key={item.id} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12, display: "grid", gap: 8 }}>
            <input value={item.answer} onChange={(event) => updateDeck((d) => ({ ...d, picture: d.picture.map((p) => (p.id === item.id ? { ...p, answer: event.target.value } : p)) }))} placeholder="Answer" style={inputStyle()} />
            <input value={item.hint ?? ""} onChange={(event) => updateDeck((d) => ({ ...d, picture: d.picture.map((p) => (p.id === item.id ? { ...p, hint: event.target.value } : p)) }))} placeholder="Hint" style={inputStyle()} />
            <input value={joinList(item.aliases)} onChange={(event) => updateDeck((d) => ({ ...d, picture: d.picture.map((p) => (p.id === item.id ? { ...p, aliases: splitList(event.target.value) } : p)) }))} placeholder="Aliases" style={inputStyle()} />
            <label style={{ display: "grid", gap: 6, color: C.muted, fontWeight: 900, fontSize: 12 }}>
              Image URL
              <input
                value={(item.src && !item.src.startsWith("data:")) ? item.src : ""}
                onChange={(event) => updateDeck((d) => ({
                  ...d,
                  picture: d.picture.map((p) => (p.id === item.id ? { ...p, src: event.target.value, imageStatus: event.target.value ? "ready" as const : "idle" as const } : p))
                }))}
                placeholder="https://example.com/image.jpg"
                style={inputStyle()}
              />
            </label>
            <label style={{ display: "grid", gap: 6, color: C.muted, fontWeight: 900, fontSize: 12 }}>
              Local image file
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  void attachFile(item.id, event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
                style={{
                  ...inputStyle(),
                  colorScheme: "dark"
                }}
              />
            </label>
            {item.src && (
              <div style={{ display: "grid", gridTemplateColumns: "88px minmax(0, 1fr) auto", gap: 10, alignItems: "center", color: C.creamDim, fontSize: 12, fontWeight: 800 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt="" style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 7, border: `1px solid ${C.line}` }} />
                <span>{item.src.startsWith("data:") ? "Local file attached and saved in this browser." : "Linked image will load from the pasted URL."}</span>
                <button
                  type="button"
                  onClick={() => updateDeck((d) => ({ ...d, picture: d.picture.map((p) => (p.id === item.id ? { ...p, src: "", imageStatus: "idle" as const } : p)) }))}
                  style={buttonStyle("danger")}
                >
                  Clear
                </button>
              </div>
            )}
            <label style={{ display: "grid", gap: 6, color: C.muted, fontWeight: 900, fontSize: 12 }}>
              AI image prompt
              <textarea value={item.imagePrompt ?? ""} onChange={(event) => updateDeck((d) => ({ ...d, picture: d.picture.map((p) => (p.id === item.id ? { ...p, imagePrompt: event.target.value } : p)) }))} placeholder="If no URL/file is attached, describe the image to generate." style={inputStyle(true)} />
            </label>
            <button type="button" onClick={() => updateDeck((d) => ({ ...d, picture: d.picture.filter((_, i) => i !== index) }))} style={buttonStyle("danger")}>
              Remove image item
            </button>
          </div>
        ))}
        {deck.picture.length === 0 && <EmptyState text="Add answer/image prompts for Now You See Me." />}
      </div>
    </>
  );
}

function WheelEditor({ deck, updateDeck }: { deck: CustomContentDeck; updateDeck: (updater: (deck: CustomContentDeck) => CustomContentDeck) => void }) {
  return (
    <>
      <SectionTitle
        title="Letter Puzzles"
        action={<button type="button" onClick={() => updateDeck((d) => ({ ...d, wheel: [...d.wheel, newWheel(d.id, d.wheel.length + 1)] }))} style={buttonStyle("primary")}>Add puzzle</button>}
      />
      <HelpBox>
        Used by Letter Heist. Add a short phrase players can solve one letter at a time. Categories help players know the kind of answer: Person, Place, Phrase, Key Term, Chapter Title, and so on.
      </HelpBox>
      <div style={{ display: "grid", gap: 10 }}>
        {deck.wheel.map((puzzle, index) => (
          <div key={puzzle.id} style={{ display: "grid", gridTemplateColumns: "160px minmax(0, 1fr) auto", gap: 8 }}>
            <input value={puzzle.category} onChange={(event) => updateDeck((d) => ({ ...d, wheel: d.wheel.map((p) => (p.id === puzzle.id ? { ...p, category: event.target.value } : p)) }))} placeholder="Category" style={inputStyle()} />
            <input value={puzzle.text} onChange={(event) => updateDeck((d) => ({ ...d, wheel: d.wheel.map((p) => (p.id === puzzle.id ? { ...p, text: event.target.value.toUpperCase() } : p)) }))} placeholder="Puzzle phrase" style={inputStyle()} />
            <button type="button" onClick={() => updateDeck((d) => ({ ...d, wheel: d.wheel.filter((_, i) => i !== index) }))} style={buttonStyle("danger")}>
              Remove
            </button>
          </div>
        ))}
        {deck.wheel.length === 0 && <EmptyState text="Add puzzle phrases for Letter Heist." />}
      </div>
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ border: `1px dashed ${C.line}`, borderRadius: 8, padding: 18, color: C.muted, fontWeight: 800, textAlign: "center" }}>
      {text}
    </div>
  );
}
