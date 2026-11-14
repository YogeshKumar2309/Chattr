"use client";

import React, { useEffect, useState } from "react";

/* Random-chat front page animation:
   1) radar scans a crowd of strangers
   2) two people get matched, a line connects them
   3) a short chat plays, then it loops with a new pair */

const N = 26;
const DOTS = Array.from({ length: N }, (_, i) => {
  const a = i * 2.39996; // golden angle spiral = even, natural-looking spread
  const r = 36 + Math.sqrt((i + 1) / N) * 150;
  // round: Math.cos/sin can differ in the last digits between server and browser (hydration mismatch)
  return {
    x: Math.round((220 + Math.cos(a) * r) * 100) / 100,
    y: Math.round((220 + Math.sin(a) * r) * 100) / 100,
    delay: (i % 7) * 0.45,
    size: 2.2 + (i % 4) * 0.5,
  };
});

const PAIRS: [number, number][] = [
  [4, 17],
  [9, 22],
  [2, 13],
];

type Msg = { me: boolean; t: string };
const CHATS: Msg[][] = [
  [
    { me: true, t: "Hey! Kahan se ho?" },
    { me: false, t: "Delhi se, tum? 😄" },
    { me: true, t: "Mumbai! Ye seedha P2P hai na?" },
    { me: false, t: "Haan, server beech mein nahi ⚡" },
  ],
  [
    { me: true, t: "Koi favourite song aajkal?" },
    { me: false, t: "Ek hi loop pe chal raha hoon 🎧" },
    { me: true, t: "Share kar na!" },
    { me: false, t: "Voice chat pe sunata hoon 😎" },
  ],
  [
    { me: true, t: "Kya chal raha hai?" },
    { me: false, t: "Bas coding, tum batao 👨‍💻" },
    { me: true, t: "Same yaar, chai pi rahe ho?" },
    { me: false, t: "Obviously ☕" },
  ],
];

const SEARCH_MS = 2400;
const MATCH_MS = 1300;
const CHAT_MS = 7800;

