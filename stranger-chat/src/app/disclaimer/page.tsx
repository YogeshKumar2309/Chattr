import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import DisclaimerContent from "@/components/legal/DisclaimerContent";

export const metadata: Metadata = {
  title: "Disclaimer | Chattr",
  description: "Chattr par anjaan logon se baat karne se pehle zaroori jaankari.",
};

export default function Page() {
  return (
    <LegalLayout title="Disclaimer">
      <DisclaimerContent />
    </LegalLayout>
  );
}