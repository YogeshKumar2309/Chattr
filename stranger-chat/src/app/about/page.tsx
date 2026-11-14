import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import AboutContent from "@/components/legal/AboutContent";

export const metadata: Metadata = {
  title: "About Chattr | Chattr",
  description: "Chattr ek free random chat platform hai: text, audio aur video, bina sign-up.",
};

export default function Page() {
  return (
    <LegalLayout title="About Chattr">
      <AboutContent />
    </LegalLayout>
  );
}