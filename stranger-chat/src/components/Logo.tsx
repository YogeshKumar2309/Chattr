// src/components/Logo.tsx
import Link from "next/link";
import Image from "next/image";

export enum LogoType {
  main = "main",
  full = "full",
}

type LogoProps = {
  logoType?: LogoType;
  /** Wrap in a link to "/" — set false when the parent already provides a link */
  asLink?: boolean;
  ariaLabel?: string;
};

export default function Logo({
  logoType = LogoType.main,
  asLink = true,
  ariaLabel = "Chattr home",
}: LogoProps) {
  const src = logoType === LogoType.main ? "/logo-icon.svg" : "/logo-full.svg";
  const sizeClass = logoType === LogoType.main ? "h-16 w-16" : "h-20 w-96";

  const content = (
    <Image
      src={src}
      alt=""
      width={logoType === LogoType.main ? 64 : 384}
      height={logoType === LogoType.main ? 64 : 80}
      className={`object-cover ${sizeClass}`}
      priority
    />
  );

  const className =
    "inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight";

  if (!asLink) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link href="/" aria-label={ariaLabel} className={className}>
      {content}
    </Link>
  );
}