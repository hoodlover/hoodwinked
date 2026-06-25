"use client";

import { useMemo, useState } from "react";

const SIZE = 10;
const CELL_COUNT = SIZE * SIZE;

const DIFFICULTIES = {
  easy: { label: "Easy", clues: 4, traps: 2 },
  medium: { label: "Medium", clues: 6, traps: 4 },
  hard: { label: "Hard", clues: 7, traps: 5 }
};

const C = {
  dark: "#09130e",
  cream: "#fbf3e4",
  muted: "#d9d2bd",
  gold: "#ffc15e",
  line: "#81a475",
  safe: "#d8e5cc",
  clue: "#ffc15e",
  trap: "#cf4f45",
  tile: "#8c9388",
  tileDark: "#5d665b",
  green: "#6fb071",
  blue: "#6fb6d8"
};

const NUMBER_COLORS = {
  1: "#6fb6d8",
  2: "#6fb071",
  3: "#ffc15e",
  4: "#cf4f45",
  5: "#f07a70",
  6: "#d69af2",
  7: "#fbf3e4",
  8: "#ffffff"
};

const CLUE_ICONS = ["/the_sweep/clue+1.webp", "/the_sweep/clue_2.webp", "/the_sweep/clue-3.webp"];
const TRAP_ICONS = ["/the_sweep/trap_1.webp", "/the_sweep/trap2.webp"];

function row(index) {
  return Math.floor(index / SIZE);
}

function col(index) {
  return index % SIZE;
}

function cellIndex(r, c) {
  return r * SIZE + c;
}

function neighbors(index) {
  const r = row(index);
  const c = col(index);
  const result = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) result.push(cellIndex(nr, nc));
    }
  }
  return result;
}

