"use client";

import { useId, useState } from "react";

const MANUAL_DIAL_SECONDS = 25;
const POWER_DIAL_SECONDS = 4;
const WORKING_DAYS = 21;

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
};

function Slider({ label, value, min, max, step = 1, format, onChange }: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-ink-700">
          {label}
        </label>
        <span className="rounded-lg bg-ink-50 px-2.5 py-1 font-mono text-sm font-semibold text-ink-900">{format ? format(value) : value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-brand-600"
        style={{ background: `linear-gradient(to right, var(--color-brand-500) ${pct}%, var(--color-ink-100) ${pct}%)` }}
      />
    </div>
  );
}

export function RoiCalculator() {
  const [reps, setReps] = useState(10);
  const [calls, setCalls] = useState(60);
  const [rate, setRate] = useState(45);

  const savedHoursMonth = Math.round((reps * calls * (MANUAL_DIAL_SECONDS - POWER_DIAL_SECONDS) * WORKING_DAYS) / 3600);
  const extraCallsMonth = Math.round((savedHoursMonth * 3600) / 180);
  const savedMoney = savedHoursMonth * rate;

  const results = [
    { label: "Hours given back each month", value: savedHoursMonth.toLocaleString("en-US") },
    { label: "Extra conversations possible", value: extraCallsMonth.toLocaleString("en-US") },
    { label: "Value of time saved / month", value: `$${savedMoney.toLocaleString("en-US")}` },
  ];

  return (
    <div className="shadow-card grid grid-cols-1 [&>*]:min-w-0 gap-8 rounded-[1.75rem] border border-ink-100 bg-white p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-8">
        <Slider label="Reps on the phone" value={reps} min={1} max={200} onChange={setReps} />
        <Slider label="Outbound calls per rep per day" value={calls} min={10} max={300} step={5} onChange={setCalls} />
        <Slider label="Loaded cost per rep hour" value={rate} min={15} max={150} step={5} format={(v) => `$${v}`} onChange={setRate} />
        <p className="text-xs leading-relaxed text-ink-400">
          Assumes {MANUAL_DIAL_SECONDS}s to dial and log a call by hand vs. {POWER_DIAL_SECONDS}s with the Power Dialer, {WORKING_DAYS} working days and
          3-minute conversations.
        </p>
      </div>
      <div className="bg-mesh-light grid gap-3 rounded-2xl p-3" aria-live="polite">
        {results.map((r, i) => (
          <div key={r.label} className={i === 2 ? "rounded-xl bg-ink-900 p-5 text-white" : "rounded-xl bg-white/90 p-5 backdrop-blur"}>
            <p className={i === 2 ? "text-sm text-white/70" : "text-sm text-ink-500"}>{r.label}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight">{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
