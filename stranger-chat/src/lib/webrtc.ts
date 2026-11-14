import { uuid } from "./uuid";
export type Signal = { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };

export interface FileMeta {
  id: string;
  name: string;
  size: number;
  mime: string;
}

type Wire =
  | { t: "chat"; id: string; text: string; ts: number }
  | ({ t: "file-meta" } & FileMeta)
  | { t: "file-end"; id: string };

export interface Handlers {
  signal: (s: Signal) => void;
  open: () => void;
  chat: (m: { id: string; text: string; ts: number }) => void;
  file: (meta: FileMeta, blob: Blob) => void;
  stream: (s: MediaStream) => void;
  state: (s: RTCPeerConnectionState) => void;
}

export const MAX_FILE = 25 * 1024 * 1024; // 25 MB
const CHUNK = 16 * 1024;

/** Ek P2P connection: DataChannel (text + files) aur optional audio/video tracks. */
export class PeerLink {
  private pc: RTCPeerConnection;
  private dc: RTCDataChannel | null = null;
  private pendingIce: RTCIceCandidateInit[] = [];
  private incoming: { meta: FileMeta; chunks: ArrayBuffer[]; got: number } | null = null;
  private closed = false;

  constructor(
    private opts: {
      initiator: boolean;
      iceServers: RTCIceServer[];
      stream?: MediaStream | null;
      on: Handlers;
    }
  ) {
    const { on, stream, initiator } = opts;
    this.pc = new RTCPeerConnection({ iceServers: opts.iceServers });
    stream?.getTracks().forEach((t) => this.pc.addTrack(t, stream));
    this.pc.onicecandidate = (e) => e.candidate && on.signal({ candidate: e.candidate.toJSON() });
    this.pc.ontrack = (e) => e.streams[0] && on.stream(e.streams[0]);
    this.pc.onconnectionstatechange = () => !this.closed && on.state(this.pc.connectionState);

    if (initiator) {
      this.setupChannel(this.pc.createDataChannel("chat", { ordered: true }));
      void this.makeOffer();
    } else {
      this.pc.ondatachannel = (e) => this.setupChannel(e.channel);
    }
  }

  private async makeOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.opts.on.signal({ description: this.pc.localDescription!.toJSON() });
  }

  async handleSignal(s: Signal) {
    if (this.closed) return;
    try {
      if (s.description) {
        await this.pc.setRemoteDescription(s.description);
        for (const c of this.pendingIce.splice(0)) await this.pc.addIceCandidate(c);
        if (s.description.type === "offer") {
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          this.opts.on.signal({ description: this.pc.localDescription!.toJSON() });
        }
      } else if (s.candidate) {
        if (this.pc.remoteDescription) await this.pc.addIceCandidate(s.candidate);
        else this.pendingIce.push(s.candidate);
      }
    } catch (e) {
      console.warn("signal error", e);
    }
  }

  private setupChannel(dc: RTCDataChannel) {
    this.dc = dc;
    dc.binaryType = "arraybuffer";
    dc.bufferedAmountLowThreshold = 512 * 1024;
    dc.onopen = () => this.opts.on.open();
    dc.onmessage = (e) => this.onData(e.data);
  }

  private onData(data: unknown) {
    if (typeof data === "string") {
      let m: Wire;
      try {
        m = JSON.parse(data);
      } catch {
        return;
      }
      if (m.t === "chat" && typeof m.text === "string") {
        this.opts.on.chat({ id: String(m.id), text: m.text.slice(0, 2000), ts: Number(m.ts) || Date.now() });
      } else if (m.t === "file-meta") {
        if (m.size > MAX_FILE || m.size <= 0) return; // bahut bada file reject
        this.incoming = {
          meta: { id: m.id, name: String(m.name).slice(0, 120), size: m.size, mime: String(m.mime) },
          chunks: [],
          got: 0,
        };
      } else if (m.t === "file-end" && this.incoming?.meta.id === m.id) {
        const { meta, chunks } = this.incoming;
        this.incoming = null;
        this.opts.on.file(meta, new Blob(chunks, { type: meta.mime }));
      }
    } else if (data instanceof ArrayBuffer && this.incoming) {
      this.incoming.got += data.byteLength;
      if (this.incoming.got > this.incoming.meta.size) {
        this.incoming = null; // declared size se zyada aaya, drop
        return;
      }
      this.incoming.chunks.push(data);
    }
  }

  get ready() {
    return this.dc?.readyState === "open";
  }

  sendChat(text: string) {
    const msg = { id: uuid(), text, ts: Date.now() };
    this.dc?.send(JSON.stringify({ t: "chat", ...msg } satisfies Wire));
    return msg;
  }

  async sendFile(file: File, onProgress?: (pct: number) => void) {
    const dc = this.dc;
    if (!dc || dc.readyState !== "open") throw new Error("Connection ready nahi hai");
    if (file.size > MAX_FILE) throw new Error("File 25 MB se chhoti honi chahiye");
    const meta: FileMeta = { id: uuid(), name: file.name, size: file.size, mime: file.type || "application/octet-stream" };
    dc.send(JSON.stringify({ t: "file-meta", ...meta } satisfies Wire));
    for (let off = 0; off < file.size; off += CHUNK) {
      if (dc.bufferedAmount > 1024 * 1024) {
        await new Promise<void>((r) => {
          dc.onbufferedamountlow = () => {
            dc.onbufferedamountlow = null;
            r();
          };
        });
      }
      dc.send(await file.slice(off, off + CHUNK).arrayBuffer());
      onProgress?.(Math.min(100, Math.round(((off + CHUNK) / file.size) * 100)));
    }
    dc.send(JSON.stringify({ t: "file-end", id: meta.id } satisfies Wire));
    return meta;
  }

  close() {
    this.closed = true;
    try {
      this.dc?.close();
      this.pc.close();
    } catch {}
  }
}
