import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="November 3, 2026"
      sections={[
        { heading: "What we collect", text: "Account details you give us (name, work email, company), usage data needed to run the service, and call metadata and recordings that you choose to store." },
        { heading: "How we use it", text: "To provide and improve DevyTalk, to support you, to bill you and to keep the platform secure. We do not sell personal data." },
        { heading: "Where it is stored", text: "Customer data is stored in the EU or US region selected for your workspace and is encrypted in transit and at rest." },
        { heading: "Your rights", text: "You can access, correct, export or delete your data at any time from your workspace settings or by contacting privacy@devytalk.example." },
        { heading: "Retention", text: "We keep data for as long as your account is active, or as configured in your retention settings, and delete it after account closure." },
      ]}
    />
  );
}
