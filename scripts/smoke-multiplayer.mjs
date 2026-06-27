// Quick end-to-end smoke test for the Parlor PartyKit multiplayer flow.
// Spins up two WebSocket clients in one room, walks them through a classic-mode round,
// and asserts that state syncs at each step.
//
// Run: node scripts/smoke-multiplayer.mjs
// Requires: `npm run dev:party` (PartyKit on :1999)

const HOST = process.env.PARTY_HOST ?? "localhost:1999";
const ROOM = `smoke${Math.random().toString(36).slice(2, 6)}`;
const URL = `ws://${HOST}/parties/main/${ROOM}`;

console.log(`▸ Room ${ROOM.toUpperCase()} at ${URL}`);

function makeClient(label) {
  const ws = new WebSocket(URL);
  const incoming = [];
  const waiters = [];
  ws.addEventListener("open", () => console.log(`  [${label}] connected`));
  ws.addEventListener("close", () => console.log(`  [${label}] closed`));
  ws.addEventListener("error", (e) => console.error(`  [${label}] error`, e.message ?? e));
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    incoming.push(msg);
    [...waiters].forEach((fn) => fn(msg));
  });
  return {
    label,
    send: (action, hostToken) => ws.send(JSON.stringify({ type: "ACTION", action, hostToken })),
    close: () => ws.close(),
    next: (predicate, timeoutMs = 1500) =>
      new Promise((resolve, reject) => {
        const found = incoming.find(predicate);
        if (found) return resolve(found);
        const timer = setTimeout(() => {
          const i = waiters.indexOf(handler);
          if (i >= 0) waiters.splice(i, 1);
          reject(new Error(`[${label}] timeout waiting for ${predicate.toString()}`));
        }, timeoutMs);
        const handler = (msg) => {
          if (!predicate(msg)) return;
          clearTimeout(timer);
          const i = waiters.indexOf(handler);
          if (i >= 0) waiters.splice(i, 1);
          resolve(msg);
        };
        waiters.push(handler);
      })
  };
}

function assertEq(label, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    process.exitCode = 1;
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const stateMsg = (m) => m.type === "STATE";

async function main() {
  const hostToken = `host-${Math.random().toString(36).slice(2)}`;
  const a = makeClient("A");
  const b = makeClient("B");

  console.log("\n▸ Initial connect");
  const initA = await a.next(stateMsg);
  assertEq("A sees lobby phase", initA.state.phase, "lobby");
  assertEq("A sees room code = ROOM (upper)", initA.state.roomCode, ROOM.toUpperCase());
  assertEq("A sees empty players", initA.state.players, {});
  const initB = await b.next(stateMsg);
  assertEq("B sees lobby phase", initB.state.phase, "lobby");

  console.log("\n▸ JOIN flow");
  a.send({ type: "JOIN", id: "alice", name: "Alice", avatar: "03-bram" });
  const aliceJoined = await b.next((m) => stateMsg(m) && m.state.players.alice);
  assertEq("B receives alice joined", aliceJoined.state.players.alice.name, "Alice");
  assertEq("B receives alice avatar", aliceJoined.state.players.alice.avatar, "03-bram");
  b.send({ type: "JOIN", id: "bob", name: "Bob", avatar: "10-agatha" });
  const bothJoined = await a.next((m) => stateMsg(m) && m.state.players.bob);
  assertEq("A receives bob joined", Object.keys(bothJoined.state.players).sort(), ["alice", "bob"]);
  assertEq("A receives bob avatar", bothJoined.state.players.bob.avatar, "10-agatha");

  console.log("\n▸ START_GAME");
  a.send({ type: "SET_MODE", mode: "classic" }, hostToken);
  const modeSelected = await b.next((m) => stateMsg(m) && m.state.modeSelected);
  assertEq("B sees selected classic mode", modeSelected.state.mode, "classic");
  b.send({ type: "START_GAME" });
  try {
    await b.next((m) => stateMsg(m) && m.state.phase === "writing", 150);
    assertEq("Unauthenticated start is ignored", "writing", "lobby");
  } catch {
    assertEq("Unauthenticated start is ignored", "lobby", "lobby");
  }
  a.send({ type: "START_GAME" }, hostToken);
  const started = await b.next((m) => stateMsg(m) && m.state.phase === "writing");
  assertEq("B sees writing phase", started.state.phase, "writing");
  assertEq("B sees round 1", started.state.round, 1);
  assertEq("B sees a prompt", typeof started.state.prompt, "string");

  console.log("\n▸ SUBMIT_ANSWER from both");
  a.send({ type: "SUBMIT_ANSWER", playerId: "alice", text: "the smaller spoon" });
  b.send({ type: "SUBMIT_ANSWER", playerId: "bob", text: "a damp sock" });
  const voting = await a.next((m) => stateMsg(m) && m.state.phase === "voting");
  assertEq("A sees voting phase after both lock in", voting.state.phase, "voting");
  assertEq(
    "A sees both answers",
    Object.keys(voting.state.answers).sort(),
    ["alice", "bob"]
  );

  console.log("\n▸ VOTE");
  a.send({ type: "VOTE", voterId: "alice", ownerId: "bob" });
  b.send({ type: "VOTE", voterId: "bob", ownerId: "alice" });
  const reveal = await a.next((m) => stateMsg(m) && m.state.phase === "reveal");
  assertEq("A sees reveal phase", reveal.state.phase, "reveal");
  assertEq("revealOrder has both players", reveal.state.revealOrder.sort(), ["alice", "bob"]);
  assertEq("Both got 1 vote", [reveal.state._counts.alice, reveal.state._counts.bob], [1, 1]);
  assertEq("Both got points", [reveal.state.players.alice.score, reveal.state.players.bob.score], [100, 100]);

  console.log("\n▸ Done. Closing.");
  a.close();
  b.close();
  await sleep(150);
  process.exit(process.exitCode ?? 0);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
