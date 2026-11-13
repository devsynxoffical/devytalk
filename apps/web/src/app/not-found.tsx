import { ButtonLink } from "@/components/ui/Button";
import { Footer } from "@/components/layout-footer";
import { Header } from "@/components/layout-header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main">
    <section className="relative grid min-h-[85dvh] place-items-center overflow-hidden px-4 pt-28 text-center">
      <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]" aria-hidden="true" />
      <div className="relative">
        <p className="text-8xl font-semibold tracking-tighter text-gradient sm:text-9xl">404</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">This line is not in service</h1>
        <p className="mt-3 text-ink-500">The page you dialed doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/demo" variant="outline">
            Contact us
          </ButtonLink>
        </div>
      </div>
    </section>
      </main>
      <Footer />
    </>
  );
}
