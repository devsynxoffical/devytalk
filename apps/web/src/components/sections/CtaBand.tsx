import { ArrowRight, Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export function CtaBand({
  title = "Your next great conversation starts here.",
  description = "Try DevyTalk free for 14 days. Set up in five minutes, cancel in one click.",
}: { title?: string; description?: string }) {
  return (
    <section className="container-page py-16 sm:py-24">
      <div className="bg-mesh-dark relative overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white sm:px-16 sm:py-20">
        <div className="bg-dots absolute inset-0 opacity-30 invert" aria-hidden="true" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">{title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/75">{description}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" variant="white" size="lg">
              Start free trial <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/demo" variant="glass" size="lg">
              Book a demo
            </ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70">
            {["14-day free trial", "No credit card", "Free number porting"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-4 text-lime-400" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
