"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";
import { Check, Copy, MessageSquare, Mic, Search, Trash2, UserPlus, Video, X } from "lucide-react";
import Logo from "./Logo";
import IncomingCall, { type Call } from "./IncomingCall";
import { api, clearIdentity, createIdentity, getStoredIdentity, type Identity } from "@/lib/identity";
import { createSocket } from "@/lib/socket";

interface Person { uid: string; name: string }
interface Req extends Person { id: string }
interface Data { friends: Person[]; incoming: Req[]; outgoing: Req[] }
interface Found extends Person { isFriend: boolean; isSelf: boolean }

export default function FriendsPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [id, setId] = useState<Identity | null>(null);
  const [data, setData] = useState<Data>({ friends: [], incoming: [], outgoing: [] });
  const [online, setOnline] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [call, setCall] = useState<Call | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const idRef = useRef<Identity | null>(null);
  const friendsRef = useRef<string[]>([]);

  const load = useCallback(async () => {
    const me = idRef.current;
    if (!me) return;
    try {
      const d = await api<Data>("/api/friends", me);
      setData(d);
      friendsRef.current = d.friends.map((f) => f.uid);
      socketRef.current?.emit("presence", friendsRef.current, setOnline);
    } catch {}
  }, []);

  // identity verify + socket
  useEffect(() => {
    let alive = true;
    (async () => {
      let me = getStoredIdentity();
      if (me) {
        try {
          await api("/api/me", me);
        } catch {
          clearIdentity(); // DB reset hua ya ID invalid
          me = null;
        }
      }
      if (!alive) return;
      idRef.current = me;
      setId(me);
      setReady(true);
      if (!me) return;
      const s = createSocket(me);
      socketRef.current = s;
      s.on("friends:update", load);
      s.on("direct:incoming", (c: Call) => setCall(c));
      s.on("connect", load);
    })();
    const poll = setInterval(() => {
      if (friendsRef.current.length) socketRef.current?.emit("presence", friendsRef.current, setOnline);
    }, 15_000);
    return () => {
      alive = false;
      clearInterval(poll);
      socketRef.current?.disconnect();
    };
  }, [load]);

  async function create() {
    setMsg("");
    try {
      const me = await createIdentity(name.trim() || undefined);
      idRef.current = me;
      setId(me);
      const s = createSocket(me);
      socketRef.current = s;
      s.on("friends:update", load);
      s.on("direct:incoming", (c: Call) => setCall(c));
      s.on("connect", load);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setMsg("");
    setFound(null);
    try {
      setFound(await api<Found>(`/api/users/search?uid=${encodeURIComponent(query.trim())}`, id));
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function act(fn: () => Promise<unknown>, ok?: string) {
    try {
      await fn();
      if (ok) setMsg(ok);
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  const sendRequest = (uid: string) =>
    act(async () => {
      const r = await api<{ status: string }>("/api/friends/request", id!, { method: "POST", body: { to: uid } });
      setFound(null);
      setQuery("");
      setMsg(r.status === "accepted" ? "Ab tum friends ho." : "Request bhej di.");
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id!.uid);
    } catch {
      window.prompt("ID copy karo:", id!.uid);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-2xl bg-panel p-5">
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="min-h-dvh bg-deep">
      {call && (
        <IncomingCall
          call={call}
          onAccept={() => router.push(`/chat?accept=${call.fromUid}&mode=${call.mode}`)}
          onDecline={() => {
            socketRef.current?.emit("direct:decline", { fromUid: call.fromUid });
            setCall(null);
          }}
        />
      )}
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <Logo />
        <button onClick={() => router.push("/chat")} className="rounded-full bg-pink px-5 py-2 font-display text-sm font-bold text-deep hover:brightness-110">
          Random chat
        </button>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pb-16">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Friends</h1>
        {msg && <p role="status" className="rounded-lg bg-panel2 px-3 py-2 text-sm">{msg}</p>}

        {!ready ? null : !id ? (
          <Section title="Apni unique ID banao">
            <p className="mb-4 max-w-md text-sm text-mute">
              Email ya password nahi chahiye. ID tumhare browser mein save hoti hai. Browser data clear karne par ID
              chali jayegi, isliye ID kahin likh lena.
            </p>
            <div className="flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Naam (optional)" className="min-w-0 flex-1 rounded-full bg-panel2 px-4 py-2.5 placeholder:text-mute" />
              <button onClick={create} className="rounded-full bg-mint px-5 py-2.5 font-display font-bold text-deep hover:brightness-110">
                ID banao
              </button>
            </div>
          </Section>
        ) : (
          <>
            <Section title="Tumhari ID">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-3xl font-extrabold tracking-widest text-mint">{id.uid}</p>
                  <p className="text-sm text-mute">{id.name}. Ye ID friend ko bhejo.</p>
                </div>
                <button onClick={copy} className="inline-flex items-center gap-2 rounded-full bg-panel2 px-4 py-2 text-sm hover:bg-panel2/70">
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copy ho gaya" : "Copy"}
                </button>
              </div>
            </Section>

            <Section title="ID se dhoondo">
              <form onSubmit={search} className="flex gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value.toUpperCase())} maxLength={12} placeholder="Friend ki ID" className="min-w-0 flex-1 rounded-full bg-panel2 px-4 py-2.5 tracking-widest placeholder:tracking-normal placeholder:text-mute" />
                <button aria-label="Search" className="rounded-full bg-panel2 p-3 hover:bg-panel2/70"><Search size={18} /></button>
              </form>
              {found && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-panel2 p-3">
                  <div>
                    <p className="font-medium">{found.name}</p>
                    <p className="text-sm tracking-widest text-mute">{found.uid}</p>
                  </div>
                  {found.isSelf ? (
                    <span className="text-sm text-mute">Ye tum ho</span>
                  ) : found.isFriend ? (
                    <span className="text-sm text-mint">Friend hai</span>
                  ) : (
                    <button onClick={() => sendRequest(found.uid)} className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-sm font-medium text-deep hover:brightness-110">
                      <UserPlus size={16} /> Request bhejo
                    </button>
                  )}
                </div>
              )}
            </Section>

            {data.incoming.length > 0 && (
              <Section title={`Requests (${data.incoming.length})`}>
                <ul className="space-y-2">
                  {data.incoming.map((r) => (
                    <li key={r.id} className="flex items-center justify-between rounded-xl bg-panel2 p-3">
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-sm tracking-widest text-mute">{r.uid}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => act(() => api("/api/friends/respond", id, { method: "POST", body: { id: r.id, action: "reject" } }))} aria-label="Reject" className="rounded-full bg-black/30 p-2.5 hover:bg-black/50"><X size={16} /></button>
                        <button onClick={() => act(() => api("/api/friends/respond", id, { method: "POST", body: { id: r.id, action: "accept" } }), "Friend add ho gaya.")} aria-label="Accept" className="rounded-full bg-mint p-2.5 text-deep hover:brightness-110"><Check size={16} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title={`Tumhare friends (${data.friends.length})`}>
              {data.friends.length === 0 ? (
                <p className="text-sm text-mute">Abhi koi friend nahi. Upar kisi ki ID dhoondo ya random chat mein "Add friend" dabao.</p>
              ) : (
                <ul className="space-y-2">
                  {data.friends.map((f) => {
                    const on = online.includes(f.uid);
                    return (
                      <li key={f.uid} className="flex items-center justify-between gap-2 rounded-xl bg-panel2 p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={`size-2.5 shrink-0 rounded-full ${on ? "bg-mint" : "bg-white/25"}`} title={on ? "Online" : "Offline"} />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{f.name}</p>
                            <p className="text-xs tracking-widest text-mute">{f.uid}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          {([["text", MessageSquare, "Chat"], ["audio", Mic, "Audio call"], ["video", Video, "Video call"]] as const).map(([m, Icon, label]) => (
                            <button key={m} disabled={!on && m !== "text"} onClick={() => router.push(`/chat?friend=${f.uid}&mode=${m}`)} aria-label={`${f.name} ke saath ${label}`} title={label} className="rounded-full bg-panel p-2.5 hover:bg-black/30 disabled:opacity-30">
                              <Icon size={16} />
                            </button>
                          ))}
                          <button onClick={() => confirm(`${f.name} ko friends se hatayein?`) && act(() => api("/api/friends", id, { method: "DELETE", body: { uid: f.uid } }))} aria-label="Friend hatao" className="rounded-full bg-panel p-2.5 text-pink hover:bg-black/30">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>

            {data.outgoing.length > 0 && (
              <p className="px-1 text-sm text-mute">Bheji hui requests: {data.outgoing.map((r) => r.name).join(", ")}</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