export default function ChattrMatchHero() {
  const [pair, setPair] = useState(0);
  const [phase, setPhase] = useState<0 | 1 | 2>(0); // search | match | chat
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    setPhase(0);
    setShown(0);
    setTyping(false);

    at(SEARCH_MS, () => setPhase(1));
    const c = SEARCH_MS + MATCH_MS; // chat starts
    at(c, () => setPhase(2));
    at(c + 300, () => setShown(1));
    at(c + 1300, () => setTyping(true));
    at(c + 2300, () => {
      setTyping(false);
      setShown(2);
    });
    at(c + 3600, () => setShown(3));
    at(c + 4500, () => setTyping(true));
    at(c + 5400, () => {
      setTyping(false);
      setShown(4);
    });
    at(c + CHAT_MS, () => setPair((p) => (p + 1) % PAIRS.length));

    return () => timers.forEach(clearTimeout);
  }, [pair]);

  const [ia, ib] = PAIRS[pair];
  const A = DOTS[ia];
  const B = DOTS[ib];
  const mx = (A.x + B.x) / 2;
  const my = (A.y + B.y) / 2;
  const cx = mx - (B.y - A.y) * 0.22;
  const cy = my + (B.x - A.x) * 0.22;
  const curve = `M${A.x} ${A.y} Q${cx} ${cy} ${B.x} ${B.y}`;
  const matched = phase >= 1;

  const status =
    phase === 0
      ? { text: "Kisi ko dhoondh rahe hain…", dot: "bg-amber-300" }
      : phase === 1
      ? { text: "Match mil gaya ✨", dot: "bg-pink-400" }
      : { text: "Connected · seedha browser se", dot: "bg-emerald-400" };

  const msgs = CHATS[pair].slice(0, shown);

  return (
    <section
      aria-label="Chattr live demo"
      className="chattr-root mx-auto flex w-full min-w-0 max-w-md select-none flex-col items-center gap-3 overflow-hidden"
    >
      {/* status pill */}
      <div className="flex min-w-[250px] items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-xl">
        <span className={`h-2 w-2 rounded-full ${status.dot} chattr-blink`} />
        {status.text}
      </div>

      {/* radar stage */}
      <div className="relative aspect-square w-full overflow-hidden">
        <div
          className="chattr-sweep pointer-events-none absolute inset-[5%] rounded-full transition-opacity duration-700"
          style={{ opacity: matched ? 0 : 1 }}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 440 440"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient
              id={`line-${pair}`}
              gradientUnits="userSpaceOnUse"
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
            >
              <stop offset="0%" stopColor="#FF4D9D" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#00D2FF" />
            </linearGradient>
            <radialGradient id="haloPink">
              <stop offset="0%" stopColor="#FF7AA8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FF7AA8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="haloCyan">
              <stop offset="0%" stopColor="#5CF0FF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#5CF0FF" stopOpacity="0" />
            </radialGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* pulsing radar rings */}
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx="220"
              cy="220"
              r="190"
              fill="none"
              stroke="#fff"
              strokeWidth="1"
              className="chattr-ring"
              style={{ animationDelay: `${i * 1.3}s` }}
            />
          ))}
          <circle cx="220" cy="220" r="190" fill="none" stroke="#fff" strokeOpacity="0.12" strokeDasharray="3 7" />
          <circle cx="220" cy="220" r="125" fill="none" stroke="#fff" strokeOpacity="0.1" strokeDasharray="3 7" />
          <circle cx="220" cy="220" r="60" fill="none" stroke="#fff" strokeOpacity="0.1" strokeDasharray="3 7" />

          {/* the crowd */}
          {DOTS.map((d, i) => {
            const isA = matched && i === ia;
            const isB = matched && i === ib;
            if (isA || isB) return null;
            return (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={d.size}
                fill="#fff"
                className="chattr-twinkle"
                style={{ animationDelay: `${d.delay}s` }}
              />
            );
          })}

          {/* the chosen two */}
          {matched && (
            <g key={`pair-${pair}`}>
              <path
                d={curve}
                pathLength={1}
                fill="none"
                stroke={`url(#line-${pair})`}
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#glow)"
                className="chattr-draw"
              />
              {phase === 2 && (
                <circle r="3.5" fill="#fff" filter="url(#glow)">
                  <animateMotion dur="2.2s" repeatCount="indefinite" path={curve} />
                </circle>
              )}
              {[
                { d: A, halo: "haloPink", core: "#FF007F" },
                { d: B, halo: "haloCyan", core: "#00D2FF" },
              ].map(({ d, halo, core }, k) => (
                <g key={k} className="chattr-pop" style={{ transformOrigin: `${d.x}px ${d.y}px` }}>
                  <circle cx={d.x} cy={d.y} r="26" fill={`url(#${halo})`} />
                  <circle cx={d.x} cy={d.y} r="11" fill="#fff" />
                  <circle cx={d.x} cy={d.y} r="5" fill={core} />
                </g>
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* chat card */}
      <div className="w-full rounded-3xl border border-white/25 bg-white/10 p-4 shadow-[0_20px_60px_rgba(0,0,20,0.35)] backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white/80">
          <span className="flex -space-x-1.5">
            <span className="h-5 w-5 rounded-full border-2 border-[#1a35ff] bg-pink-500" />
            <span className="h-5 w-5 rounded-full border-2 border-[#1a35ff] bg-cyan-400" />
          </span>
          {phase === 2 ? "Stranger se baat ho rahi hai" : "Chat yahan shuru hogi"}
        </div>

        <div className="flex h-[132px] flex-col justify-end gap-1.5 overflow-hidden">
          {msgs.map((m, i) => (
            <div
              key={`${pair}-${i}`}
              className={`chattr-msg max-w-[82%] rounded-2xl px-3.5 py-2 text-sm font-semibold ${
                m.me
                  ? "self-start rounded-bl-sm border border-white/25 bg-white/15 text-white"
                  : "self-end rounded-br-sm bg-white text-slate-900"
              }`}
            >
              {m.t}
            </div>
          ))}
          {typing && (
            <div className="chattr-msg flex items-center gap-1 self-end rounded-2xl rounded-br-sm bg-white/90 px-3.5 py-2.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="chattr-dot h-1.5 w-1.5 rounded-full bg-slate-500"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .chattr-sweep {
          background: conic-gradient(
            from 0deg,
            transparent 0deg 290deg,
            rgba(92, 240, 255, 0.35) 360deg
          );
          -webkit-mask: radial-gradient(circle, transparent 8%, #000 9%);
          mask: radial-gradient(circle, transparent 8%, #000 9%);
          animation: chattr-spin 3.6s linear infinite;
        }
        :global(.chattr-ring) {
          transform-box: fill-box;
          transform-origin: center;
          animation: chattr-ring 3.9s ease-out infinite;
          opacity: 0;
        }
        :global(.chattr-twinkle) {
          animation: chattr-twinkle 3.2s ease-in-out infinite;
        }
        :global(.chattr-draw) {
          stroke-dasharray: 1 1;
          animation: chattr-draw 1s ease-in-out forwards;
        }
        :global(.chattr-pop) {
          transform-box: view-box;
          animation: chattr-pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both;
        }
        :global(.chattr-msg) {
          animation: chattr-msg 0.35s ease-out both;
        }
        :global(.chattr-dot) {
          animation: chattr-bounce 0.9s ease-in-out infinite;
        }
        :global(.chattr-blink) {
          animation: chattr-twinkle 1.4s ease-in-out infinite;
        }
        @keyframes chattr-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes chattr-ring {
          0% {
            transform: scale(0.1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        @keyframes chattr-twinkle {
          0%,
          100% {
            opacity: 0.25;
          }
          50% {
            opacity: 0.95;
          }
        }
        @keyframes chattr-draw {
          from {
            stroke-dashoffset: 1;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes chattr-pop {
          from {
            transform: scale(0.2);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes chattr-msg {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes chattr-bounce {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .chattr-sweep,
          :global(.chattr-ring),
          :global(.chattr-twinkle),
          :global(.chattr-dot),
          :global(.chattr-blink) {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}