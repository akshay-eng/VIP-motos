import { useState } from "react";
import { Link } from "react-router";
import { Accordion } from "radix-ui";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Heart, MapPin, Phone, Plus, X } from "lucide-react";
import { byId, type CarWithImages } from "@/data/inventory";
import { mapsLink, site, telHref } from "@/data/site";
import { BrandLogo } from "@/components/BrandLogo";
import { Instagram } from "@/components/icons";
import { Magnetic, SplitReveal } from "@/components/fx";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { Collection } from "@/components/collection/Collection";
import { ListingCard } from "@/components/collection/ListingCard";
import { Hero } from "@/components/home/Hero";
import { priceShort } from "@/lib/format";
import { asset } from "@/lib/asset";
import { useApp } from "@/state/app-state";

export default function Home() {
  return (
    <>
      <Hero />
      <Collection
        heading={
          <>
            <p className="eyebrow">The collection</p>
            <h2 className="display mt-3 text-4xl sm:text-5xl lg:text-6xl">
              Every car on the floor, <span className="display-italic text-accent">priciest first.</span>
            </h2>
            <p className="mt-3 text-[15px] text-muted">Hypercars at the top, first luxury cars further down. Filter by price, brand, body or fuel above.</p>
          </>
        }
      />
      <RecentlyViewed />
      <MatchTeaser />
      <SellBanner />
      <Showroom />
    </>
  );
}

const FAN = ["porsche-911-carrera-s-2021", "range-rover-velar-2022", "audi-rs-etron-gt-2023"].map((id) => byId.get(id)!);

