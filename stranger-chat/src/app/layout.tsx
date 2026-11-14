import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-display", weight: ["500", "700", "800"] });
const body = DM_Sans({ subsets: ["latin"], variable: "--f-body" });

export const metadata: Metadata = {
  title: "Stranger Chat — random chat, bina sign-up",
  description:
    "Random user se text, audio ya video chat. Direct P2P connection, messages server par save nahi hote.",
};
export const viewport: Viewport = { themeColor: "#2b3cff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
