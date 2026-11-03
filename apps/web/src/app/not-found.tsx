import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="grid min-h-[80dvh] place-items-center bg-ink-900 px-4 pt-24 text-center text-white">
      <div>
        <p className="font-mono text-7xl font-extrabold text-gradient">404</p>
        <h1 className="mt-4 text-3xl font-extrabold">This line is not in service</h1>
        <p className="mt-3 text-ink-300">The page you dialed does not exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/" variant="accent">Back to home</ButtonLink>
          <ButtonLink href="/demo" variant="light">Contact us</ButtonLink>
        </div>
      </div>
    </section>
  );
}
