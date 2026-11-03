import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { LeadForm } from "@/components/interactive/LeadForm";
import { Testimonials } from "@/components/sections/Testimonials";

export const metadata: Metadata = { title: "Start your free trial", description: "Try DevyTalk free for 14 days. No credit card required." };

export default function SignupPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink-900 pb-20 pt-32 sm:pt-40">
        <div className="absolute -left-40 top-20 size-[32rem] rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-14 lg:grid-cols-2">
          <div className="text-white">
            <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">Start calling in 5 minutes</h1>
            <p className="mt-5 max-w-lg text-lg text-ink-300">Create your workspace and get full access to DevyTalk for 14 days.</p>
            <ul className="mt-8 space-y-3">
              {["Full feature access on the Scale plan", "Free test call minutes", "No credit card required", "Cancel anytime with one click"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-ink-200">
                  <CheckCircle2 className="size-5 text-brand-400" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
            <h2 className="mb-6 text-xl font-bold text-ink-900">Create your free account</h2>
            <LeadForm kind="trial" />
            <p className="mt-6 text-center text-sm text-ink-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand-700 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>
      <Testimonials />
    </>
  );
}
