"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { campaignSchema, statusSchema } from "@/lib/api/schemas";
import { useAccess } from "@/components/dashboard/access";
import { Banner, Button, Field, Input, PageHeader, Select, Textarea, buttonClass } from "@/components/dashboard/ui";
import { cn } from "@/lib/cn";

const GOALS: [string, string][] = [
  ["book_meeting", "Book a meeting or demo"],
  ["close_sale", "Close a sale on the call"],
  ["qualify_lead", "Find out whether the prospect is a fit"],
  ["collect_info", "Collect or confirm information"],
  ["reactivate", "Win back a former customer"],
  ["other", "Something else"],
];
const FALLBACK_LANGUAGES = [{ code: "en", name: "English" }];

export type BriefForm = { name: string; company: string; description: string; offer: string; customer: string; goal: string; agent: string; language: string; also: string[]; reasons: string; pricing: string; script: string };
type Errors = Partial<Record<keyof BriefForm, string>>;

/** The engine's request for a new campaign, or what must be fixed first. */
export function buildBrief(form: BriefForm): { body?: Record<string, unknown>; errors: Errors } {
  const errors: Errors = {};
  const name = form.name.trim();
  if (!name) errors.name = "Give the campaign a name.";
  else if (name.toLowerCase() === "new") errors.name = "Choose a different name.";
  else if (name.includes("/")) errors.name = "The name cannot contain a slash.";
  if (!form.company.trim()) errors.company = "Enter the company the agent calls for.";
  if (!form.offer.trim()) errors.offer = "Say what the agent is offering.";
  if (!form.agent.trim()) errors.agent = "Give the agent a first name.";
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    body: {
      name,
      company_name: form.company.trim(),
      company_description: form.description.trim(),
      offer_summary: form.offer.trim(),
      target_customer: form.customer.trim(),
      call_goal: form.goal,
      agent_name: form.agent.trim(),
      language: form.language,
      additional_languages: form.also.filter((code) => code !== form.language),
      value_props: form.reasons.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 8),
      pricing_and_terms: form.pricing.trim(),
      script_text: form.script.trim(),
    },
  };
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-x-10 gap-y-4 border-t border-line py-6 first:border-0 first:pt-0 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <div>
        <h2 className="t-section text-fg">{title}</h2>
        <p className="t-meta mt-1">{description}</p>
      </div>
      <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">{children}</div>
    </section>
  );
}

