import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo, { LogoType } from "@/components/Logo";
import Footer from "@/components/Footer";
import { siteConfig } from "./siteConfig";

export default function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-cobalt text-ink">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
      <Link href="/" aria-label="Chattr home">
  <Logo asLink={false} />
</Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-sm hover:bg-black/40"
        >
          <ArrowLeft size={16} /> Wapas
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16 pt-6">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-2 text-sm text-ink/60">Last updated: {siteConfig.lastUpdated}</p>

        <div
          className="mt-8 space-y-4 leading-relaxed text-ink/85
            [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-white
            [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink
            [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6"
        >
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}