import { io, type Socket } from "socket.io-client";
import type { Identity } from "./identity";

export function createSocket(id: Identity | null): Socket {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL; // Render ka signaling server
  const opts = {
    auth: id ? { uid: id.uid, secret: id.secret } : {},
    transports: ["websocket", "polling"],
  };
  return url ? io(url, opts) : io(opts);
}
