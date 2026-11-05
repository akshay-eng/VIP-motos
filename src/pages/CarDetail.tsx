import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  Heart,
  KeyRound,
  MapPin,
  MessageCircle,
  PhoneCall,
  Scale,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { brandOf, byId, carTitle, inventory, type CarWithImages } from "@/data/inventory";
import { whatsappHref } from "@/data/site";
import { ListingCard } from "@/components/collection/ListingCard";
import { BrandLogo } from "@/components/BrandLogo";
import { EmiCalculator } from "@/components/EmiCalculator";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Reveal } from "@/components/Reveal";
import { StatusBadge } from "@/components/StatusBadge";
import { emiFrom, km, number, ownerLabel, priceFull, priceShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";
import { useApp } from "@/state/app-state";
import NotFound from "./NotFound";

const CHECKS = [
  ["Engine and gearbox", "Compression, leaks, mounts, shift quality, ECU fault codes"],
  ["Suspension and brakes", "Air suspension height and leak-down, pads, discs, bushes"],
  ["Electricals", "Every screen, camera, sensor, seat motor and light"],
  ["Body and paint", "Paint depth on every panel, gaps, glass, underbody"],
  ["Interior", "Leather, headliner, trim, odour, wear against the odometer"],
  ["Documents", "RC, insurance and claim history, service records, hypothecation"],
];

export default function CarDetail() {
  const { id } = useParams();
  const car = id ? byId.get(id) : undefined;
  const { markViewed } = useApp();

  useEffect(() => {
    if (car) markViewed(car.id);
    // markViewed changes identity with every update; the car id is what matters.
  }, [car?.id]);

  if (!car) return <NotFound />;
  return <Detail key={car.id} car={car} />;
}

function Detail({ car }: { car: CarWithImages }) {
  const { shortlist, toggleShortlist, compare, toggleCompare, requestCallback, openConcierge } = useApp();
  const [photo, setPhoto] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [shared, setShared] = useState(false);
  const [compareFull, setCompareFull] = useState(false);
  const saved = shortlist.includes(car.id);
  const comparing = compare.includes(car.id);
  const title = carTitle(car);
  const similar = inventory
    .filter((c) => c.id !== car.id && (c.body === car.body || brandOf(c) === brandOf(car)))
    // Same body style first, then closest in price.
    .sort((a, b) => Number(b.body === car.body) - Number(a.body === car.body) || Math.abs(a.price - car.price) - Math.abs(b.price - car.price))
    .slice(0, 3);

  const onIndex = useCallback((i: number) => setPhoto(i), []);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // Share sheet dismissed.
    }
  }

  const specs = [
    { icon: Calendar, label: "Year", value: String(car.year) },
    { icon: Gauge, label: "Driven", value: km(car.km) },
    { icon: Fuel, label: "Fuel", value: car.fuel },
    { icon: Settings2, label: "Transmission", value: car.transmission },
    { icon: KeyRound, label: "Ownership", value: ownerLabel(car.owners) },
    { icon: MapPin, label: "Registration", value: car.regState },
  ];

  return (
    <div className="pb-32 pt-20 md:pb-24 lg:pt-24">
      <div className="container-x">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 overflow-hidden text-xs text-subtle">
          <Link to="/" className="hover:text-fg">Home</Link>
          <span aria-hidden>/</span>
          <Link to="/cars" className="hover:text-fg">Buy</Link>
          <span aria-hidden>/</span>
          <Link to={`/cars?brand=${encodeURIComponent(brandOf(car))}`} className="hover:text-fg">{brandOf(car)}</Link>
          <span aria-hidden>/</span>
          <span className="truncate text-muted">{car.model}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
          <div className="min-w-0">
            <div data-vt-hero className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-surface-2">
              <ImageCarousel images={car.images} alt={title} size="lg" className="h-full" selected={photo} onIndexChange={onIndex} onOpen={setLightbox} />
              <div className="pointer-events-none absolute left-4 top-4">
                <StatusBadge status={car.status} />
              </div>
            </div>
            {car.images.length > 1 && (
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                {car.images.map((img, i) => (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => setPhoto(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-current={photo === i}
                    className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-bg transition-all duration-150 sm:h-20 sm:w-28", photo === i ? "ring-accent" : "ring-transparent opacity-60 hover:opacity-100")}
                  >
                    <img src={img.src.replace(/\.jpg$/, "-sm.jpg")} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-subtle">
              Photo: {car.images[photo]?.credit}, {car.images[photo]?.license}, via Wikimedia Commons. Same model, shown for illustration.{" "}
              <Link to="/credits" className="underline underline-offset-2 hover:text-fg">All credits</Link>
            </p>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs tabular-nums text-subtle">
              {car.year} · {car.regState} · {car.exterior}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <BrandLogo brand={car.make} className="h-8 text-fg" />
              <span className="h-6 w-px bg-line-strong" />
              <span className="text-sm text-muted">{car.make}</span>
            </div>
            <h1 className="display mt-3 text-4xl sm:text-5xl">{car.model}</h1>
            <p className="mt-1.5 text-muted">{car.variant}</p>

            <div className="mt-6 flex items-end justify-between gap-4 border-y border-line py-5">
              <div>
                <p className="display text-4xl tabular-nums">{priceShort(car.price)}</p>
                <p className="mt-1 text-xs tabular-nums text-subtle">{priceFull(car.price)} · asking price</p>
              </div>
              <a href="#emi" className="text-right text-sm">
                <span className="block text-subtle">EMI from</span>
                <span className="tabular-nums text-accent-fg">₹{number(Math.round(emiFrom(car.price)))}/mo</span>
              </a>
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <dt className="flex items-center gap-1.5 text-[11px] text-subtle">
                    <Icon className="size-3.5" aria-hidden /> {label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 grid gap-2.5">
              {car.status === "booked" ? (
                <button type="button" onClick={() => requestCallback({ carId: car.id, intent: "callback" })} className="btn-inverse h-12 w-full">
                  Booked. Join the waitlist
                </button>
              ) : (
                <button type="button" onClick={() => requestCallback({ carId: car.id, intent: "test-drive" })} className="btn-accent h-12 w-full">
                  Book a test drive
                </button>
              )}
              <a
                href={whatsappHref(`Hi VIP Motors, could you give me a live video walkaround of the ${title}? I'm free today.`)}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-line-strong p-3 transition-colors duration-150 hover:border-accent/60"
              >
                <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent-fg">
                  <span className="pulse-ring absolute inset-0 rounded-full bg-accent/40" aria-hidden />
                  <Video className="relative size-[18px]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">Live video walkaround</span>
                  <span className="block text-xs text-muted">We'll call you on WhatsApp and show you round the car</span>
                </span>
              </a>
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" onClick={() => requestCallback({ carId: car.id, intent: "callback" })} className="btn-ghost w-full">
                  <PhoneCall className="size-4" aria-hidden /> Call back
                </button>
                <a href={whatsappHref(`Hi VIP Motors, I'm interested in the ${title} listed at ${priceShort(car.price)}.`)} target="_blank" rel="noreferrer" className="btn-ghost w-full">
                  <MessageCircle className="size-4" aria-hidden /> WhatsApp
                </a>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1 text-sm">
              <button type="button" onClick={() => toggleShortlist(car.id)} aria-pressed={saved} className="flex h-10 items-center gap-2 rounded-full px-3 text-fg/85 transition-colors duration-150 hover:bg-white/5">
                <Heart className={cn("size-4", saved && "fill-accent text-accent-fg")} aria-hidden /> {saved ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const ok = toggleCompare(car.id);
                  setCompareFull(!ok);
                }}
                aria-pressed={comparing}
                className={cn("flex h-10 items-center gap-2 rounded-full px-3 transition-colors duration-150 hover:bg-white/5", comparing ? "text-accent-fg" : "text-fg/85")}
              >
                <Scale className="size-4" aria-hidden /> {comparing ? "In compare" : "Compare"}
              </button>
              <button type="button" onClick={share} className="flex h-10 items-center gap-2 rounded-full px-3 text-fg/85 transition-colors duration-150 hover:bg-white/5">
                <Share2 className="size-4" aria-hidden /> {shared ? "Link copied" : "Share"}
              </button>
            </div>
            {compareFull && <p role="alert" className="mt-1 px-3 text-xs text-warn">You can compare three cars at a time. Remove one from the tray first.</p>}

            <button
              type="button"
              onClick={() => openConcierge(`Tell me about the ${car.year} ${car.make} ${car.model}`, car.id)}
              className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-accent/30 bg-accent/[0.06] p-4 text-left transition-colors duration-150 hover:border-accent/60"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-fg">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-medium">Ask the Co-Driver about this car</span>
                <span className="block text-xs text-muted">Alternatives, EMI options, how it compares</span>
              </span>
            </button>
          </aside>
        </div>

        <div className="mt-16 grid gap-16 lg:mt-24 lg:max-w-[calc(60.8%-24px)]">
          <Reveal>
            <h2 className="display text-2xl sm:text-3xl">Overview</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-fg/85">{car.blurb}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {car.highlights.map((h) => (
                <li key={h} className="flex gap-3 rounded-2xl border border-line bg-surface p-4 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent-fg" aria-hidden /> {h}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal>
            <h2 className="display text-2xl sm:text-3xl">Specifications</h2>
            <dl className="mt-6 grid overflow-hidden rounded-2xl border border-line sm:grid-cols-2">
              {[
                ["Engine", car.engine],
                ["Power", `${car.powerHp} hp`],
                ["Torque", `${car.torqueNm} Nm`],
                ["0–100 km/h", `${car.zeroTo100} s`],
                ["Top speed", `${car.topSpeed} km/h`],
                ["Drive", car.drive],
                ["Body", car.body],
                ["Seats", String(car.seats)],
                ["Exterior", car.exterior],
                ["Interior", car.interior],
                ...(car.rangeKm ? [["Claimed range", `${car.rangeKm} km`]] : []),
                ["Insurance", car.insurance],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 border-b border-line px-4 py-3.5 text-sm sm:odd:border-r">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-6 text-accent-fg" aria-hidden />
              <h2 className="display text-2xl sm:text-3xl">What we check before listing</h2>
            </div>
            <p className="mt-3 text-sm text-muted">The full inspection report for this car is shared before you pay a token amount.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {CHECKS.map(([t, d]) => (
                <li key={t} className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-sm font-medium">{t}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{d}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal>
            <h2 id="emi" className="display scroll-mt-28 text-2xl sm:text-3xl">
              EMI calculator
            </h2>
            <div className="mt-6">
              <EmiCalculator price={car.price} carId={car.id} />
            </div>
          </Reveal>
        </div>

        {similar.length > 0 && (
          <section className="mt-24">
            <div className="flex items-end justify-between gap-4">
              <h2 className="display text-2xl sm:text-3xl">You might also like</h2>
              <Link to={`/cars?body=${car.body}`} className="text-sm text-accent-fg hover:text-accent-strong">
                More {car.body === "SUV" ? "SUVs" : `${car.body.toLowerCase()}s`}
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((c, i) => (
                <ListingCard key={c.id} car={c} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-line bg-bg/95 px-4 py-3 md:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">
            {car.make} {car.model}
          </p>
          <p className="display text-lg tabular-nums">{priceShort(car.price)}</p>
        </div>
        <button type="button" onClick={() => requestCallback({ carId: car.id, intent: car.status === "booked" ? "callback" : "test-drive" })} className="btn-accent h-11 px-5">
          {car.status === "booked" ? "Join waitlist" : "Test drive"}
        </button>
      </div>

      <Lightbox car={car} index={lightbox} onChange={setLightbox} />
    </div>
  );
}

function Lightbox({ car, index, onChange }: { car: CarWithImages; index: number | null; onChange: (i: number | null) => void }) {
  const n = car.images.length;
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onChange((index + 1) % n);
      if (e.key === "ArrowLeft") onChange((index - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, n, onChange]);

  return (
    <Dialog.Root open={index !== null} onOpenChange={(o) => !o && onChange(null)}>
      <AnimatePresence>
        {index !== null && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div className="fixed inset-0 z-50 bg-black/95" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
            </Dialog.Overlay>
            <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none">
              <Dialog.Title className="sr-only">{carTitle(car)} photos</Dialog.Title>
              <Dialog.Description className="sr-only">Use the arrow keys to move between photos.</Dialog.Description>
              <AnimatePresence mode="wait">
                <motion.img
                  key={index}
                  src={car.images[index].src}
                  alt={`${carTitle(car)}, photo ${index + 1}`}
                  className="max-h-[86dvh] max-w-full rounded-2xl object-contain"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.35, ease: ease.enter } }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                />
              </AnimatePresence>
              <button type="button" onClick={() => onChange((index - 1 + n) % n)} aria-label="Previous photo" className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-fg hover:bg-white/20">
                <ChevronLeft className="size-5" />
              </button>
              <button type="button" onClick={() => onChange((index + 1) % n)} aria-label="Next photo" className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-fg hover:bg-white/20">
                <ChevronRight className="size-5" />
              </button>
              <Dialog.Close aria-label="Close photos" className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-white/10 text-fg hover:bg-white/20">
                <X className="size-5" />
              </Dialog.Close>
              <p className="absolute bottom-[max(20px,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 text-xs tabular-nums text-fg/70">
                {index + 1} / {n} · {car.images[index].credit}, {car.images[index].license}
              </p>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