export default function NewCampaignPage() {
  const router = useRouter();
  const { me, isAdmin } = useAccess();
  const status = useApi(backendUrl(["status"]), statusSchema);
  const languages = status.data?.languages ?? FALLBACK_LANGUAGES;
  const [form, setForm] = useState<BriefForm>({ name: "", company: "", description: "", offer: "", customer: "", goal: "book_meeting", agent: "Alex", language: "en", also: [], reasons: "", pricing: "", script: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const set = (key: keyof BriefForm) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function create(event: FormEvent) {
    event.preventDefault();
    const built = buildBrief(form);
    setErrors(built.errors);
    setFailure(null);
    if (!built.body) return;
    setBusy(true);
    try {
      const campaign = await apiRequest(backendUrl(["campaign-briefs"]), campaignSchema, { method: "POST", body: built.body });
      router.push(`/dashboard/campaigns/${encodeURIComponent(campaign.name)}`);
    } catch (e) {
      const text = e instanceof ApiError ? e.message : "Something went wrong. Try again.";
      if (e instanceof ApiError && e.status === 409) setErrors({ name: "A campaign with this name already exists." });
      else setFailure(text[0].toUpperCase() + text.slice(1));
      setBusy(false);
    }
  }

  if (me && !isAdmin) {
    return (
      <div className="max-w-2xl space-y-5">
        <PageHeader title="New campaign" />
        <Banner tone="warn" title="Only an admin can create a campaign" role="alert">
          Ask an admin to create it; you can then run it.
        </Banner>
      </div>
    );
  }

  return (
    <form onSubmit={create} noValidate className="space-y-6">
      <PageHeader title="New campaign" description="Tell the agent who it calls for and what it offers. It starts from exactly what you write here and invents nothing. You can improve the playbook later from your documents and from real calls." />
      <div className="rounded-panel border border-line bg-surface px-5 py-6">
        <Section title="Campaign" description="The name is how you find it in the console. Prospects never hear it.">
          <Field label="Campaign name" error={errors.name} className="sm:col-span-2">
            <Input value={form.name} onChange={set("name")} maxLength={120} placeholder="Accounting firms, spring" autoFocus />
          </Field>
          <Field label="Goal of a call" className="sm:col-span-2">
            <Select value={form.goal} onChange={set("goal")}>
              {GOALS.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </Select>
          </Field>
        </Section>

        <Section title="Your business" description="What the agent may say about you. Leave a field empty rather than guess: the agent will say it does not have that information.">
          <Field label="Company name" error={errors.company}>
            <Input value={form.company} onChange={set("company")} maxLength={160} autoComplete="organization" />
          </Field>
          <Field label="Who you sell to (optional)">
            <Input value={form.customer} onChange={set("customer")} maxLength={500} placeholder="Accounting firms with 3 to 30 staff" />
          </Field>
          <Field label="What the company does (optional)" className="sm:col-span-2">
            <Textarea rows={2} value={form.description} onChange={set("description")} maxLength={1000} />
          </Field>
          <Field label="What the agent offers" error={errors.offer} className="sm:col-span-2">
            <Textarea rows={3} value={form.offer} onChange={set("offer")} maxLength={1500} placeholder="A 20-minute demo of our bookkeeping service, which takes over monthly reconciliation for a fixed price." />
          </Field>
          <Field label="Reasons to buy, one per line (optional)" className="sm:col-span-2">
            <Textarea rows={3} value={form.reasons} onChange={set("reasons")} />
          </Field>
          <Field label="Prices and terms the agent may state (optional)" hint="Exactly as it may be said on a call. Empty means the agent does not quote prices." className="sm:col-span-2">
            <Textarea rows={2} value={form.pricing} onChange={set("pricing")} maxLength={1500} />
          </Field>
        </Section>

        <Section title="The agent" description="It always says it is an AI assistant when it introduces itself.">
          <Field label="Agent's first name" error={errors.agent}>
            <Input value={form.agent} onChange={set("agent")} maxLength={60} />
          </Field>
          <Field label="Opening language">
            <Select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value, also: f.also.filter((code) => code !== e.target.value) }))}>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          {languages.length > 1 && (
            <div className="sm:col-span-2">
              <p className="mb-1 text-[12.5px] font-medium text-fg-2" id="also-label">
                Also switches to, when the prospect speaks it
              </p>
              <div role="group" aria-labelledby="also-label" className="flex flex-wrap gap-1.5">
                {languages
                  .filter((l) => l.code !== form.language)
                  .map((l) => {
                    const on = form.also.includes(l.code);
                    return (
                      <button
                        key={l.code}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setForm((f) => ({ ...f, also: on ? f.also.filter((code) => code !== l.code) : [...f.also, l.code] }))}
                        className={cn("h-9 rounded-control border px-3 text-[13px] font-medium transition-colors max-sm:h-11", on ? "border-signal bg-signal text-on-signal" : "border-line-strong bg-surface text-fg-2 hover:border-fg-3")}
                      >
                        {l.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </Section>

        <Section title="Script or notes (optional)" description="Paste an existing call script or notes. They are kept with the campaign and used when you build a draft playbook with the AI model under Knowledge.">
          <Field label="Script or notes" className="sm:col-span-2">
            <Textarea rows={6} value={form.script} onChange={set("script")} maxLength={20000} />
          </Field>
        </Section>
      </div>

      {failure && (
        <Banner tone="crit" title="The campaign was not created" role="alert">
          {failure}
        </Banner>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" busy={busy}>
          Create campaign
        </Button>
        <Link href="/dashboard/campaigns" className={buttonClass("ghost")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
