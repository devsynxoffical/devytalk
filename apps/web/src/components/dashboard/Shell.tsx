"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, LogOut } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function signOut() {
    setLeaving(true);
    await fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    router.replace("/login");
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <header className="sticky top-0 z-40 border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="DevyTalk dashboard">
            <LogoMark />
            <span className="text-lg font-bold tracking-tight text-ink-900">
              devy<span className="text-brand-600">talk</span>
            </span>
          </Link>
          <nav aria-label="Dashboard" className="flex flex-1 items-center gap-1">
            <Link
              href="/dashboard"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold",
                pathname.startsWith("/dashboard") ? "bg-ink-100 text-ink-900" : "text-ink-600 hover:bg-ink-50",
              )}
            >
              <LayoutGrid className="size-4" aria-hidden="true" /> Campaigns
            </Link>
          </nav>
          <button
            type="button"
            onClick={signOut}
            disabled={leaving}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-50"
          >
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
