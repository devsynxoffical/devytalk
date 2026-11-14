"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui";

/** A value to paste somewhere else, with a copy button. Selectable when copying is not available. */
export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false); // the value stays selectable in the field
    }
  }
  return (
    <div>
      <p className="mb-1 text-[12.5px] font-medium text-fg-2">{label}</p>
      <div className="flex items-stretch gap-2">
        <code className="t-figure flex min-w-0 flex-1 items-center overflow-x-auto rounded-control border border-line-strong bg-sunken px-2.5 text-[12.5px] whitespace-nowrap text-fg select-all" data-testid="copy-value">
          {value}
        </code>
        <Button onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
