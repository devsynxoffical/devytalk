"use client";

import { use, useCallback, useEffect, useState, type FormEvent } from "react";
import { Download } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { money } from "@/lib/api/format";
import { rulesSchema, type Rules } from "@/lib/api/schemas";
import { Banner, Button, ErrorState, Field, Input, Loading, NoticeBar, buttonClass, type Notice } from "@/components/dashboard/ui";
import { cn } from "@/lib/cn";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_TEXT = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

type Form = { days: string[]; start: string; end: string; attempts: string; retry: string; perDay: string; perMonth: string; budget: string; meetings: string; optOut: string };

const text = (value: number | null) => (value === null ? "" : String(value));

function toForm(rules: Rules): Form {
  const r = rules.rules;
  return {
    days: r.calling_days,
    start: r.window_start,
    end: r.window_end,
    attempts: String(r.max_attempts),
    retry: String(r.retry_delay_minutes),
    perDay: text(r.max_calls_per_day),
    perMonth: text(r.max_calls_per_month),
    budget: text(r.budget_usd),
    meetings: text(r.stop_after_meetings),
    optOut: r.max_opt_out_rate === null ? "" : String(Math.round(r.max_opt_out_rate * 100)),
  };
}

/** Check the form and build what is sent. Blank optional fields are left out, which returns them to "no limit". */
export function buildRules(form: Form, stored: Record<string, unknown>): { body?: Record<string, unknown>; errors: Partial<Record<keyof Form, string>> } {
  const errors: Partial<Record<keyof Form, string>> = {};
  const whole = (key: keyof Form, min: number, max: number, required: boolean) => {
    const raw = (form[key] as string).trim();
    if (!raw) {
      if (required) errors[key] = "Required.";
      return undefined;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < min || n > max) {
      errors[key] = `A whole number from ${min} to ${max}.`;
      return undefined;
    }
    return n;
  };
  if (form.days.length === 0) errors.days = "Choose at least one day.";
  if (!/^\d{2}:\d{2}$/.test(form.start)) errors.start = "Use a time like 09:00.";
  if (!/^\d{2}:\d{2}$/.test(form.end)) errors.end = "Use a time like 19:00.";
  if (!errors.start && !errors.end && form.start >= form.end) errors.end = "Must be later than the start.";
  const attempts = whole("attempts", 1, 10, true);
  const retry = whole("retry", 5, 20160, true);
  const perDay = whole("perDay", 1, 1_000_000, false);
  const perMonth = whole("perMonth", 1, 10_000_000, false);
  const meetings = whole("meetings", 1, 1_000_000, false);
  const optOut = whole("optOut", 1, 100, false);
  let budget: number | undefined;
  if (form.budget.trim()) {
    budget = Number(form.budget);
    if (!Number.isFinite(budget) || budget <= 0) errors.budget = "An amount above zero, or leave empty for no budget.";
  }
  if (Object.keys(errors).length > 0) return { errors };

  // Start from what is stored so settings this form does not show (start and end dates, score weights) are kept.
  const body: Record<string, unknown> = { ...stored, calling_days: form.days.map((d) => DAYS.indexOf(d as (typeof DAYS)[number])).sort(), window_start: form.start, window_end: form.end, max_attempts: attempts, retry_delay_minutes: retry };
  const optional: [string, number | undefined][] = [["max_calls_per_day", perDay], ["max_calls_per_month", perMonth], ["budget_usd", budget], ["stop_after_meetings", meetings], ["max_opt_out_rate", optOut === undefined ? undefined : optOut / 100]];
  for (const [key, value] of optional) {
    if (value === undefined) delete body[key];
    else body[key] = value;
  }
  return { body, errors };
}

