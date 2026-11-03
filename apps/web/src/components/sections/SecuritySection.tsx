import { BadgeCheck, FileLock2, KeyRound, ServerCog } from "lucide-react";
import { ComplianceBadge, complianceBadges } from "@/components/brand/ComplianceBadges";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";

const pillars = [
  { icon: BadgeCheck, title: "Independently audited", body: "Annual third-party audits and penetration tests, with reports available to customers under NDA." },
  { icon: FileLock2, title: "Privacy and GDPR", body: "A signed DPA for every customer, EU or US data residency, and tools to export or erase data on request." },
  { icon: ServerCog, title: "Encrypted everywhere", body: "TLS 1.3 in transit, AES-256 at rest for recordings and transcripts, with per-team retention policies." },
  { icon: KeyRound, title: "Access control", body: "SSO with SAML, SCIM provisioning, two-factor authentication and granular roles for every user." },
];

export function SecuritySection() {
  return (
    <section className="container-page py-16 sm:py-24">
      <SectionHeading
        layout="split"
        title="Security and compliance built into every call"
        description="Your calls carry your customers' most sensitive moments. DevyTalk protects them with enterprise-grade controls, on every plan."
      />
      <div className="relative mt-12 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-800 via-brand-600 to-sky-400 px-6 py-10 sm:px-12">
        <div className="bg-dots absolute inset-0 opacity-30 invert" aria-hidden="true" />
        <div className="absolute -bottom-24 right-10 size-72 rounded-full bg-lime-300/40 blur-3xl" aria-hidden="true" />
        <ul className="relative flex flex-wrap items-center justify-center gap-4 sm:justify-between">
          {complianceBadges.map((b) => (
            <li key={b.id}>
              <ComplianceBadge id={b.id} tone="white" />
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-12 grid grid-cols-1 [&>*]:min-w-0 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.title}>
              <span className="grid size-10 place-items-center rounded-xl border border-ink-100 text-brand-700">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-ink-900">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{p.body}</p>
            </div>
          );
        })}
      </div>
      <ButtonLink href="/demo" className="mt-10">
        Talk to our security team
      </ButtonLink>
    </section>
  );
}
