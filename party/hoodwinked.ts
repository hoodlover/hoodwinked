import type * as Party from "partykit/server";
import {
  makeInitialState,
  reducer,
  type Action,
  type State
} from "../lib/engine";

type ServerMsg = { type: "STATE"; state: State };
type ClientMsg = { type: "ACTION"; action: Action; hostToken?: string };

const HOST_ACTIONS = new Set<Action["type"]>([
  "TOGGLE_MODE",
  "SET_MODE",
  "START_GAME",
  "FORCE_VOTING",
  "FORCE_REVEAL",
  "NEXT_REVEAL",
  "NEXT_ROUND",
  "NEXT_QUIP",
  "PLAY_AGAIN",
  "RESET",
  "REQUEST_PICTURE_IMAGE",
  "SET_PICTURE_IMAGE",
  "SET_PICTURE_IMAGE_ERROR"
]);

function isHostAction(action: Action): boolean {
  return HOST_ACTIONS.has(action.type);
}

// One instance per room. PartyKit creates a fresh HoodwinkedServer per Party.id (room code).
export default class HoodwinkedServer implements Party.Server {
  state: State;
  hostToken: string | null = null;

  constructor(readonly party: Party.Party) {
    // Seed the room code from the URL so the displayed code matches the connect URL.
    this.state = { ...makeInitialState(), roomCode: party.id.toUpperCase() };
  }

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: "STATE", state: this.state } satisfies ServerMsg));
  }

  onMessage(message: string) {
    let msg: ClientMsg;
    try {
      msg = JSON.parse(message) as ClientMsg;
    } catch {
      return;
    }
    if (msg.type !== "ACTION") return;
    if (isHostAction(msg.action)) {
      if (!msg.hostToken) return;
      if (!this.hostToken) this.hostToken = msg.hostToken;
      if (msg.hostToken !== this.hostToken) return;
    }
    this.state = reducer(this.state, msg.action);
    this.party.broadcast(
      JSON.stringify({ type: "STATE", state: this.state } satisfies ServerMsg)
    );
  }
}
