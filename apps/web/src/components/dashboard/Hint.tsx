"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";
import { TERMS } from "@/content/console-help";
import { cn } from "@/lib/cn";

const WIDTH = 288;
const GAP = 6;
const EDGE = 12;

/**
 * "What is this?" beside a word: a small button that opens a short explanation.
 *
 * Give `term` (an id from the glossary) for a word the Help page explains, or
 * `title` and children for anything else. The explanation is placed against the
 * viewport, so it is never cut off by a table or a panel with clipped corners.
 */
export function Hint({ term, title, children, className }: { term?: string; title?: string; children?: ReactNode; className?: string }) {
  const entry = term ? TERMS[term] : undefined;
  const heading = title ?? entry?.term ?? "";
  const body = children ?? entry?.short;
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ left: number; top: number; above: boolean } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const rect = button.current.getBoundingClientRect();
    const height = bubble.current?.offsetHeight ?? 120;
    const width = Math.min(WIDTH, window.innerWidth - EDGE * 2);
    const left = Math.max(EDGE, Math.min(window.innerWidth - width - EDGE, rect.left + rect.width / 2 - width / 2));
    const above = rect.bottom + GAP + height > window.innerHeight - EDGE && rect.top - GAP - height > EDGE;
    setPlace({ left, top: above ? rect.top - GAP - height : rect.bottom + GAP, above });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close();
      button.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!button.current?.contains(target) && !bubble.current?.contains(target)) close();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  if (!body) return null;
  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={(event) => {
          event.stopPropagation(); // a hint inside a clickable row or a sortable heading must not trigger it
          setOpen((o) => !o);
        }}
        // The same name everywhere, on purpose: a name with the word in it ("What is buying intent?")
        // would also answer to that word's own field or column, for a test and for voice control alike.
        aria-label="What does this mean?"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        className={cn("inline-grid size-4 shrink-0 place-items-center rounded-full align-[-2px] text-fg-3 transition-colors hover:text-accent", open && "text-accent", className)}
      >
        <CircleHelp className="size-3.5" aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          // Inside `.app` so the bubble takes the console's fonts and theme colours.
          <div className="app contents">
            <div
              ref={bubble}
              id={id}
              role="note"
              style={{ left: place?.left ?? 0, top: place?.top ?? 0, width: `min(${WIDTH}px, calc(100vw - ${EDGE * 2}px))`, visibility: place ? "visible" : "hidden" }}
              className="fixed z-[90] animate-pop rounded-overlay border border-line bg-surface p-3 text-left normal-case tracking-normal shadow-overlay"
            >
              {heading && <p className="text-[13px] font-semibold text-fg">{heading}</p>}
              <p className={cn("text-[12.5px] font-normal leading-[18px] text-fg-2", heading && "mt-1")}>{body}</p>
              {entry && (
                <Link href={`/dashboard/help#${entry.id}`} className="mt-2 inline-block text-[12.5px] font-medium text-accent hover:underline">
                  More in Help
                </Link>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
