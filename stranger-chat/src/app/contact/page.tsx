import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import ContactContent from "@/components/legal/ContactContent";

export const metadata: Metadata = {
  title: "Contact | Chattr",
  description: "Chattr team se sampark karo.",
};

export default function Page() {
  return (
    <LegalLayout title="Contact">
      <ContactContent />
    </LegalLayout>
  );
}