import Image from "next/image";
import WhitelistForm from "@/components/WhitelistForm";
import { getSiteConfig } from "@/lib/config";

// Config is admin-editable at runtime via Supabase, so never cache this
// page - always fetch the latest settings on each request.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const config = await getSiteConfig();

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-toxicDim/20">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-toxic text-xs tracking-[0.3em] mb-4 animate-flicker">
              LIVE ON ROBINHOOD CHAIN
            </p>
            <h1 className="font-display text-6xl sm:text-7xl leading-[0.9] text-bone mb-6">
              {config.projectName}
            </h1>
            <p className="text-bone/60 text-sm leading-relaxed max-w-sm">
              The outbreak is airborne. Complete the protocol below to log
              your wallet before containment closes. Every carrier is
              verified by hand — no bots survive triage.
            </p>
          </div>
          <div className="relative aspect-square w-full max-w-sm mx-auto">
            <div className="absolute -inset-4 bg-toxic/10 blur-2xl rounded-full" />
            <Image
              src="/hero-zombie.jpeg"
              alt={`${config.projectName} character art`}
              fill
              className="object-contain relative"
              priority
            />
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        {config.isOpen ? (
          <WhitelistForm config={config} />
        ) : (
          <div className="border border-toxicDim/30 bg-rot/40 p-8 text-center">
            <p className="text-toxic font-display text-2xl tracking-wide mb-2">
              CONTAINMENT ACTIVE
            </p>
            <p className="text-bone/60 text-sm leading-relaxed">
              {config.statusMessage || "Applications aren't open right now."}
            </p>
          </div>
        )}
      </section>

      <footer className="max-w-2xl mx-auto px-6 pb-12 text-center">
        <p className="text-bone/25 text-xs">
          {config.projectName} · Robinhood Chain · not affiliated with X
          Corp.
        </p>
      </footer>
    </main>
  );
}
