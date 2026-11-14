"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";
import ModePicker, { type Mode } from "./ModePicker";
import AgeCheck, { AGE_KEY } from "./AgeCheck";
import Logo, { LogoType } from "./Logo";
import ChattrMatchHero from "@/components/ChattrMatchHero";
import Footer from "./Footer";

export default function Landing() {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("text");
  const [age, setAge] = useState(false);

  useEffect(() => setAge(localStorage.getItem(AGE_KEY) === "1"), []);

  // Ek hi orchestrated moment: do log drift karte hain aur link ban jata hai
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-line", { yPercent: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" });
      gsap.set(".link-path", { strokeDasharray: 8 });
      gsap.to(".link-path", { strokeDashoffset: -64, duration: 3, repeat: -1, ease: "none" });
      gsap.to(".dot-a", { x: 26, y: -18, duration: 3.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to(".dot-b", { x: -22, y: 20, duration: 3.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.fromTo(".pulse", { scale: 0.4, opacity: 0.7 }, { scale: 2.6, opacity: 0, duration: 2.2, repeat: -1, ease: "power1.out", transformOrigin: "50% 50%" });
    }, root);
    return () => ctx.revert();
  }, []);



  return (
 <div ref={root} className="min-h-dvh overflow-x-clip bg-cobalt text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
       <Logo logoType={LogoType.full}/>

        {/* <Link href="/friends" className="inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-sm hover:bg-black/40">
          <Users size={16} /> Friends
        </Link> */}
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-6 lg:grid-cols-[1.1fr_.9fr] lg:pt-14">
        <section>
          <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            <span className="hero-line block">Kisi se bhi</span>
            <span className="hero-line block">baat karo.</span>
            <span className="hero-line block text-ink/60">Bina sign-up.</span>
          </h1>
          <p className="hero-line mt-6 max-w-md text-lg text-ink/85">
            Random user se text, audio ya video chat. Tumhara message server se nahi guzarta. Seedha browser se
            browser.
          </p>

          <div className="hero-line mt-8 flex flex-col gap-5">
            <ModePicker value={mode} onChange={setMode} />
            <AgeCheck checked={age} onChange={setAge} />
            <div className="flex flex-wrap items-center gap-4">
              <button
                disabled={!age}
                onClick={() => router.push(`/chat?mode=${mode}`)}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-display text-lg font-bold text-deep transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Chat shuru karo <ArrowRight size={20} />
              </button>
              <Link href="/friends" className="text-sm underline underline-offset-4 hover:text-white">
                Friend ID banao
              </Link>
            </div>
          </div>
        </section>



     <div className="flex min-w-0 items-center justify-center">
  <ChattrMatchHero />
</div>
      </main>

      {/* <footer className="mx-auto flex max-w-6xl items-start gap-3 px-6 pb-10 text-sm text-ink/75">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
        <p className="max-w-2xl">
          Messages sirf dono browsers mein 24 ghante tak rehte hain, phir apne aap delete ho jate hain. Kisi ko bhi
          report ya block kar sakte ho. Video chat mein apni personal jaankari share mat karo.
        </p>
      </footer> */}

      <Footer/>
    </div>
  );
}
