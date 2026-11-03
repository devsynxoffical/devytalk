"use client";

import { useId, useState } from "react";

const MANUAL_DIAL_SECONDS = 25;
const POWER_DIAL_SECONDS = 4;
const WORKING_DAYS = 21;

function Slider({ label, value, min, max, step = 1, suffix, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-ink-200">{label}</label>
        <span className="font-mono text-lg font-bold text-white">{value}{suffix}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-400"
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

  return (
    <div className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10 lg:grid-cols-2">
      <div className="space-y-7">
        <Slider label="Reps on the phone" value={reps} min={1} max={200} onChange={setReps} />
        <Slider label="Outbound calls per rep per day" value={calls} min={10} max={300} step={5} onChange={setCalls} />
        <Slider label="Loaded cost per rep hour" value={rate} min={15} max={150} step={5} suffix=" $" onChange={setRate} />
        <p className="text-xs text-ink-400">
          Assumes {MANUAL_DIAL_SECONDS}s to dial and log a call by hand vs. {POWER_DIAL_SECONDS}s with the Power Dialer, {WORKING_DAYS} working days and 3-minute conversations.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1" aria-live="polite">
        <div className="rounded-2xl bg-brand-500/15 p-5">
          <p className="text-sm text-brand-200">Hours given back each month</p>
          <p className="mt-1 text-4xl font-extrabold text-white">{savedHoursMonth.toLocaleString("en-US")}</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-5">
          <p className="text-sm text-ink-300">Extra conversations possible</p>
          <p className="mt-1 text-4xl font-extrabold text-white">{extraCallsMonth.toLocaleString("en-US")}</p>
        </div>
        <div className="rounded-2xl bg-accent-400/15 p-5">
          <p className="text-sm text-accent-300">Value of time saved</p>
          <p className="mt-1 text-4xl font-extrabold text-white">${savedMoney.toLocaleString("en-US")}</p>
        </div>
      </div>
    </div>
  );
}
