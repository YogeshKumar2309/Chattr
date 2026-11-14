import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import PrivacyContent from "@/components/legal/PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy Policy | Chattr",
  description: "Chattr aapki jaankari kaise use karta hai.",
};

export default function Page() {
  return (
    <LegalLayout title="Privacy Policy">
      <PrivacyContent />
    </LegalLayout>
  );
}
