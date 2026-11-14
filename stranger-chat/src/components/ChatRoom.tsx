"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import type { Socket } from "socket.io-client";
import {
  Ban, Download, Flag, Mic, MicOff, Paperclip, Send, SkipForward, Square, UserPlus, Users, Video, VideoOff,
} from "lucide-react";
import Logo from "./Logo";
import ModePicker, { type Mode } from "./ModePicker";
import AgeCheck, { AGE_KEY } from "./AgeCheck";
import IncomingCall, { type Call } from "./IncomingCall";
import { PeerLink, MAX_FILE } from "@/lib/webrtc";
import { getIceServers } from "@/lib/ice";
import { createSocket } from "@/lib/socket";
import { api, createIdentity, getStoredIdentity, type Identity } from "@/lib/identity";
import { loadConversation, saveMessage, startPurgeLoop } from "@/lib/idb";
import { uuid } from "@/lib/uuid";

type Phase = "idle" | "searching" | "connected" | "ended";
type How = { t: "random" } | { t: "invite"; uid: string } | { t: "accept"; uid: string };
interface Msg {
  id: string;
  from: "me" | "peer" | "system";
  text?: string;
  file?: { name: string; url: string; mime: string; size: number };
  old?: boolean;
}

const SAFE_IMG = /^image\/(png|jpe?g|gif|webp)$/;
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function ChatRoom({
  initialMode,
  friendUid,
  acceptUid,
}: {
  initialMode: Mode;
  friendUid?: string;
  acceptUid?: string;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [phase, setPhase] = useState<Phase>("idle");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [peerUid, setPeerUid] = useState<string>();
  const [kind, setKind] = useState<"random" | "friend">("random");
  const [online, setOnline] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [notice, setNotice] = useState("");
  const [age, setAge] = useState(false);
  const [incoming, setIncoming] = useState<Call | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const linkRef = useRef<PeerLink | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const idRef = useRef<Identity | null>(null);
  const convRef = useRef<string | null>(null);
  const modeRef = useRef<Mode>(initialMode);
  const urlsRef = useRef<string[]>([]);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addMsg = (m: Omit<Msg, "id"> & { id?: string }) =>
    setMsgs((p) => [...p.slice(-299), { ...m, id: m.id ?? uuid() }]);
  const sys = (text: string) => addMsg({ from: "system", text });
  const persist = (id: string, from: "me" | "peer", text: string, ts = Date.now()) => {
    if (convRef.current) void saveMessage({ conv: convRef.current, id, from, text, ts });
  };
  const loadHistory = async (conv: string) => {
    const rows = await loadConversation(conv);
    setMsgs(rows.map((r) => ({ id: r.key, from: r.from, text: r.text, old: true })));
  };

  function teardownLink() {
    linkRef.current?.close();
    linkRef.current = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
  }
  function stopMedia() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (localVideo.current) localVideo.current.srcObject = null;
  }
  async function getMedia(m: Mode) {
    stopMedia();
    if (m === "text") return;
    const s = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: m === "video" ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } : false,
    });
    streamRef.current = s;
    if (localVideo.current) localVideo.current.srcObject = s;
    setMicOn(true);
    setCamOn(true);
  }

  function onMatched(p: { initiator: boolean; peerUid?: string; kind: "random" | "friend" }) {
    teardownLink();
    setPeerUid(p.peerUid);
    setKind(p.kind);
    setPhase("connected");
    setNotice("");
    if (p.kind === "friend" && p.peerUid) {
      convRef.current = `friend:${p.peerUid}`;
      void loadHistory(convRef.current);
    } else {
      convRef.current = null; // random chat sirf is session ke liye hai
      setMsgs([]);
    }
    linkRef.current = new PeerLink({
      initiator: p.initiator,
      iceServers: getIceServers(),
      stream: streamRef.current,
      on: {
        signal: (sig) => socketRef.current?.emit("signal", sig),
        open: () => sys(p.kind === "friend" ? "Friend se connect ho gaye." : "Connect ho gaye. Pehla message tum bhejo."),
        chat: (m) => {
          addMsg({ id: m.id, from: "peer", text: m.text });
          persist(m.id, "peer", m.text, m.ts);
        },
        file: (meta, blob) => {
          const url = URL.createObjectURL(blob);
          urlsRef.current.push(url);
          addMsg({ from: "peer", file: { name: meta.name, url, mime: meta.mime, size: meta.size } });
        },
        stream: (s) => {
          if (remoteVideo.current) remoteVideo.current.srcObject = s;
        },
        state: (st) => {
          if (st === "failed") sys("Direct connection fail ho gaya. Next dabao. (Strict network par TURN server chahiye.)");
        },
      },
    });
  }

  async function begin(how: How, m: Mode) {
    if (localStorage.getItem(AGE_KEY) !== "1") return setNotice("Pehle 18+ confirm karo.");
    setNotice("");
    teardownLink();
    setPeerUid(undefined);
    if (how.t === "random") setMsgs([]);
    modeRef.current = m;
    try {
      await getMedia(m);
    } catch {
      setPhase("idle");
      return setNotice("Camera/mic ki permission chahiye. Browser mein allow karke dobara try karo.");
    }
    const s = socketRef.current!;
    if (!s.connected) await new Promise<void>((r) => s.once("connect", () => r()));
    setPhase("searching");
    if (how.t === "random") s.emit("find", m);
    else if (how.t === "invite") s.emit("direct:invite", { toUid: how.uid, mode: m });
    else s.emit("direct:accept", { fromUid: how.uid });
  }

  const startDefault = () => begin(friendUid ? { t: "invite", uid: friendUid } : { t: "random" }, mode);

  function nextStranger() {
    teardownLink();
    setPeerUid(undefined);
    setMsgs([]);
    setPhase("searching");
    socketRef.current?.emit("find", modeRef.current);
  }

  function stop() {
    teardownLink();
    stopMedia();
    socketRef.current?.emit("leave");
    setPhase("idle");
    setPeerUid(undefined);
    setMsgs([]);
  }

  function report() {
    const reason = window.prompt("Kya problem thi? (optional)") ;
    if (reason === null) return;
    socketRef.current?.emit("report", reason || "unspecified");
    socketRef.current?.emit("block");
    sys("Report bhej di aur user block ho gaya.");
    nextStranger();
  }
  function block() {
    socketRef.current?.emit("block");
    nextStranger();
  }

  async function addFriend() {
    if (!peerUid) return sys("Is user ne abhi tak apni ID nahi banayi.");
    try {
      let id = idRef.current;
      if (!id) {
        id = await createIdentity();
        idRef.current = id;
        const s = socketRef.current!;
        await new Promise((r) => s.emit("identify", { uid: id!.uid, secret: id!.secret }, r));
        sys(`Tumhari ID ban gayi: ${id.uid}. Isey Friends page par save kar lena.`);
      }
      const r = await api<{ status: string }>("/api/friends/request", id, { method: "POST", body: { to: peerUid } });
      sys(r.status === "accepted" ? "Ab tum dono friends ho." : "Friend request bhej di.");
    } catch (e) {
      sys((e as Error).message);
    }
  }

  function send() {
    const text = draft.trim();
    const link = linkRef.current;
    if (!text || !link?.ready) return;
    const m = link.sendChat(text);
    addMsg({ id: m.id, from: "me", text });
    persist(m.id, "me", text, m.ts);
    setDraft("");
  }

  async function sendFile(file: File) {
    const link = linkRef.current;
    if (!link?.ready) return;
    if (file.size > MAX_FILE) return sys("File 25 MB se chhoti honi chahiye.");
    try {
      setProgress(0);
      await link.sendFile(file, setProgress);
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);
      addMsg({ from: "me", file: { name: file.name, url, mime: file.type, size: file.size } });
    } catch (e) {
      sys((e as Error).message);
    } finally {
      setProgress(null);
    }
  }

  function toggleMic() {
    const next = !micOn;
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  }
  function toggleCam() {
    const next = !camOn;
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  }

  function acceptCall() {
    if (!incoming) return;
    const c = incoming;
    setIncoming(null);
    setMode(c.mode);
    convRef.current = `friend:${c.fromUid}`;
    void loadHistory(convRef.current);
    stopMedia();
    teardownLink();
    void begin({ t: "accept", uid: c.fromUid }, c.mode);
  }
  function declineCall() {
    if (incoming) socketRef.current?.emit("direct:decline", { fromUid: incoming.fromUid });
    setIncoming(null);
  }

  // ---------- setup ----------
  useEffect(() => {
    const id = getStoredIdentity();
    idRef.current = id;
    setAge(localStorage.getItem(AGE_KEY) === "1");
    const stopPurge = startPurgeLoop();
    const s = createSocket(id);
    socketRef.current = s;

    s.on("online", setOnline);
    s.on("waiting", () => setPhase((p) => (p === "connected" ? p : "searching")));
    s.on("matched", onMatched);
    s.on("signal", (d) => void linkRef.current?.handleSignal(d));
    s.on("peer-uid", setPeerUid);
    s.on("peer-left", () => {
      teardownLink();
      setPhase("ended");
      sys("Doosra user chala gaya.");
    });
    s.on("direct:incoming", (c: Call) => setIncoming(c));
    s.on("direct:unavailable", (t: string) => {
      stopMedia();
      setPhase("idle");
      setNotice(t);
    });

    const fid = friendUid ?? acceptUid;
    if (fid) {
      convRef.current = `friend:${fid}`;
      void loadHistory(convRef.current);
      void begin(friendUid ? { t: "invite", uid: friendUid } : { t: "accept", uid: acceptUid! }, initialMode);
    }

    return () => {
      stopPurge();
      teardownLink();
      stopMedia();
      s.disconnect();
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight });
    const last = el.lastElementChild;
    if (last && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(last, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power2.out" });
    }
  }, [msgs.length]);

  useEffect(() => {
    if (phase !== "searching" || !radarRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".ring", { scale: 0.3, opacity: 0.8 }, { scale: 1.6, opacity: 0, duration: 2.4, stagger: 0.8, repeat: -1, ease: "power1.out" });
    }, radarRef);
    return () => ctx.revert();
  }, [phase]);

  const connected = phase === "connected";
  const showVideo = mode !== "text" && (connected || phase === "searching");
  const peerLabel = kind === "friend" ? "Friend" : "Stranger";

  return (
    <div className="flex h-dvh flex-col bg-deep">
      {incoming && <IncomingCall call={incoming} onAccept={acceptCall} onDecline={declineCall} />}

      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Logo />
        <div className="flex items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-2 text-mute">
            <span className="size-2 rounded-full bg-mint" /> {online} online
          </span>
          <Link href="/friends" className="inline-flex items-center gap-2 rounded-full bg-panel px-3 py-1.5 hover:bg-panel2">
            <Users size={15} /> Friends
          </Link>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_380px]">
        {/* ---------- Stage ---------- */}
        <section className="relative flex min-h-0 flex-col border-line lg:border-r">
          <div className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-hidden bg-black/30">
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className={`absolute inset-0 size-full object-cover ${mode === "video" && connected ? "" : "hidden"}`}
            />
            <video
              ref={localVideo}
              autoPlay
              muted
              playsInline
              className={`absolute bottom-3 right-3 z-10 h-28 w-20 -scale-x-100 rounded-xl border border-line bg-panel object-cover sm:h-36 sm:w-28 ${
                mode === "video" && showVideo && camOn ? "" : "hidden"
              }`}
            />

            {phase === "idle" && (
              <div className="z-10 flex max-w-sm flex-col items-start gap-5 p-6">
                <h2 className="font-display text-3xl font-extrabold leading-tight">
                  {friendUid || acceptUid ? "Friend se connect ho rahe hain" : "Kaun milega aaj?"}
                </h2>
                <ModePicker value={mode} onChange={setMode} />
                <AgeCheck checked={age} onChange={setAge} />
                {notice && <p role="alert" className="rounded-lg bg-pink/15 px-3 py-2 text-sm text-pink">{notice}</p>}
                <button
                  onClick={startDefault}
                  disabled={!age}
                  className="rounded-full bg-pink px-6 py-3 font-display font-bold text-deep hover:brightness-110 disabled:opacity-40"
                >
                  {friendUid ? "Friend ko call karo" : "Start"}
                </button>
              </div>
            )}

            {phase === "searching" && (
              <div ref={radarRef} className="z-10 flex flex-col items-center gap-6 p-6 text-center">
                <div className="relative size-40">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="ring absolute inset-0 rounded-full border-2 border-pink" />
                  ))}
                  <span className="absolute inset-[58px] rounded-full bg-pink" />
                </div>
                <p className="font-display text-xl font-bold">{friendUid || acceptUid ? "Friend ka wait..." : "Koi dhoondh rahe hain..."}</p>
                <button onClick={stop} className="rounded-full bg-panel px-5 py-2 text-sm hover:bg-panel2">
                  Cancel
                </button>
              </div>
            )}

            {phase === "connected" && mode !== "video" && (
              <div className="z-10 flex flex-col items-center gap-3 text-center">
                <div className="grid size-24 place-items-center rounded-full bg-mint font-display text-4xl font-extrabold text-deep">
                  {mode === "audio" ? <Mic size={40} /> : peerLabel[0]}
                </div>
                <p className="font-display text-xl font-bold">{mode === "audio" ? "Audio call chal rahi hai" : `${peerLabel} se chat`}</p>
              </div>
            )}

            {phase === "ended" && (
              <div className="z-10 flex flex-col items-center gap-4 p-6 text-center">
                <p className="font-display text-2xl font-bold">Chat khatam</p>
                <div className="flex gap-3">
                  {kind === "random" ? (
                    <button onClick={nextStranger} className="rounded-full bg-pink px-6 py-3 font-display font-bold text-deep hover:brightness-110">
                      Naya stranger
                    </button>
                  ) : null}
                  <button onClick={stop} className="rounded-full bg-panel px-6 py-3 hover:bg-panel2">
                    Bahar niklo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* controls */}
          {(connected || phase === "searching") && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-panel/60 px-3 py-3">
              {kind === "random" && connected && (
                <button onClick={nextStranger} className="inline-flex items-center gap-2 rounded-full bg-pink px-5 py-2.5 font-display font-bold text-deep hover:brightness-110">
                  <SkipForward size={18} /> Next
                </button>
              )}
              <button onClick={stop} className="inline-flex items-center gap-2 rounded-full bg-panel2 px-4 py-2.5 hover:bg-panel2/70">
                <Square size={16} /> Stop
              </button>
              {mode !== "text" && (
                <button onClick={toggleMic} aria-label={micOn ? "Mic band karo" : "Mic chalu karo"} className="rounded-full bg-panel2 p-2.5 hover:bg-panel2/70">
                  {micOn ? <Mic size={18} /> : <MicOff size={18} className="text-pink" />}
                </button>
              )}
              {mode === "video" && (
                <button onClick={toggleCam} aria-label={camOn ? "Camera band karo" : "Camera chalu karo"} className="rounded-full bg-panel2 p-2.5 hover:bg-panel2/70">
                  {camOn ? <Video size={18} /> : <VideoOff size={18} className="text-pink" />}
                </button>
              )}
              {connected && (
                <div className="ml-auto flex gap-2">
                  {kind === "random" && (
                    <button onClick={addFriend} title="Friend request bhejo" className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2.5 text-sm font-medium text-deep hover:brightness-110">
                      <UserPlus size={16} /> Add friend
                    </button>
                  )}
                  {kind === "random" && (
                    <>
                      <button onClick={report} aria-label="Report karo" title="Report" className="rounded-full bg-panel2 p-2.5 hover:bg-panel2/70">
                        <Flag size={18} />
                      </button>
                      <button onClick={block} aria-label="Block karo" title="Block" className="rounded-full bg-panel2 p-2.5 hover:bg-panel2/70">
                        <Ban size={18} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ---------- Chat panel ---------- */}
        <aside className="flex min-h-0 flex-col bg-panel/40 max-lg:h-[42dvh]">
          <div ref={listRef} className="scroll-thin flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
            {msgs.length === 0 && (
              <p className="pt-6 text-center text-sm text-mute">
                {connected ? "Koi message nahi. Hi bolo." : "Connect hone ke baad yahan chat dikhegi."}
              </p>
            )}
            {msgs.map((m, i) => {
              const prev = msgs[i - 1];
              return (
                <div key={m.id}>
                  {m.old && !prev?.old && <p className="pb-2 text-center text-xs text-mute">Pichle 24 ghante ki chat</p>}
                  {!m.old && prev?.old && <div className="my-3 border-t border-line" />}
                  {m.from === "system" ? (
                    <p className="py-1 text-center text-xs text-mute">{m.text}</p>
                  ) : (
                    <div className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] break-words rounded-2xl px-3.5 py-2 text-[15px] ${
                          m.from === "me" ? "rounded-br-md bg-pink text-deep" : "rounded-bl-md bg-panel2"
                        } ${m.old ? "opacity-70" : ""}`}
                      >
                        {m.text}
                        {m.file &&
                          (SAFE_IMG.test(m.file.mime) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <a href={m.file.url} target="_blank" rel="noreferrer">
                              <img src={m.file.url} alt={m.file.name} className="max-h-56 rounded-lg" />
                            </a>
                          ) : (
                            <a href={m.file.url} download={m.file.name} className="flex items-center gap-2 underline">
                              <Download size={16} /> {m.file.name} <span className="opacity-70">({kb(m.file.size)})</span>
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {progress !== null && (
            <div className="mx-4 mb-2 h-1.5 overflow-hidden rounded-full bg-panel2">
              <div className="h-full bg-mint transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-line p-3"
          >
            <input ref={fileRef} type="file" hidden onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void sendFile(f);
            }} />
            <button type="button" disabled={!connected} onClick={() => fileRef.current?.click()} aria-label="File ya photo bhejo" className="rounded-full p-2.5 text-mute hover:text-ink disabled:opacity-40">
              <Paperclip size={20} />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!connected}
              maxLength={2000}
              placeholder={connected ? "Message likho..." : "Connect hone ka wait..."}
              className="min-w-0 flex-1 rounded-full bg-panel2 px-4 py-2.5 text-[15px] placeholder:text-mute disabled:opacity-50"
            />
            <button type="submit" disabled={!connected || !draft.trim()} aria-label="Send" className="rounded-full bg-mint p-2.5 text-deep disabled:opacity-40">
              <Send size={18} />
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
