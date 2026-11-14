import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
// @ts-expect-error CSS module has no declaration file.
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--f-display",
  weight: ["500", "700", "800"],
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--f-body",
});

const siteUrl = "https://chattr.in"; // Apna actual domain lagana

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Chattr – Random Video & Text Chat Without Signup",
    template: "%s | Chattr",
  },

  description:
    "Meet new people instantly with Chattr. Enjoy random text, audio and video chats without registration. Connect directly with people around the world.",

  applicationName: "Chattr",

  keywords: [
    "random chat",
    "stranger chat",
    "random video chat",
    "random text chat",
    "chat without signup",
    "talk to strangers",
    "online video chat",
    "Chattr",
  ],

  authors: [{ name: "Chattr" }],
  creator: "Chattr",
  publisher: "Chattr",

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      { url: "/favicon.svg" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },

  openGraph: {
    type: "website",
    url: "/",
    siteName: "Chattr",
    title: "Chattr – Meet. Chat. Connect.",
    description:
      "Meet strangers and start random text, audio or video chats instantly. No signup required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Chattr – Meet. Chat. Connect.",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Chattr – Random Chat Without Signup",
    description:
      "Meet new people through random text, audio and video chat.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#2b3cff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
