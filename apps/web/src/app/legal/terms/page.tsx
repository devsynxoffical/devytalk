import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      updated="November 3, 2026"
      sections={[
        { heading: "The service", text: "DevyTalk provides cloud telephony, messaging and analytics software on a subscription basis." },
        { heading: "Your account", text: "You are responsible for activity in your workspace and for keeping credentials secure." },
        { heading: "Acceptable use", text: "You must comply with telemarketing, consent and recording laws in every country you call. Spam and abusive calling are prohibited." },
        { heading: "Billing", text: "Subscriptions are billed in advance per user. Usage such as outbound minutes is billed in arrears." },
        { heading: "Termination", text: "You can cancel at any time. We may suspend accounts that breach these terms." },
      ]}
    />
  );
}
