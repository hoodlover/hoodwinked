import {
  makeInitialState,
  reducer,
  type Action,
  type State
} from "../lib/engine";

type Env = {
  HOODWINKED_ROOM: DurableObjectNamespace;
};

type ServerMsg = { type: "STATE"; state: State };
type ClientMsg = { type: "ACTION"; action: Action };

type DurableObjectNamespace = {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): { fetch(request: Request): Promise<Response> };
};
type DurableObjectId = {
  name?: string;
};
type DurableObjectState = {
  id: DurableObjectId;
};
type CloudflareWebSocket = WebSocket & {
  accept(): void;
};
type WebSocketResponseInit = ResponseInit & {
  webSocket: WebSocket;
};

declare class WebSocketPair {
  0: CloudflareWebSocket;
  1: CloudflareWebSocket;
}

export class HoodwinkedRoom {
  private state: State;
  private readonly sockets = new Set<WebSocket>();

  constructor(private readonly durableState: DurableObjectState) {
    const roomCode = durableState.id.name?.toUpperCase() || "ROOM";
    this.state = { ...makeInitialState(), roomCode };
  }

  fetch(request: Request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Hoodwinked room server", { status: 200 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    this.sockets.add(server);

    server.send(JSON.stringify({ type: "STATE", state: this.state } satisfies ServerMsg));
    server.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      let msg: ClientMsg;
      try {
        msg = JSON.parse(event.data) as ClientMsg;
      } catch {
        return;
      }
      if (msg.type !== "ACTION") return;
      this.state = reducer(this.state, msg.action);
      this.broadcast({ type: "STATE", state: this.state });
    });

    const cleanup = () => this.sockets.delete(server);
    server.addEventListener("close", cleanup);
    server.addEventListener("error", cleanup);

    return new Response(null, { status: 101, webSocket: client } as WebSocketResponseInit);
  }

  private broadcast(message: ServerMsg) {
    const payload = JSON.stringify(message);
    for (const socket of this.sockets) {
      try {
        socket.send(payload);
      } catch {
        this.sockets.delete(socket);
      }
    }
  }
}

const worker = {
  fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/parties\/main\/([^/]+)$/);
    if (!match) {
      return new Response("Hoodwinked realtime server", { status: 200 });
    }

    const room = match[1].toLowerCase();
    const id = env.HOODWINKED_ROOM.idFromName(room);
    return env.HOODWINKED_ROOM.get(id).fetch(request);
  }
};

export default worker;
