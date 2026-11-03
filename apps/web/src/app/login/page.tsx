import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";
import { LoginForm } from "@/components/interactive/LoginForm";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <section className="relative grid min-h-dvh place-items-center overflow-hidden px-4 pb-16 pt-32">
      <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/3 size-[40rem] max-w-[150vw] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-200/60 via-sky-300/30 to-lime-300/50 blur-3xl" aria-hidden="true" />
      <div className="shadow-float relative w-full max-w-md rounded-[1.75rem] border border-ink-100 bg-white p-8 sm:p-10">
        <div className="flex justify-center">
          <LogoMark className="size-11" />
        </div>
        <h1 className="mt-6 text-center text-2xl font-semibold text-ink-900">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-ink-500">Log in to your DevyTalk workspace</p>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-ink-500">
          New to DevyTalk?{" "}
          <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
            Start a free trial
          </Link>
        </p>
      </div>
    </section>
  );
}
