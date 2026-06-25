"use client";

import { useMemo, useState } from "react";

type Difficulty = "easy" | "medium" | "hard";
type Owner = "player" | "ai";
type PieceType = "alibi" | "informant";
type Shot = "hit" | "miss";
type Status = "setup" | "playing" | "won" | "lost";

type PieceSpec = {
  type: PieceType;
  size: number;
  name: string;
};

type Piece = PieceSpec & {
  id: string;
  cells: number[];
  hits: number[];
};

type Cell = {
  pieceId?: string;
  pieceType?: PieceType;
  shot?: Shot;
};

type GameState = {
  status: Status;
  difficulty: Difficulty;
  playerGrid: Cell[];
  aiGrid: Cell[];
  playerPieces: Piece[];
  aiPieces: Piece[];
  playerShots: Set<number>;
  aiShots: Set<number>;
  huntQueue: number[];
  message: string;
  turn: Owner;
};

const SIZE = 10;
const CELL_COUNT = SIZE * SIZE;
const PIECES: PieceSpec[] = [
  { type: "alibi", size: 5, name: "Front Desk Alibi" },
  { type: "alibi", size: 4, name: "Holding Cell Alibi" },
  { type: "informant", size: 3, name: "Locker Room Informant" },
  { type: "informant", size: 3, name: "Records Room Informant" },
  { type: "informant", size: 2, name: "Back Stair Informant" }
];

const C = {
  bg: "#132019",
  panel: "#1f3320",
  panel2: "#2f5632",
  cream: "#fbf3e4",
  muted: "#d9d2bd",
  gold: "#ffc15e",
  line: "#81a475",
  alibi: "#936f31",
  informant: "#3d7d68",
  hit: "#cf4f45",
  miss: "#9dc7e8",
  dark: "#09130e"
};

function emptyGrid(): Cell[] {
  return Array.from({ length: CELL_COUNT }, () => ({}));
}

function row(index: number) {
  return Math.floor(index / SIZE);
}

function col(index: number) {
  return index % SIZE;
}

function cellIndex(r: number, c: number) {
  return r * SIZE + c;
}

function neighbors(index: number) {
  const r = row(index);
  const c = col(index);
  return [
    r > 0 ? cellIndex(r - 1, c) : null,
    r < SIZE - 1 ? cellIndex(r + 1, c) : null,
    c > 0 ? cellIndex(r, c - 1) : null,
    c < SIZE - 1 ? cellIndex(r, c + 1) : null
  ].filter((value): value is number => value != null);
}

function canPlace(grid: Cell[], start: number, length: number, horizontal: boolean) {
  const r = row(start);
  const c = col(start);
  if (horizontal && c + length > SIZE) return false;
  if (!horizontal && r + length > SIZE) return false;

  for (let i = 0; i < length; i += 1) {
    const idx = horizontal ? cellIndex(r, c + i) : cellIndex(r + i, c);
    if (grid[idx].pieceId) return false;
  }
  return true;
}

function placePieces(owner: Owner) {
  const grid = emptyGrid();
  const pieces: Piece[] = [];

  PIECES.forEach((spec, pieceIndex) => {
    let placed = false;
    let guard = 0;
    while (!placed && guard < 1000) {
      guard += 1;
      const start = Math.floor(Math.random() * CELL_COUNT);
      const horizontal = Math.random() > 0.5;
      if (!canPlace(grid, start, spec.size, horizontal)) continue;

      const id = `${owner}-${pieceIndex}-${spec.type}`;
      const cells = Array.from({ length: spec.size }, (_, i) => {
        const r = row(start);
        const c = col(start);
        return horizontal ? cellIndex(r, c + i) : cellIndex(r + i, c);
      });
      cells.forEach((idx) => {
        grid[idx] = { pieceId: id, pieceType: spec.type };
      });
      pieces.push({ ...spec, id, cells, hits: [] });
      placed = true;
    }
  });

  return { grid, pieces };
}

