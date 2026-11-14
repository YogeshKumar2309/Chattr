import type { Server, Socket } from "socket.io";
import { verifyCredentials } from "../lib/auth";
import { connectDB, hasDB } from "../lib/db";
import { User } from "../models/User";
import { Report } from "../models/Report";

type Mode = "text" | "audio" | "video";
const MODES: Mode[] = ["text", "audio", "video"];
const isMode = (m: unknown): m is Mode => MODES.includes(m as Mode);

interface SocketData {
  uid?: string;
  name?: string;
  blocked: Set<string>; // blocked uids + is session mein block kiye socket ids
  lastFind: number;
  ready?: Promise<unknown>; // identify/attach complete hone ka wait
}
type S = Socket<any, any, any, SocketData>;

export function registerSocket(io: Server) {
  (globalThis as unknown as { __io: Server }).__io = io; // API routes isse notify karte hain

  const queues: Record<Mode, string[]> = { text: [], audio: [], video: [] };
  const partners = new Map<string, string>(); // socket.id -> partner socket.id
  const uidSocket = new Map<string, string>(); // uid -> socket.id
  const pendingInvites = new Map<string, { toUid: string; mode: Mode }>(); // caller socket.id -> invite

  const get = (id?: string): S | undefined => (id ? (io.sockets.sockets.get(id) as S | undefined) : undefined);
  const broadcastOnline = () => io.emit("online", io.engine.clientsCount);

  const isBlocked = (a: S, b: S) =>
    a.data.blocked.has(b.id) ||
    b.data.blocked.has(a.id) ||
    (!!b.data.uid && a.data.blocked.has(b.data.uid)) ||
    (!!a.data.uid && b.data.blocked.has(a.data.uid));

  function leave(s: S, notifyPartner = true) {
    for (const m of MODES) queues[m] = queues[m].filter((id) => id !== s.id);
    pendingInvites.delete(s.id);
    const pid = partners.get(s.id);
    if (pid) {
      partners.delete(s.id);
      partners.delete(pid);
      if (notifyPartner) get(pid)?.emit("peer-left");
    }
  }

  function pair(initiator: S, other: S, kind: "random" | "friend", mode: Mode) {
    partners.set(initiator.id, other.id);
    partners.set(other.id, initiator.id);
    initiator.emit("matched", { initiator: true, peerUid: other.data.uid, kind, mode });
    other.emit("matched", { initiator: false, peerUid: initiator.data.uid, kind, mode });
  }

  function find(s: S, mode: Mode) {
    leave(s);
    const q = (queues[mode] = queues[mode].filter((id) => get(id)));
    const idx = q.findIndex((id) => id !== s.id && !isBlocked(s, get(id)!));
    if (idx === -1) {
      q.push(s.id);
      s.emit("waiting");
      return;
    }
    const [otherId] = q.splice(idx, 1);
    pair(get(otherId)!, s, "random", mode); // jo pehle se wait kar raha tha wo offer banata hai
  }

  async function attach(s: S, cred: { uid?: unknown; secret?: unknown } | undefined) {
    if (!cred?.uid || !hasDB()) return false;
    try {
      const user = await verifyCredentials(cred.uid, cred.secret);
      if (!user) return false;
      s.data.uid = user.uid;
      s.data.name = user.name;
      user.blocked.forEach((u) => s.data.blocked.add(u));
      s.join(`user:${user.uid}`);
      uidSocket.set(user.uid, s.id);
      const pid = partners.get(s.id);
      if (pid) get(pid)?.emit("peer-uid", user.uid); // chat ke beech ID banayi to partner ko batao
      return true;
    } catch {
      return false;
    }
  }

  io.on("connection", (socket: S) => {
    socket.data.blocked = new Set();
    socket.data.lastFind = 0;
    socket.data.ready = attach(socket, socket.handshake.auth);
    broadcastOnline();

    socket.on("identify", async (cred: { uid?: unknown; secret?: unknown }, cb?: (ok: boolean) => void) => {
      const ok = await (socket.data.ready = attach(socket, cred));
      if (typeof cb === "function") cb(ok);
    });

    socket.on("find", (mode: unknown) => {
      if (!isMode(mode)) return;
      const now = Date.now();
      if (now - socket.data.lastFind < 700) return; // spam rokne ke liye
      socket.data.lastFind = now;
      find(socket, mode);
    });

    socket.on("leave", () => leave(socket));

    socket.on("signal", (data: unknown) => {
      const pid = partners.get(socket.id);
      if (!pid || !data || typeof data !== "object") return;
      if (JSON.stringify(data).length > 20_000) return;
      get(pid)?.emit("signal", data);
    });

    socket.on("presence", (uids: unknown, cb: unknown) => {
      if (typeof cb !== "function" || !Array.isArray(uids)) return;
      cb(uids.slice(0, 200).filter((u) => typeof u === "string" && uidSocket.has(u)));
    });

    socket.on("report", async (reason: unknown) => {
      const pid = partners.get(socket.id);
      const peer = get(pid);
      if (!peer) return;
      if (hasDB()) {
        try {
          await connectDB();
          await Report.create({
            reporter: socket.data.uid,
            reported: peer.data.uid ?? `anon:${peer.id}`,
            reason: typeof reason === "string" ? reason.slice(0, 300) : "unspecified",
          });
        } catch {}
      }
    });

    socket.on("block", async () => {
      const peer = get(partners.get(socket.id));
      if (!peer) return;
      socket.data.blocked.add(peer.id);
      leave(socket); // pehle turant alag karo, DB baad mein
      if (peer.data.uid) {
        socket.data.blocked.add(peer.data.uid);
        if (socket.data.uid && hasDB()) {
          try {
            await connectDB();
            await User.updateOne({ uid: socket.data.uid }, { $addToSet: { blocked: peer.data.uid } });
          } catch {}
        }
      }
    });

    // ---------- Friend se direct chat/call ----------
    socket.on("direct:invite", async (p: { toUid?: string; mode?: unknown }) => {
      await socket.data.ready;
      const me = socket.data.uid;
      if (!me || !p?.toUid || !isMode(p.mode)) return socket.emit("direct:unavailable", "Pehle apni ID banao");
      try {
        await connectDB();
        if (!(await User.exists({ uid: me, friends: p.toUid }))) {
          return socket.emit("direct:unavailable", "Ye tumhara friend nahi hai");
        }
      } catch {
        return socket.emit("direct:unavailable", "Server error");
      }
      const target = get(uidSocket.get(p.toUid));
      if (!target || partners.has(target.id)) {
        return socket.emit("direct:unavailable", "Friend abhi online nahi hai ya busy hai");
      }
      leave(socket);
      pendingInvites.set(socket.id, { toUid: p.toUid, mode: p.mode });
      target.emit("direct:incoming", { fromUid: me, fromName: socket.data.name ?? me, mode: p.mode });
      socket.emit("waiting");
      setTimeout(() => {
        if (pendingInvites.get(socket.id)?.toUid === p.toUid) {
          pendingInvites.delete(socket.id);
          socket.emit("direct:unavailable", "Friend ne jawab nahi diya");
        }
      }, 45_000);
    });

    socket.on("direct:accept", async (p: { fromUid?: string }) => {
      await socket.data.ready;
      const callerId = p?.fromUid ? uidSocket.get(p.fromUid) : undefined;
      const caller = get(callerId);
      const invite = callerId ? pendingInvites.get(callerId) : undefined;
      if (!caller || !invite || invite.toUid !== socket.data.uid) {
        return socket.emit("direct:unavailable", "Call expire ho gayi");
      }
      pendingInvites.delete(caller.id);
      leave(socket);
      pair(caller, socket, "friend", invite.mode);
    });

    socket.on("direct:decline", (p: { fromUid?: string }) => {
      const callerId = p?.fromUid ? uidSocket.get(p.fromUid) : undefined;
      if (callerId && pendingInvites.get(callerId)?.toUid === socket.data.uid) {
        pendingInvites.delete(callerId);
        get(callerId)?.emit("direct:unavailable", "Friend ne call decline ki");
      }
    });

    socket.on("disconnect", () => {
      leave(socket);
      if (socket.data.uid && uidSocket.get(socket.data.uid) === socket.id) uidSocket.delete(socket.data.uid);
      broadcastOnline();
    });
  });
}
