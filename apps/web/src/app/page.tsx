import { ArrowRight } from "lucide-react";
import { homeFaq } from "@/content/faq";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Hero } from "@/components/home/Hero";
import { AgentsPanel } from "@/components/home/AgentsPanel";
import { UseCaseSelector } from "@/components/home/UseCaseSelector";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { Bento } from "@/components/home/Bento";
import { TryIt } from "@/components/home/TryIt";
import {
  AgentBuilderMockup,
  DialerMockup,
  FollowUpMockup,
  RoutingMockup,
  ScorecardMockup,
  SupervisorMockup,
} from "@/components/home/Mockups";
import { Testimonials } from "@/components/sections/Testimonials";
import { IntegrationsTabs } from "@/components/sections/IntegrationsTabs";
import { SecuritySection } from "@/components/sections/SecuritySection";
import { FaqWithContact } from "@/components/sections/FaqWithContact";
import { CtaBand } from "@/components/sections/CtaBand";

function Divider() {
  return <hr className="container-page border-ink-100" />;
}

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="container-page py-16 sm:py-24">
        <Reveal>
          <SectionHeading
            layout="split"
            title={
              <>
                One phone system.
                <br />
                Two kinds of agent.
              </>
            }
            description="Your team and your AI agents share the same numbers, queues and routing rules in 30+ languages. Pick a country and see how a call reaches the right agent, human or AI."
          />
        </Reveal>
        <Reveal className="mt-12">
          <AgentsPanel />
        </Reveal>
      </section>

      <section className="container-page py-16 sm:py-24">
        <Reveal>
          <SectionHeading
            title="Cover the calls you can't staff"
            description="After hours, overflow, first-touch leads, follow-ups. Tell DevyTalk which calls AI should take and it handles them, while your team takes the rest."
          />
        </Reveal>
        <Reveal className="mx-auto mt-14 max-w-5xl">
          <UseCaseSelector />
        </Reveal>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/demo">Book a demo</ButtonLink>
          <ButtonLink href="/features/ai-voice-agent" variant="outline">
            Explore AI agents <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>

      <Divider />

      <section className="container-page py-16 sm:py-24">
        <Reveal>
          <SectionHeading
            layout="split"
            title="Everything your reps need to run calls all day."
            description="Smart routing, dialers, live coaching and wallboards in one workspace, with every call logged to your CRM automatically."
          />
        </Reveal>
        <Reveal className="mt-12">
          <ProductShowcase
            tabs={[
              {
                title: "Every caller reaches the right person",
                body: "Route by skill, language, VIP status or the last agent they spoke to. Build it visually, publish in one click.",
                stat: { value: "-42%", label: "average wait time" },
                logo: "Kettle & Co",
                visual: <RoutingMockup />,
              },
              {
                title: "Dial more, with zero busywork",
                body: "Power and parallel dialers work through your lists, drop voicemails and log every outcome for you.",
                stat: { value: "3x", label: "conversations per rep" },
                logo: "Northwind",
                visual: <DialerMockup />,
              },
              {
                title: "Listen, whisper or take over",
                body: "Supervisors see every live call with sentiment, and can coach a rep without the customer hearing.",
                stat: { value: "94%", label: "service level reached" },
                logo: "Paperhaus",
                visual: <SupervisorMockup />,
              },
            ]}
          />
        </Reveal>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/demo">Book a demo</ButtonLink>
          <ButtonLink href="/signup" variant="outline">
            Try for free <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <Reveal>
          <SectionHeading
            layout="split"
            title="AI agents that work the same queues as your team"
            description="Build voice agents that answer after hours, qualify leads and follow up on every call, on the same numbers, queues and integrations your reps already use."
          />
        </Reveal>
        <Reveal className="mt-12">
          <ProductShowcase
            tabs={[
              {
                title: "A receptionist that answers in 30+ languages",
                body: "Answers, routes and books meetings around the clock, trained on your help center and your tone of voice.",
                stat: { value: "68%", label: "calls resolved by AI" },
                logo: "Lumen Health",
                visual: <AgentBuilderMockup />,
              },
              {
                title: "An SDR that follows up instantly",
                body: "Calls every web lead within a minute, qualifies them and books the meeting straight into your calendar.",
                stat: { value: "39s", label: "median speed to lead" },
                logo: "Orbitly",
                visual: <FollowUpMockup />,
              },
              {
                title: "AI that reviews every call",
                body: "Scores each conversation, flags coaching moments and writes the summary to your CRM after hang-up.",
                stat: { value: "2h", label: "saved per rep, every week" },
                logo: "Brightlane",
                visual: <ScorecardMockup />,
              },
            ]}
          />
        </Reveal>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/demo">Book a demo</ButtonLink>
          <ButtonLink href="/features/ai-voice-agent" variant="outline">
            See it in action <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>

      <Divider />
      <Testimonials />
      <Divider />
      <Bento />
      <TryIt />
      <Divider />
      <IntegrationsTabs />
      <Divider />
      <SecuritySection />
      <Divider />
      <FaqWithContact items={homeFaq} />
      <CtaBand />
    </>
  );
}