function newGame(difficulty: Difficulty): GameState {
  const player = placePieces("player");
  const ai = placePieces("ai");
  return {
    status: "playing",
    difficulty,
    playerGrid: player.grid,
    aiGrid: ai.grid,
    playerPieces: player.pieces,
    aiPieces: ai.pieces,
    playerShots: new Set(),
    aiShots: new Set(),
    huntQueue: [],
    message: "The precinct map is live. Choose a room on the rival station board.",
    turn: "player"
  };
}

function remainingPieces(pieces: Piece[]) {
  return pieces.filter((piece) => piece.hits.length < piece.cells.length);
}

function hitPiece(pieces: Piece[], pieceId: string, target: number) {
  return pieces.map((piece) =>
    piece.id === pieceId && !piece.hits.includes(target)
      ? { ...piece, hits: [...piece.hits, target] }
      : piece
  );
}

function resultLabel(cell: Cell) {
  if (!cell.pieceType) return "Miss";
  return cell.pieceType === "alibi" ? "Found Alibi" : "Found Informant";
}

function parityCandidates(shots: Set<number>) {
  const parity = Array.from({ length: CELL_COUNT }, (_, i) => i).filter((i) => (row(i) + col(i)) % 2 === 0 && !shots.has(i));
  return parity.length ? parity : Array.from({ length: CELL_COUNT }, (_, i) => i).filter((i) => !shots.has(i));
}

function chooseAiTarget(state: GameState) {
  const available = Array.from({ length: CELL_COUNT }, (_, i) => i).filter((i) => !state.aiShots.has(i));
  const queued = state.huntQueue.filter((idx) => !state.aiShots.has(idx));

  if (state.difficulty === "easy") return available[Math.floor(Math.random() * available.length)];
  if (state.difficulty === "medium" && queued.length) return queued[0];
  if (state.difficulty === "medium") return available[Math.floor(Math.random() * available.length)];

  if (queued.length) return queued[0];
  const patterned = parityCandidates(state.aiShots);
  return patterned[Math.floor(Math.random() * patterned.length)];
}

function fireAtGrid(grid: Cell[], target: number) {
  const cell = grid[target];
  const shot: Shot = cell.pieceId ? "hit" : "miss";
  const nextGrid = grid.map((value, i) => (i === target ? { ...value, shot } : value));
  return { nextGrid, shot, cell };
}

