import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "@/components/interactive/LoginForm";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <section className="grid min-h-dvh place-items-center bg-ink-900 px-4 pb-16 pt-28">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center text-2xl font-extrabold text-ink-900">Welcome back</h1>
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