function sampleCells(count, excluded = new Set()) {
  const cells = Array.from({ length: CELL_COUNT }, (_, index) => index).filter((index) => !excluded.has(index));
  for (let i = cells.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells.slice(0, count);
}

function createBoard(difficulty, safeStart = null) {
  const settings = DIFFICULTIES[difficulty];
  const excluded = new Set();
  if (safeStart != null) {
    excluded.add(safeStart);
    neighbors(safeStart).forEach((index) => excluded.add(index));
  }
  const traps = new Set(sampleCells(settings.traps, excluded));
  const clues = new Set(sampleCells(settings.clues, traps));

  return Array.from({ length: CELL_COUNT }, (_, index) => ({
    index,
    trap: traps.has(index),
    clue: clues.has(index),
    nearbyTraps: neighbors(index).filter((neighbor) => traps.has(neighbor)).length,
    revealed: false,
    flagged: false
  }));
}

function createGame(difficulty) {
  return {
    difficulty,
    board: createBoard(difficulty),
    firstMove: true,
    status: "playing",
    message: "First click is safe. Start anywhere on the board.",
    lastRevealed: null
  };
}

function revealFrom(board, startIndex) {
  const next = board.map((tile) => ({ ...tile }));
  const queue = [startIndex];
  const seen = new Set();

  while (queue.length) {
    const index = queue.shift();
    if (seen.has(index)) continue;
    seen.add(index);

    const tile = next[index];
    if (tile.revealed || tile.flagged || tile.trap) continue;
    tile.revealed = true;

    if (tile.nearbyTraps === 0 && !tile.clue) {
      neighbors(index).forEach((neighbor) => {
        const neighborTile = next[neighbor];
        if (!neighborTile.revealed && !neighborTile.flagged && !neighborTile.trap) queue.push(neighbor);
      });
    }
  }

  return next;
}

function revealedClues(board) {
  return board.filter((tile) => tile.clue && tile.revealed).length;
}

function Tile({ tile, disabled, onReveal, onFlag }) {
  const number = tile.revealed && !tile.trap && tile.nearbyTraps > 0 ? tile.nearbyTraps : "";
  const showTrap = tile.revealed && tile.trap;
  const showClue = tile.revealed && tile.clue && !tile.trap;
  const image = showTrap ? TRAP_ICONS[tile.index % TRAP_ICONS.length] : showClue ? CLUE_ICONS[tile.index % CLUE_ICONS.length] : null;

  return (
    <button
      type="button"
      onClick={onReveal}
      onContextMenu={onFlag}
      disabled={disabled}
      aria-label={`Tile ${row(tile.index) + 1}-${col(tile.index) + 1}${tile.flagged ? " flagged" : ""}`}
      style={{
        width: "clamp(30px, 8.4vw, 40px)",
        height: "clamp(30px, 8.4vw, 40px)",
        borderRadius: 5,
        border: tile.revealed ? "1px solid rgba(9,19,14,.18)" : "1px solid rgba(255,255,255,.18)",
        background: tile.revealed
          ? showTrap
            ? "linear-gradient(180deg, #55201d, #220d0b)"
            : showClue
              ? "linear-gradient(180deg, #fff1b8, #ffc15e)"
              : "linear-gradient(180deg, #d8e5cc, #b8c8ac)"
          : "linear-gradient(180deg, #9ba49a, #5d665b)",
        color: showTrap ? "#ffd2ce" : showClue ? C.dark : number ? NUMBER_COLORS[number] : C.dark,
        fontWeight: 900,
        fontSize: showTrap ? 18 : 16,
        cursor: disabled || tile.revealed ? "default" : "pointer",
        boxShadow: tile.revealed ? "inset 0 2px 8px rgba(0,0,0,.18)" : "0 5px 0 #3f473e, 0 10px 18px rgba(0,0,0,.24)",
        transform: tile.revealed ? "translateY(3px)" : "translateY(0)",
        transition: "transform 120ms ease, box-shadow 120ms ease, background 160ms ease"
      }}
    >
      {image ? (
        <span style={{ position: "relative", display: "grid", placeItems: "center", width: "100%", height: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" aria-hidden="true" style={{ width: "82%", height: "82%", objectFit: "contain" }} />
          {showClue && number && (
            <span
              style={{
                position: "absolute",
                right: 0,
                bottom: -1,
                minWidth: 15,
                height: 15,
                borderRadius: 999,
                background: C.dark,
                color: NUMBER_COLORS[number],
                fontSize: 10,
                lineHeight: "15px",
                border: "1px solid rgba(255,255,255,.35)"
              }}
            >
              {number}
            </span>
          )}
        </span>
      ) : tile.flagged && !tile.revealed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/the_sweep/marker_flag.webp" alt="Flagged" style={{ width: "76%", height: "76%", objectFit: "contain" }} />
      ) : number}
    </button>
  );
}

export default function TheSweep() {
  const [difficulty, setDifficulty] = useState("medium");
  const [game, setGame] = useState(null);

  const settings = DIFFICULTIES[difficulty];
  const stats = useMemo(() => {
    const board = game?.board ?? [];
    return {
      cluesFound: revealedClues(board),
      flags: board.filter((tile) => tile.flagged && !tile.revealed).length,
      revealed: board.filter((tile) => tile.revealed).length
    };
  }, [game?.board]);

  const start = (chosenDifficulty = difficulty) => {
    setDifficulty(chosenDifficulty);
    setGame(createGame(chosenDifficulty));
  };

  const revealTile = (index) => {
    setGame((current) => {
      if (!current || current.status !== "playing") return current;
      const activeBoard = current.firstMove ? createBoard(current.difficulty, index) : current.board;
      const tile = activeBoard[index];
      if (tile.flagged) return current;
      if (tile.revealed) {
        if (tile.nearbyTraps <= 0) return current;
        const around = neighbors(index);
        const flagCount = around.filter((neighbor) => activeBoard[neighbor].flagged).length;
        if (flagCount !== tile.nearbyTraps) return current;
        let board = activeBoard;
        around.filter((neighbor) => !board[neighbor].flagged && !board[neighbor].revealed).forEach((neighbor) => {
          board = revealFrom(board, neighbor);
        });
        const cluesFound = revealedClues(board);
        const won = cluesFound >= DIFFICULTIES[current.difficulty].clues;
        return {
          ...current,
          board: won ? board.map((value) => ({ ...value, revealed: value.revealed || value.trap })) : board,
          status: won ? "won" : "playing",
          message: won ? "All genuine clues recovered. You win!" : "Cleared the unflagged neighbors."
        };
      }

      if (tile.trap) {
        const board = activeBoard.map((value, i) => ({
          ...value,
          revealed: value.revealed || value.trap || i === index
        }));
        return {
          ...current,
          board,
          firstMove: false,
          status: "lost",
          lastRevealed: index,
          message: "Red herring hit. The sweep is blown."
        };
      }

      const board = revealFrom(activeBoard, index);
      const cluesFound = revealedClues(board);
      const won = cluesFound >= DIFFICULTIES[current.difficulty].clues;

      return {
        ...current,
        firstMove: false,
        board: won ? board.map((value) => ({ ...value, revealed: value.revealed || value.trap })) : board,
        status: won ? "won" : "playing",
        lastRevealed: index,
        message: won ? "All genuine clues recovered. You win!" : tile.clue ? "Genuine clue found." : "Safe evidence sweep."
      };
    });
  };

  const flagTile = (event, index) => {
    event.preventDefault();
    setGame((current) => {
      if (!current || current.status !== "playing") return current;
      const tile = current.board[index];
      if (tile.revealed) return current;
      return {
        ...current,
        board: current.board.map((value, i) => (i === index ? { ...value, flagged: !value.flagged } : value))
      };
    });
  };

  const canPickDifficulty = !game || game.status !== "playing";

  return (
    <section
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        background: "linear-gradient(180deg, rgba(31,51,32,.96), rgba(9,19,14,.78))",
        padding: "clamp(14px, 3vw, 24px)",
        boxShadow: "0 20px 48px rgba(0,0,0,.32)",
        marginTop: 24
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", maxWidth: 900 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/the_sweep/the-sweep.webp"
            alt=""
            aria-hidden="true"
            style={{ width: "clamp(82px, 13vw, 132px)", height: "auto", borderRadius: 8, filter: "drop-shadow(0 12px 22px rgba(0,0,0,.42))", flex: "0 0 auto" }}
          />
          <div>
          <div style={{ color: C.gold, fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>PLAYABLE SOLO CASE</div>
          <h2 style={{ margin: "6px 0", color: C.cream, fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1 }}>
            The Sweep
          </h2>
          <p style={{ color: C.muted, margin: 0, maxWidth: 680, lineHeight: 1.5 }}>
            The precinct evidence room has been salted with red herrings. Your first sweep is safe; after that, use the numbers to deduce which neighboring tiles hide traps and which ones can be cleared.
          </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {Object.entries(DIFFICULTIES).map(([value, item]) => (
            <button
              key={value}
              type="button"
              onClick={() => canPickDifficulty && setDifficulty(value)}
              disabled={!canPickDifficulty}
              style={{
                border: `1px solid ${difficulty === value ? C.gold : C.line}`,
                background: difficulty === value ? `${C.gold}22` : "rgba(9,19,14,.5)",
                color: difficulty === value ? C.gold : C.cream,
                borderRadius: 8,
                padding: "10px 12px",
                fontWeight: 900,
                cursor: canPickDifficulty ? "pointer" : "default"
              }}
            >
              {item.label}
            </button>
          ))}
          <button type="button" onClick={() => start(difficulty)} style={primaryButton(true)}>
            {game ? "Replay" : "Start sweep"}
          </button>
        </div>
      </div>

      <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, background: "rgba(9,19,14,.45)", color: C.muted, fontWeight: 800, lineHeight: 1.45, marginBottom: 16 }}>
        How to play: left-click any tile to start safely. A number shows how many traps touch that tile, including diagonals. Blank tiles have zero nearby traps and sweep open nearby safe spaces. Right-click to flag suspected traps. If a revealed number already touches the correct number of flags, click that number again to clear its other neighboring tiles.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <div style={panelStyle()}>
          <div style={labelStyle()}>CLUES</div>
          <div style={{ color: C.cream, fontWeight: 900, fontSize: 22 }}>
            {stats.cluesFound} / {settings.clues}
          </div>
        </div>
        <div style={panelStyle()}>
          <div style={labelStyle()}>TRAPS</div>
          <div style={{ color: C.cream, fontWeight: 900, fontSize: 22 }}>{settings.traps}</div>
        </div>
        <div style={panelStyle()}>
          <div style={labelStyle()}>FLAGS</div>
          <div style={{ color: C.cream, fontWeight: 900, fontSize: 22 }}>{stats.flags}</div>
        </div>
        <div style={panelStyle()}>
          <div style={labelStyle()}>STATUS</div>
          <div style={{ color: game?.status === "won" ? C.gold : game?.status === "lost" ? C.trap : C.cream, fontWeight: 900, fontSize: 18, marginTop: 4 }}>
            {game?.message ?? "Pick a difficulty and start the sweep."}
          </div>
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          padding: 12,
          background:
            "radial-gradient(circle at 50% 25%, rgba(255,193,94,.1), transparent 34%), linear-gradient(180deg, rgba(47,86,50,.72), rgba(9,19,14,.82))"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${SIZE}, clamp(30px, 8.4vw, 40px))`,
            gap: 4,
            width: "fit-content",
            margin: "0 auto"
          }}
        >
          {(game?.board ?? Array.from({ length: CELL_COUNT }, (_, index) => ({
            index,
            trap: false,
            clue: false,
            nearbyTraps: 0,
            revealed: false,
            flagged: false
          }))).map((tile) => (
            <Tile
              key={tile.index}
              tile={tile}
              disabled={!game || game.status !== "playing"}
              onReveal={() => revealTile(tile.index)}
              onFlag={(event) => flagTile(event, tile.index)}
            />
          ))}
        </div>
      </div>

      <div style={{ color: C.muted, fontSize: 12, fontWeight: 800, marginTop: 10 }}>
        Right-click a tile to flag a suspected red herring.
      </div>
    </section>
  );
}

function panelStyle() {
  return {
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    padding: 12,
    background: "rgba(9,19,14,.55)"
  };
}

function labelStyle() {
  return {
    color: C.gold,
    fontWeight: 900,
    letterSpacing: 1.3,
    fontSize: 12,
    marginBottom: 8
  };
}

function primaryButton(enabled) {
  return {
    border: `1px solid ${C.gold}`,
    background: enabled ? `linear-gradient(180deg, ${C.gold}, #dca33d)` : "rgba(120,120,120,.28)",
    color: enabled ? C.dark : C.muted,
    borderRadius: 8,
    padding: "10px 16px",
    fontWeight: 900,
    cursor: enabled ? "pointer" : "default"
  };
}