function SafesGrid({
  title,
  grid,
  owner,
  status,
  onTarget
}: {
  title: string;
  grid: Cell[];
  owner: Owner;
  status: Status;
  onTarget?: (index: number) => void;
}) {
  return (
    <section>
      <h3 style={{ margin: "0 0 10px", color: C.cream, fontSize: 18 }}>{title}</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${SIZE}, minmax(26px, 40px))`,
          gap: 3,
          padding: 8,
          borderRadius: 8,
          background: "rgba(9,19,14,.72)",
          border: `1px solid ${C.line}`,
          width: "fit-content",
          maxWidth: "100%"
        }}
      >
        {grid.map((cell, index) => {
          const revealPiece = owner === "player" || cell.shot === "hit" || status !== "playing";
          const clickable = owner === "ai" && status === "playing" && !cell.shot;
          const base = revealPiece && cell.pieceType === "alibi" ? C.alibi : revealPiece && cell.pieceType === "informant" ? C.informant : "#8c9388";
          const background = cell.shot === "hit" ? C.hit : cell.shot === "miss" ? C.miss : base;
          return (
            <button
              key={index}
              onClick={() => clickable && onTarget?.(index)}
              disabled={!clickable}
              aria-label={`${title} cell ${row(index) + 1}-${col(index) + 1}`}
              style={{
                width: "clamp(26px, 7.6vw, 40px)",
                height: "clamp(26px, 7.6vw, 40px)",
                border: "1px solid rgba(255,255,255,.16)",
                borderRadius: 4,
                background,
                color: cell.shot === "hit" ? "#fff" : C.dark,
                fontWeight: 900,
                cursor: clickable ? "crosshair" : "default",
                display: "grid",
                placeItems: "center",
                boxShadow: cell.shot === "hit" ? "inset 0 0 0 2px rgba(0,0,0,.26)" : "none",
                animation: cell.shot === "hit" ? "solo-board-hit 320ms ease" : cell.shot === "miss" ? "solo-board-miss 420ms ease" : "none",
                fontSize: cell.shot === "miss" ? 9 : 14
              }}
            >
              {cell.shot === "hit" ? "X" : cell.shot === "miss" ? "•" : ""}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PieceList({ title, pieces }: { title: string; pieces: Piece[] }) {
  const left = remainingPieces(pieces);
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
      <div style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12 }}>{title}</div>
      <div style={{ color: C.cream, fontSize: 24, fontWeight: 900, margin: "4px 0" }}>
        {left.length} / {pieces.length}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {pieces.map((piece) => {
          const sunk = piece.hits.length >= piece.cells.length;
          return (
            <span
              key={piece.id}
              style={{
                color: sunk ? "#9b9b9b" : C.cream,
                background: piece.type === "alibi" ? `${C.alibi}66` : `${C.informant}66`,
                border: `1px solid ${sunk ? "#555" : piece.type === "alibi" ? C.alibi : C.informant}`,
                borderRadius: 999,
                padding: "4px 8px",
                fontSize: 11,
                fontWeight: 800,
                textDecoration: sunk ? "line-through" : "none"
              }}
            >
              {piece.size} {piece.type}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function SafesAndEvidence() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [game, setGame] = useState<GameState | null>(null);
  const status = game?.status ?? "setup";

  const legend = useMemo(
    () => [
      { label: "Alibi", color: C.alibi },
      { label: "Informant", color: C.informant },
      { label: "Hit", color: C.hit },
      { label: "Miss", color: C.miss }
    ],
    []
  );

  const start = () => setGame(newGame(difficulty));

  const playerFire = (target: number) => {
    setGame((current) => {
      if (!current || current.status !== "playing" || current.turn !== "player" || current.aiGrid[target].shot) return current;

      const playerShots = new Set(current.playerShots).add(target);
      const playerResult = fireAtGrid(current.aiGrid, target);
      const aiPieces = playerResult.cell.pieceId
        ? hitPiece(current.aiPieces, playerResult.cell.pieceId, target)
        : current.aiPieces;
      if (remainingPieces(aiPieces).length === 0) {
        return {
          ...current,
          aiGrid: playerResult.nextGrid,
          aiPieces,
          playerShots,
          status: "won",
          turn: "player",
          message: `${resultLabel(playerResult.cell)}. You cracked the case.`
        };
      }

      const afterPlayer = {
        ...current,
        aiGrid: playerResult.nextGrid,
        aiPieces,
        playerShots,
        turn: "ai" as Owner,
        message: `${resultLabel(playerResult.cell)}. AI is searching your board...`
      };

      const aiTarget = chooseAiTarget(afterPlayer);
      const aiShots = new Set(afterPlayer.aiShots).add(aiTarget);
      const aiResult = fireAtGrid(afterPlayer.playerGrid, aiTarget);
      const playerPieces = aiResult.cell.pieceId
        ? hitPiece(afterPlayer.playerPieces, aiResult.cell.pieceId, aiTarget)
        : afterPlayer.playerPieces;
      const queueBoost = aiResult.shot === "hit" ? neighbors(aiTarget).filter((idx) => !aiShots.has(idx)) : [];
      const huntQueue = [...afterPlayer.huntQueue.filter((idx) => !aiShots.has(idx) && idx !== aiTarget), ...queueBoost];

      if (remainingPieces(playerPieces).length === 0) {
        return {
          ...afterPlayer,
          playerGrid: aiResult.nextGrid,
          playerPieces,
          aiShots,
          huntQueue,
          status: "lost",
          turn: "ai",
          message: `AI found your ${aiResult.cell.pieceType}. Case lost.`
        };
      }

      return {
        ...afterPlayer,
        playerGrid: aiResult.nextGrid,
        playerPieces,
        aiShots,
        huntQueue,
        turn: "player",
        message: `${resultLabel(playerResult.cell)}. AI fired ${String.fromCharCode(65 + col(aiTarget))}${row(aiTarget) + 1}: ${resultLabel(aiResult.cell)}.`
      };
    });
  };

  return (
    <section
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        background: "linear-gradient(180deg, rgba(31,51,32,.96), rgba(9,19,14,.78))",
        padding: "clamp(14px, 3vw, 24px)",
        boxShadow: "0 20px 48px rgba(0,0,0,.32)"
      }}
    >
      <style>{`
        @keyframes solo-board-hit {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          50% { transform: translateX(3px); }
          75% { transform: translateX(-2px); }
        }
        @keyframes solo-board-miss {
          0% { opacity: .35; transform: scale(.82); filter: blur(2px); }
          45% { opacity: 1; transform: scale(1.08); filter: blur(0); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ color: C.gold, fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>PLAYABLE SOLO CASE</div>
          <h2 style={{ margin: "6px 0", color: C.cream, fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1 }}>
            Alibis & Informants
          </h2>
          <p style={{ color: C.muted, margin: 0, maxWidth: 680, lineHeight: 1.5 }}>
            The station is crawling with jailhouse whispers, planted files, and suspects who swear they were nowhere near the scene. Your crew has hidden groups of alibis and informants through the precinct map; sweep the rival station first, expose their story, and keep your own witnesses from getting rolled up.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {(["easy", "medium", "hard"] as Difficulty[]).map((value) => (
            <button
              key={value}
              onClick={() => status === "setup" && setDifficulty(value)}
              disabled={status !== "setup"}
              style={{
                border: `1px solid ${difficulty === value ? C.gold : C.line}`,
                background: difficulty === value ? `${C.gold}22` : "rgba(9,19,14,.5)",
                color: difficulty === value ? C.gold : C.cream,
                borderRadius: 8,
                padding: "10px 12px",
                fontWeight: 900,
                cursor: status === "setup" ? "pointer" : "default",
                textTransform: "capitalize"
              }}
            >
              {value}
            </button>
          ))}
          <button
            onClick={start}
            style={{
              border: `1px solid ${C.gold}`,
              background: `linear-gradient(180deg, ${C.gold}, #dca33d)`,
              color: C.dark,
              borderRadius: 8,
              padding: "10px 16px",
              fontWeight: 900,
              cursor: "pointer"
            }}
          >
            {status === "setup" ? "Start case" : "New case"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {legend.map((item) => (
          <span key={item.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 12, fontWeight: 800 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: item.color, border: "1px solid rgba(255,255,255,.22)" }} />
            {item.label}
          </span>
        ))}
      </div>

      {!game ? (
        <div style={{ color: C.muted, padding: "34px 0", fontWeight: 800 }}>
          Pick a difficulty and start the case. Pieces will be placed automatically for this first version.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginBottom: 16
            }}
          >
            <PieceList title="Your pieces remaining" pieces={game.playerPieces} />
            <PieceList title="AI pieces remaining" pieces={game.aiPieces} />
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.55)" }}>
              <div style={{ color: C.gold, fontWeight: 900, letterSpacing: 1.3, fontSize: 12 }}>STATUS</div>
              <div style={{ color: game.status === "won" ? C.gold : game.status === "lost" ? C.hit : C.cream, fontWeight: 900, fontSize: 18, marginTop: 8 }}>
                {game.status === "won" ? "You win" : game.status === "lost" ? "AI wins" : "Your turn"}
              </div>
              <p style={{ color: C.muted, margin: "6px 0 0", lineHeight: 1.4 }}>{game.message}</p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
              gap: 20,
              alignItems: "start"
            }}
          >
            <SafesGrid title="Your Precinct Map" grid={game.playerGrid} owner="player" status={game.status} />
            <SafesGrid title="Rival Station Map" grid={game.aiGrid} owner="ai" status={game.status} onTarget={playerFire} />
          </div>
        </>
      )}
    </section>
  );
}
