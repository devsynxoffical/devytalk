"use client";

import { useEffect, useState } from "react";
import { Delete, Mic, MicOff, Pause, Phone, PhoneOff, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
const TRANSCRIPT = [
  { who: "Customer", text: "Hi, I'm calling about upgrading our plan." },
  { who: "You", text: "Happy to help! How many agents are on your team?" },
  { who: "Customer", text: "Twelve right now, growing to twenty this quarter." },
  { who: "AI", text: "Intent: upgrade · Sentiment: positive · Suggest: Growth plan" },
];

type CallState = "idle" | "ringing" | "live" | "ended";

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Interactive, fully simulated softphone used on the marketing site. No audio or network involved. */
export function Softphone() {
  const [number, setNumber] = useState("+1 415 555 0134");
  const [state, setState] = useState<CallState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (state === "ringing") {
      const t = setTimeout(() => setState("live"), 1800);
      return () => clearTimeout(t);
    }
    if (state === "live" && !held) {
      const t = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(t);
    }
    if (state === "ended") {
      const t = setTimeout(() => setState("idle"), 2200);
      return () => clearTimeout(t);
    }
  }, [state, held]);

  const start = () => {
    if (!number.replace(/\D/g, "")) return;
    setSeconds(0);
    setMuted(false);
    setHeld(false);
    setState("ringing");
  };
  const press = (k: string) => state === "idle" && setNumber((n) => (n.length < 20 ? n + k : n));
  const shown = Math.min(TRANSCRIPT.length, Math.floor(seconds / 2));

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-300/40 to-sky-300/30 blur-2xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink-800/90 p-5 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between text-xs text-ink-300">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand-400" /> Available
          </span>
          <span>Sales line · US</span>
        </div>

        <div className="mt-5 text-center" aria-live="polite">
          <p className="text-xs uppercase tracking-widest text-ink-400">
            {state === "idle" && "Enter a number"}
            {state === "ringing" && "Calling…"}
            {state === "live" && (held ? "On hold" : "Connected")}
            {state === "ended" && "Call ended"}
          </p>
          <p className="mt-1 h-9 truncate text-2xl font-bold tracking-wide text-white">{number || " "}</p>
          <p className="h-5 font-mono text-sm text-brand-300">{state === "live" || state === "ended" ? formatTime(seconds) : ""}</p>
        </div>

        {state === "idle" || state === "ended" ? (
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => press(k)}
                className="h-12 rounded-2xl bg-white/5 text-lg font-semibold text-white transition-colors hover:bg-white/10 active:bg-white/15"
              >
                {k}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 h-[11.25rem] space-y-2 overflow-hidden rounded-2xl bg-ink-900/70 p-3 text-left">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-ink-400">
              <Sparkles className="size-3 text-lime-400" /> Live transcript
            </p>
            {state === "ringing" && <p className="text-sm text-ink-400">Waiting for answer…</p>}
            {TRANSCRIPT.slice(0, shown).map((line) => (
              <p
                key={line.text}
                className={cn(
                  "text-sm",
                  line.who === "AI" ? "rounded-lg bg-lime-400/15 px-2 py-1 text-lime-300" : "text-ink-200",
                )}
              >
                <span className="font-semibold text-white">{line.who}: </span>
                {line.text}
              </p>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-4">
          {state === "live" ? (
            <>
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-pressed={muted}
                aria-label={muted ? "Unmute" : "Mute"}
                className={cn("grid size-12 place-items-center rounded-full", muted ? "bg-white text-ink-900" : "bg-white/10 text-white")}
              >
                {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </button>
              <button
                type="button"
                onClick={() => setState("ended")}
                aria-label="Hang up"
                className="grid size-14 place-items-center rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                <PhoneOff className="size-6" />
              </button>
              <button
                type="button"
                onClick={() => setHeld((h) => !h)}
                aria-pressed={held}
                aria-label={held ? "Resume" : "Hold"}
                className={cn("grid size-12 place-items-center rounded-full", held ? "bg-white text-ink-900" : "bg-white/10 text-white")}
              >
                {held ? <Play className="size-5" /> : <Pause className="size-5" />}
              </button>
            </>
          ) : state === "ringing" ? (
            <button
              type="button"
              onClick={() => setState("ended")}
              aria-label="Cancel call"
              className="relative grid size-14 place-items-center rounded-full bg-red-500 text-white"
            >
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-red-500" aria-hidden="true" />
              <PhoneOff className="relative size-6" />
            </button>
          ) : (
            <>
              <span className="size-12" aria-hidden="true" />
              <button
                type="button"
                onClick={start}
                aria-label="Call"
                className="grid size-14 place-items-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/40 hover:bg-brand-400"
              >
                <Phone className="size-6" />
              </button>
              <button
                type="button"
                onClick={() => setNumber((n) => n.slice(0, -1))}
                aria-label="Delete digit"
                className="grid size-12 place-items-center rounded-full text-ink-300 hover:text-white"
              >
                <Delete className="size-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
