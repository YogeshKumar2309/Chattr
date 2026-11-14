import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { siteConfig } from "./legal/siteConfig";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 pb-10 text-sm text-ink/75">
      <div className="flex items-start gap-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
        <p className="max-w-2xl">
          Messages sirf dono browsers mein {siteConfig.retentionHours} ghante tak rehte hain, phir apne aap delete ho
          jate hain. Kisi ko bhi report ya block kar sakte ho. Video chat mein apni personal jaankari share mat karo.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="underline-offset-4 hover:text-white hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-ink/60">
          © {new Date().getFullYear()} {siteConfig.name}. {siteConfig.minAge}+ only.
        </p>
      </div>
    </footer>
  );
}