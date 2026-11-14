import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
        <circle cx="9" cy="15" r="6" fill="#ff7aa8" />
        <circle cx="21" cy="15" r="6" fill="#7ef2c8" fillOpacity=".9" />
      </svg>
      stranger
    </Link>
  );
}
