import { CheckCircle2 } from "lucide-react";
import { Softphone } from "@/components/interactive/Softphone";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";

export function TryIt() {
  return (
    <section className="container-page py-16 sm:py-24">
      <SectionHeading eyebrow="Try it now" title="Make a test call, right here" description="This is the same softphone your agents get in the browser. Dial any number, press call and watch the AI transcribe in real time." />
      <div className="bg-mesh-light mt-14 grid grid-cols-1 [&>*]:min-w-0 items-center gap-10 overflow-hidden rounded-[1.75rem] border border-ink-100 p-6 sm:p-12 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <ul className="space-y-4">
            {[
              ["HD calling in the browser", "WebRTC audio with noise suppression. No downloads, no desk phones."],
              ["Transcripts as you talk", "AI writes the transcript and flags intent while the call is live."],
              ["Everything logged for you", "Notes, outcome and recording land in your CRM the moment you hang up."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3 rounded-2xl bg-white/80 p-4 backdrop-blur">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
                <span>
                  <span className="block font-semibold text-ink-900">{t}</span>
                  <span className="block text-sm text-ink-600">{d}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/demo">Book a demo</ButtonLink>
            <ButtonLink href="/signup" variant="outline">Try it free</ButtonLink>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <Softphone />
          <p className="mt-4 text-center text-xs font-medium text-ink-600">Interactive demo: press the green button to start a call.</p>
        </div>
      </div>
    </section>
  );
}
