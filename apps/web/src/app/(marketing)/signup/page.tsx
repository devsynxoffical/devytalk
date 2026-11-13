import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LeadForm } from "@/components/interactive/LeadForm";
import { LogoStrip } from "@/components/sections/LogoStrip";
import { Testimonials } from "@/components/sections/Testimonials";

export const metadata: Metadata = { title: "Start your free trial", description: "Try DevyTalk free for 14 days. No credit card required." };

export default function SignupPage() {
  return (
    <>
      <section className="relative overflow-hidden pb-16 pt-36 sm:pt-44">
        <div className="absolute -right-40 top-10 size-[36rem] rounded-full bg-gradient-to-br from-lime-300/60 via-brand-200/60 to-sky-300/40 blur-3xl" aria-hidden="true" />
        <div className="container-page relative grid grid-cols-1 [&>*]:min-w-0 items-center gap-14 lg:grid-cols-2">
          <div>
            <Eyebrow>14-day free trial</Eyebrow>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl">Start calling in five minutes</h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-500">Create your workspace and get full access to DevyTalk for 14 days.</p>
            <ul className="mt-8 space-y-3">
              {["Full access to every Scale plan feature", "Free test call minutes and a local number", "No credit card required", "Cancel anytime in one click"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-ink-700">
                  <CheckCircle2 className="size-5 text-brand-600" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="shadow-float rounded-[1.75rem] border border-ink-100 bg-white p-6 sm:p-10">
            <h2 className="mb-6 text-xl font-semibold">Create your free account</h2>
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
      <div className="container-page">
        <LogoStrip />
      </div>
      <Testimonials />
    </>
  );
}