function MatchTeaser() {
  const [hover, setHover] = useState(false);
  return (
    <section className="container-x grid gap-14 pb-24 pt-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pb-32 lg:pt-16">
      <div className="relative order-2 mx-auto h-[440px] w-full max-w-[420px] lg:order-1" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
        {FAN.map((c, n) => {
          const rot = [-14, 0, 14][n];
          const x = [-90, 0, 90][n];
          return (
            <motion.div
              key={c.id}
              className="absolute left-1/2 top-[45%] -ml-[130px] -mt-[180px] h-[360px] w-[260px] overflow-hidden rounded-[26px] border border-line-strong bg-black text-white shadow-2xl shadow-black/40"
              animate={hover ? { rotate: rot * 1.4, x: x * 1.25, y: n === 1 ? -14 : 10 } : { rotate: rot * 0.45, x: x * 0.35, y: [0, -8, 0] }}
              transition={hover ? { type: "spring", stiffness: 220, damping: 18 } : { duration: 4 + n, repeat: Infinity, ease: "easeInOut" }}
              style={{ zIndex: n === 1 ? 3 : 1 }}
            >
              <img src={c.images[0].src.replace(/\.jpg$/, "-sm.jpg")} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="scrim-b absolute inset-0" />
              <div className="absolute inset-x-4 bottom-4">
                <BrandLogo brand={c.make} className="h-5 text-white/90" />
                <p className="mt-2 text-lg font-semibold">{c.model}</p>
                <p className="text-sm text-white/70">{priceShort(c.price)}</p>
              </div>
              {n === 1 && (
                <motion.span className="absolute right-4 top-5 rotate-12 rounded-lg border-2 border-[#4ade80] px-2.5 py-0.5 text-sm font-black uppercase tracking-widest text-[#4ade80]" animate={{ opacity: hover ? 1 : 0, scale: hover ? 1 : 0.6 }}>
                  Like
                </motion.span>
              )}
            </motion.div>
          );
        })}
        <div className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 gap-4">
          <span className="grid size-14 place-items-center rounded-full border border-line-strong bg-surface text-muted shadow-lg">
            <X className="size-6" aria-hidden />
          </span>
          <span className="grid size-14 place-items-center rounded-full bg-accent text-on-accent shadow-lg shadow-accent/30">
            <Heart className="size-6 fill-current" aria-hidden />
          </span>
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <p className="eyebrow">New · VIP Match</p>
        <SplitReveal as="h2" text="Swipe. Match. Drive." className="display mt-3 text-5xl sm:text-6xl" wordClassName={(w) => (w === "Match." ? "display-italic text-accent" : undefined)} />
        <Reveal delay={0.2}>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
            Not sure what you want? Swipe through the floor like you'd swipe through anything else. Right to keep, left to pass. Your likes land in your shortlist, and the Co-Driver can pick between them.
          </p>
          <Link to="/match" className="btn-accent mt-8 h-12 px-6">
            Start matching <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function RecentlyViewed() {
  const { recent } = useApp();
  const cars = recent.map((id) => byId.get(id)).filter((c): c is CarWithImages => !!c).slice(0, 8);
  if (!cars.length) return null;
  return (
    <section className="border-t border-line py-16">
      <div className="container-wide">
        <p className="eyebrow">Pick up where you left off</p>
        <h2 className="display mt-3 text-3xl">Recently viewed</h2>
      </div>
      <div className="no-scrollbar mt-6 flex snap-x gap-4 overflow-x-auto px-3 sm:px-6 lg:px-10 2xl:px-14">
        {cars.map((c) => (
          <div key={c.id} className="w-[220px] shrink-0 snap-start sm:w-[280px]">
            <ListingCard car={c} compact />
          </div>
        ))}
      </div>
    </section>
  );
}

function SellBanner() {
  return (
    <section className="relative overflow-hidden bg-fg text-bg">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-4 flex overflow-hidden opacity-[0.06]">
        <span className="marquee display-italic flex shrink-0 gap-10 whitespace-nowrap pr-10 text-[120px] leading-none" style={{ ["--marquee-duration" as string]: "30s" }}>
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="flex gap-10">
              <span>SELL</span>
              <span>EXCHANGE</span>
              <span>VALUATION</span>
              <span>UPGRADE</span>
            </span>
          ))}
        </span>
      </div>
      <div className="container-x relative grid gap-12 py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-28">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Sell or exchange</p>
          <SplitReveal as="h2" text="Selling a luxury car? We'll come to you." className="display mt-3 text-4xl sm:text-5xl" wordClassName={(w) => (w === "you." ? "display-italic text-accent" : undefined)} />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-bg/70">Share the details in two minutes. We inspect it at your home or office, make a written offer, and settle payment at handover with the paperwork done for you.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <Link to="/sell" className="btn-accent h-12 px-6">
                  Get an offer <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Magnetic>
              <Link to="/sell#how" className="btn h-12 border border-bg/25 px-6 hover:bg-bg/10">
                How it works
              </Link>
            </div>
          </Reveal>
        </div>
        <RevealGroup className="grid gap-3" step={0.1}>
          {["Tell us about the car", "Doorstep inspection, about 45 minutes", "Offer, payment and RC transfer"].map((s, n) => (
            <RevealItem key={s} className="flex items-center gap-4 rounded-2xl border border-bg/15 bg-bg/[0.06] p-5">
              <span className="display-italic grid size-11 shrink-0 place-items-center rounded-full bg-accent text-base text-on-accent">{n + 1}</span>
              <span className="font-medium">{s}</span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

function Showroom() {
  return (
    <section className="container-x py-24 lg:py-32">
      <div className="grid overflow-hidden rounded-[32px] border border-line bg-surface lg:grid-cols-[1.15fr_1fr]">
        <div className="group relative min-h-[320px] overflow-hidden bg-black">
          <img src={asset("showroom/storefront.jpg")} alt="The VIP Motors showroom on Magadi Main Road, Rajajinagar" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1600ms] ease-[var(--ease-expo)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <span className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
            <span className="relative flex size-2">
              <span className="pulse-ring absolute inset-0 rounded-full bg-[#e11d2a]" />
              <span className="relative size-2 rounded-full bg-[#e11d2a]" />
            </span>
            Magadi Main Road, Rajajinagar
          </span>
        </div>
        <Reveal className="flex flex-col justify-center gap-6 p-8 sm:p-12">
          <p className="eyebrow">The showroom</p>
          <h2 className="display text-4xl">
            Come and see them <span className="display-italic text-accent">in person.</span>
          </h2>
          <div className="grid gap-4 text-[15px]">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-accent-fg" aria-hidden />
              <span>
                {site.address.line1}
                <br />
                <span className="text-muted">{site.address.line2}</span>
              </span>
            </p>
            <a href={telHref} className="flex gap-3 hover:text-accent-fg">
              <Phone className="mt-0.5 size-5 shrink-0 text-accent-fg" aria-hidden /> {site.phone}
            </a>
            <p className="pl-8 text-muted">{site.hours}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={mapsLink} target="_blank" rel="noreferrer" className="btn-accent">
              Get directions
            </a>
            <Link to="/contact" className="btn-ghost">
              Contact the team
            </Link>
          </div>
          <a href={site.instagram} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-4 rounded-2xl border border-line p-4 transition-colors duration-150 hover:border-accent/50">
            <Instagram className="size-6 text-accent-fg" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{site.instagramHandle}</span>
              <span className="block text-xs text-muted">{site.instagramFollowers} followers · deliveries, new stock and walkarounds</span>
            </span>
            <ArrowUpRight className="size-4 text-muted" aria-hidden />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Are your cars inspected?", a: "Yes. Every car is inspected before it's listed: engine and gearbox, suspension and brakes, electricals, paint depth panel by panel, interior, and documents. You can see the report before you pay a token." },
  { q: "Can I get a car loan through you?", a: "Our finance desk arranges pre-owned luxury car loans through partner banks. EMIs on this site assume 20% down at 9.5% for illustration; the bank confirms your rate and funding." },
  { q: "Do you take my car in exchange?", a: "We do. Bring your car to the showroom or book a doorstep inspection, and we'll value it against the car you want. The difference is all you pay." },
  { q: "Can I see a car over video first?", a: "Yes. Every car page has a video walkaround button: we'll call you on WhatsApp and walk you round the car live." },
  { q: "Is there a warranty?", a: "Extended warranty is available on most cars, with the term depending on the car's age and kilometres. Ask the team for the plan on a specific car." },
  { q: "How does the AI Co-Driver work?", a: "It reads your message for budget, body style, seats, brands, fuel and how you'll use the car, then ranks today's stock and explains each match. It only knows about cars actually on our floor." },
];

export function Faq() {
  return (
    <section className="border-t border-line bg-surface py-24 lg:py-32">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div className="self-start">
          <p className="eyebrow">Questions</p>
          <SplitReveal as="h2" text="Before you visit." className="display mt-3 text-4xl sm:text-5xl" />
        </div>
        <Accordion.Root type="single" collapsible className="divide-y divide-line border-y border-line">
          {FAQS.map((f) => (
            <Accordion.Item key={f.q} value={f.q}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-6 text-left text-[17px] font-medium transition-colors duration-150 hover:text-accent-fg">
                  {f.q}
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong transition-[transform,background-color,border-color] duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:border-accent group-data-[state=open]:bg-accent group-data-[state=open]:text-on-accent">
                    <Plus className="size-4" aria-hidden />
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:hidden">
                <p className="pb-6 pr-14 text-[15px] leading-relaxed text-muted">{f.a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
