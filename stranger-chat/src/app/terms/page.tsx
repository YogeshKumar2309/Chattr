import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import TermsContent from "@/components/legal/TermsContent";

export const metadata: Metadata = {
  title: "Terms & Conditions | Chattr",
  description: "Chattr use karne ke niyam aur shartein.",
};

export default function Page() {
  return (
    <LegalLayout title="Terms & Conditions">
      <TermsContent />
    </LegalLayout>
  );
}