function Group({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} className="grid scroll-mt-20 grid-cols-1 gap-x-10 gap-y-4 border-t border-line py-6 first:border-0 first:pt-0 md:grid-cols-[14rem_minmax(0,1fr)]">
      <div>
        <h2 className="t-section text-fg">{title}</h2>
        <p className="t-meta mt-1">{description}</p>
      </div>
      <div className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function SettingsPage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent(use(params).name);
  const { data, error, loading, reload } = useApi(backendUrl(["campaigns", name, "rules"]), rulesSchema);
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    if (data) setForm(toForm(data));
  }, [data]);

  if (loading && !data) return <Loading what="Loading settings" strip={false} rows={6} />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data || !form) return null;

  const set = (patch: Partial<Form>) => setForm({ ...form, ...patch });
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(data));

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!data || !form) return;
    const result = buildRules(form, data.stored);
    setErrors(result.errors);
    if (!result.body) return;
    setBusy(true);
    try {
      await apiRequest(backendUrl(["campaigns", name, "rules"]), rulesSchema, { method: "PUT", body: result.body });
      setNotice({ kind: "success", text: "Calling rules saved. They apply from the next call; a running campaign does not need a restart." });
      reload();
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof ApiError ? e.message : "Something went wrong. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <NoticeBar notice={notice} onClose={closeNotice} />
      {data.stop_reason && (
        <div className="mb-5">
          <Banner tone="warn" title="This campaign paused itself">
            Reason: {data.stop_reason}. Change the rule below if you want it to continue, then start dialing again.
          </Banner>
        </div>
      )}

      <div className="rounded-panel border border-line bg-surface px-5 py-6">
        <Group id="schedule" title="Calling schedule" description="Calls are only placed on these days and inside these hours, in each lead's own time zone.">
          <div className="sm:col-span-2">
            <p className="mb-1 text-[12.5px] font-medium text-fg-2" id="days-label">
              Calling days
            </p>
            <div role="group" aria-labelledby="days-label" className="grid grid-cols-7 gap-1.5 sm:flex sm:flex-wrap">
              {DAYS.map((day) => {
                const on = form.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ days: on ? form.days.filter((d) => d !== day) : [...form.days, day] })}
                    className={cn("h-9 rounded-control border text-[13px] font-medium transition-colors max-sm:h-11 sm:w-12", on ? "border-signal bg-signal text-on-signal" : "border-line-strong bg-surface text-fg-2 hover:border-fg-3")}
                  >
                    {DAY_TEXT[day]}
                  </button>
                );
              })}
            </div>
            {errors.days && <p className="mt-1 text-[12px] font-medium text-crit">{errors.days}</p>}
          </div>
          <Field label="Earliest call" error={errors.start}>
            <Input type="time" value={form.start} onChange={(e) => set({ start: e.target.value })} className="t-figure" />
          </Field>
          <Field label="Latest call" error={errors.end}>
            <Input type="time" value={form.end} onChange={(e) => set({ end: e.target.value })} className="t-figure" />
          </Field>
        </Group>

        <Group id="attempts" title="Attempts" description="How persistent the dialer is with a lead who does not answer.">
          <Field label="Attempts per lead" hint="1 to 10" error={errors.attempts}>
            <Input type="number" inputMode="numeric" min={1} max={10} value={form.attempts} onChange={(e) => set({ attempts: e.target.value })} className="t-figure" />
          </Field>
          <Field label="Minutes between attempts" hint="At least 5" error={errors.retry}>
            <Input type="number" inputMode="numeric" min={5} value={form.retry} onChange={(e) => set({ retry: e.target.value })} className="t-figure" />
          </Field>
        </Group>

        <Group id="limits" title="Volume limits" description="Leave a field empty for no limit. When a limit is reached the campaign waits for the next day or month.">
          <Field label="Calls per day" error={errors.perDay}>
            <Input type="number" inputMode="numeric" min={1} placeholder="No limit" value={form.perDay} onChange={(e) => set({ perDay: e.target.value })} className="t-figure" />
          </Field>
          <Field label="Calls per month" error={errors.perMonth}>
            <Input type="number" inputMode="numeric" min={1} placeholder="No limit" value={form.perMonth} onChange={(e) => set({ perMonth: e.target.value })} className="t-figure" />
          </Field>
        </Group>

        <Group id="budget" title="Budget and stop conditions" description={`The campaign pauses itself when one of these is reached. Spent so far: ${money(data.spend_usd)}.`}>
          <Field label="Budget (USD)" hint="The dialer never starts a call the budget cannot cover" error={errors.budget}>
            <Input type="number" inputMode="decimal" min={0} step="0.01" placeholder="No budget" value={form.budget} onChange={(e) => set({ budget: e.target.value })} className="t-figure" />
          </Field>
          <Field label="Stop after meetings booked" error={errors.meetings}>
            <Input type="number" inputMode="numeric" min={1} placeholder="Never" value={form.meetings} onChange={(e) => set({ meetings: e.target.value })} className="t-figure" />
          </Field>
          <Field label="Stop if opt-outs exceed (%)" hint="Share of answered calls that ask not to be called again" error={errors.optOut}>
            <Input type="number" inputMode="numeric" min={1} max={100} placeholder="Never" value={form.optOut} onChange={(e) => set({ optOut: e.target.value })} className="t-figure" />
          </Field>
        </Group>

        <Group id="export" title="Export" description="Every lead with its status, last outcome, summary, next action and booked meeting.">
          <div className="sm:col-span-2">
            <a href={backendUrl(["campaigns", name, "export.csv"])} download className={buttonClass("secondary")}>
              <Download className="size-3.5" aria-hidden="true" /> Download results (CSV)
            </a>
          </div>
        </Group>
      </div>

      <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-10 -mx-4 mt-5 flex items-center justify-end gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:bottom-0">
        <p className="t-meta mr-auto">{dirty ? "You have unsaved changes." : "No changes."}</p>
        <Button onClick={() => (setForm(toForm(data)), setErrors({}))} disabled={!dirty || busy}>
          Discard
        </Button>
        <Button type="submit" variant="primary" busy={busy} disabled={!dirty}>
          Save rules
        </Button>
      </div>
    </form>
  );
}
