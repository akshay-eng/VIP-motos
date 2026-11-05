import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { CalendarDays, ChevronDown, Fuel, Gauge, Heart, Info, KeyRound, MapPin, MessageCircle, RotateCcw, Scale, Settings2, SlidersHorizontal, Sparkles, Star, Users, X, Zap } from "lucide-react";
import { inventory, type CarWithImages } from "@/data/inventory";
import type { Tag } from "@/data/types";
import { whatsappHref } from "@/data/site";
import { BrandLogo } from "@/components/BrandLogo";
import { emiShort, km, ownerLabel, priceShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";
import { useMediaQuery } from "@/lib/hooks";
import { useApp } from "@/state/app-state";

const BUDGETS = [
  { key: "any", label: "Any budget", test: () => true },
  { key: "u50", label: "Under ₹50L", test: (c: CarWithImages) => c.price < 5e6 },
  { key: "50-1", label: "₹50L–1 Cr", test: (c: CarWithImages) => c.price >= 5e6 && c.price < 1e7 },
  { key: "1-2", label: "₹1–2 Cr", test: (c: CarWithImages) => c.price >= 1e7 && c.price < 2e7 },
  { key: "2+", label: "₹2 Cr+", test: (c: CarWithImages) => c.price >= 2e7 },
];
const BODIES = [
  { key: "any", label: "Any body", test: () => true },
  { key: "suv", label: "SUV", test: (c: CarWithImages) => c.body === "SUV" },
  { key: "sedan", label: "Sedan", test: (c: CarWithImages) => c.body === "Sedan" || c.body === "MPV" },
  { key: "sport", label: "Sports", test: (c: CarWithImages) => c.body === "Coupe" || c.body === "Convertible" },
];

// Tinder-style profile copy, written from the car's point of view.
const INTERESTS: Record<Tag, string> = {
  performance: "Track days",
  weekend: "Weekend drives",
  family: "School runs",
  chauffeur: "Being driven",
  offroad: "Off-road trails",
  city: "City nights",
  highway: "Long highway runs",
  eco: "Low running costs",
  statement: "Turning heads",
  tech: "Gadgets",
  comfort: "Quiet cabins",
  reliable: "Commitment",
  value: "Good value",
  "first-luxury": "First dates",
  "open-top": "Roof-down sunsets",
};

function bioLines(c: CarWithImages): string[] {
  const lines: Partial<Record<Tag, string>> = {
    performance: `I do 0–100 in ${c.zeroTo100}s and I'm not shy about it.`,
    family: `Room for ${c.seats}, and I don't mind the school run.`,
    chauffeur: "Happiest when someone else drives and you relax in the back.",
    offroad: `${c.drive === "4x4" ? "Proper 4x4" : c.drive}, so Coorg trails don't scare me.`,
    eco: c.fuel === "Electric" ? `Silent, ${c.rangeKm} km on a charge, no fuel stops.` : c.fuel === "Hybrid" ? "Hybrid, so Bengaluru traffic doesn't cost us much." : "Easy on fuel for what I am.",
    statement: "Fair warning: people will stare.",
    weekend: "Free on weekends. Nandi Hills at sunrise?",
    city: "Easy to park and calm in traffic.",
    highway: "Long drives are my love language.",
    comfort: "Soft ride, quiet cabin, no drama.",
    tech: "Screens everywhere, and I know how to use them.",
    reliable: "Low drama, high commitment.",
    value: "Great value. Your accountant will like me.",
    "first-luxury": "The perfect first luxury car. We can take it slow.",
    "open-top": "Roof down whenever the weather says yes.",
  };
  return c.tags.map((t) => lines[t]).filter((l): l is string => !!l).slice(0, 3);
}

function lookingFor(c: CarWithImages) {
  if (c.tags.includes("chauffeur")) return "Someone with a driver and a busy calendar.";
  if (c.tags.includes("family")) return "A family that loves a road trip.";
  if (c.tags.includes("offroad")) return "An adventurer with a long weekend free.";
  if (c.tags.includes("performance")) return "A driver who knows where the good roads are.";
  if (c.tags.includes("eco")) return "Someone who's done with fuel stations.";
  return "A Bengaluru owner who'll keep me clean.";
}

function shuffle<T>(list: T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Verdict = { id: string; liked: boolean };

export default function Match() {
  const { shortlist, toggleShortlist, setCompare, openConcierge, requestCallback } = useApp();
  const [budget, setBudget] = useState("any");
  const [body, setBody] = useState("any");
  const [seed, setSeed] = useState(0);
  const [history, setHistory] = useState<Verdict[]>([]);
  const [dir, setDir] = useState(1);
  const [bio, setBio] = useState(false);
  const [burst, setBurst] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const desktop = useMediaQuery("(min-width: 1024px)");

  const deck = useMemo(() => {
    const b = BUDGETS.find((x) => x.key === budget)!;
    const t = BODIES.find((x) => x.key === body)!;
    return shuffle(inventory.filter((c) => c.status !== "booked" && b.test(c) && t.test(c)));
  }, [budget, body, seed]); // seed reshuffles on "Swipe again"

  const seen = new Set(history.map((h) => h.id));
  const remaining = deck.filter((c) => !seen.has(c.id));
  const top = remaining[0];
  const liked = history.filter((h) => h.liked).map((h) => inventory.find((c) => c.id === h.id)!);

  const decide = useCallback(
    (like: boolean) => {
      if (!top) return;
      setDir(like ? 1 : -1);
      setBio(false);
      setHistory((h) => [...h, { id: top.id, liked: like }]);
      if (like) {
        if (!shortlist.includes(top.id)) toggleShortlist(top.id);
        setBurst((n) => n + 1);
      }
    },
    [top, shortlist, toggleShortlist],
  );

  const superLike = () => {
    if (!top) return;
    const id = top.id;
    decide(true);
    requestCallback({ carId: id, intent: "test-drive" });
  };

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setDir(last.liked ? 1 : -1);
    setHistory((h) => h.slice(0, -1));
    if (last.liked && shortlist.includes(last.id)) toggleShortlist(last.id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, [role=dialog]")) return;
      if (e.key === "ArrowRight") decide(true);
      if (e.key === "ArrowLeft") decide(false);
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setBio(true);
      }
      if (e.key === "ArrowDown" || e.key === "Escape") setBio(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  const restart = (b = budget, t = body) => {
    setBudget(b);
    setBody(t);
    setHistory([]);
    setBio(false);
    setSeed((s) => s + 1);
  };

  const filters = (
    <div className="grid gap-5">
      <fieldset>
        <legend className="label">Budget</legend>
        <div className="flex flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <button key={b.key} type="button" aria-pressed={budget === b.key} onClick={() => restart(b.key, body)} className={cn("chip h-8 text-xs", budget === b.key && "border-accent bg-accent text-on-accent hover:text-on-accent")}>
              {b.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Body</legend>
        <div className="flex flex-wrap gap-2">
          {BODIES.map((b) => (
            <button key={b.key} type="button" aria-pressed={body === b.key} onClick={() => restart(budget, b.key)} className={cn("chip h-8 text-xs", body === b.key && "border-accent bg-accent text-on-accent hover:text-on-accent")}>
              {b.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );

  return (
    <div className="relative overflow-hidden pb-28 pt-20 lg:pb-12 lg:pt-[92px]">
      <div className="pointer-events-none absolute left-1/2 top-24 -z-10 size-[820px] -translate-x-1/2 rounded-full bg-accent/15 blur-[160px]" aria-hidden />
      <div className="container-wide grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)_300px] lg:gap-10">
        <aside className="flex items-center justify-between gap-4 lg:block lg:pt-6">
          <div>
            <p className="eyebrow">VIP Match</p>
            <h1 className="display mt-2 text-3xl lg:mt-3 lg:text-5xl">
              Swipe. <span className="display-italic text-accent">Match.</span>
              <span className="hidden lg:inline"> Drive.</span>
            </h1>
            <p className="mt-4 hidden max-w-xs text-[15px] leading-relaxed text-muted lg:block">Right to keep, left to pass, ★ to book a test drive. Tap a card to read its profile. Arrow keys work too.</p>
          </div>
          {desktop ? (
            <div className="mt-8">{filters}</div>
          ) : (
            <button type="button" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen} className="btn-ghost h-10 shrink-0 px-4">
              <SlidersHorizontal className="size-4" aria-hidden /> Filters
            </button>
          )}
        </aside>
        {!desktop && (
          <AnimatePresence initial={false}>
            {filtersOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                {filters}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div>
          <div className="relative mx-auto h-[calc(100dvh-360px)] max-h-[820px] min-h-[420px] w-full max-w-[560px] lg:h-[min(78dvh,820px)]">
            <AnimatePresence custom={dir}>
              {remaining
                .slice(0, 3)
                .reverse()
                .map((car) => {
                  const depth = remaining.indexOf(car);
                  return <SwipeCard key={car.id} car={car} depth={depth} bio={depth === 0 && bio} onBio={setBio} onDecide={decide} />;
                })}
            </AnimatePresence>
            {remaining.length === 0 && <Results liked={liked} onRestart={() => restart()} onCompare={(ids) => setCompare(ids)} onAsk={(t) => openConcierge(t)} />}
            <AnimatePresence>
              {burst > 0 && (
                <motion.span key={burst} className="pointer-events-none absolute left-1/2 top-1/2 z-30 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#e11d2a] text-white shadow-2xl shadow-[#e11d2a]/50" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: [0.3, 1.15, 1], opacity: [0, 1, 0], y: [0, -10, -80] }} transition={{ duration: 0.9, ease: ease.enter }}>
                  <Heart className="size-11 fill-current" aria-hidden />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {top && (
            <div className="mt-5 flex items-center justify-center gap-3 sm:mt-6 sm:gap-4">
              <RoundButton label="Undo last swipe" onClick={undo} disabled={!history.length} size="sm">
                <RotateCcw className="size-5" />
              </RoundButton>
              <RoundButton label="Pass" onClick={() => decide(false)} size="lg">
                <X className="size-8 text-fg" strokeWidth={2.5} />
              </RoundButton>
              <RoundButton label="Super like: save it and book a test drive" onClick={superLike} size="md" className="text-[#3b82f6]">
                <Star className="size-6 fill-current" />
              </RoundButton>
              <RoundButton label="Like and save to shortlist" onClick={() => decide(true)} size="lg" className="bg-[#e11d2a] text-white shadow-[#e11d2a]/40 hover:bg-[#ff2e3c]">
                <Heart className="size-8 fill-current" />
              </RoundButton>
              <RoundButton label={bio ? "Close profile" : "Open profile"} onClick={() => setBio((b) => !b)} size="sm">
                {bio ? <ChevronDown className="size-5" /> : <Info className="size-5" />}
              </RoundButton>
            </div>
          )}
          <p className="mt-4 text-center text-xs tabular-nums text-subtle">
            {Math.min(history.length + 1, deck.length)} of {deck.length} · {liked.length} liked
          </p>
        </div>

        <aside className="hidden lg:block lg:pt-6">
          <p className="label">Liked this round</p>
          {liked.length ? (
            <ul className="grid gap-2">
              <AnimatePresence initial={false}>
                {liked
                  .slice()
                  .reverse()
                  .map((c) => (
                    <motion.li key={c.id} layout initial={{ opacity: 0, x: 40, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }} exit={{ opacity: 0, x: 40 }}>
                      <Link to={`/cars/${c.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2 transition-colors duration-150 hover:border-accent/50">
                        <img src={c.images[0]?.src.replace(/\.jpg$/, "-sm.jpg")} alt="" className="h-14 w-20 rounded-xl object-cover" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {c.make} {c.model}
                          </span>
                          <span className="text-xs tabular-nums text-accent-fg">{priceShort(c.price)}</span>
                        </span>
                      </Link>
                    </motion.li>
                  ))}
              </AnimatePresence>
            </ul>
          ) : (
            <p className="text-sm text-subtle">Nothing yet. Swipe right on one you'd drive home.</p>
          )}
          {liked.length >= 2 && (
            <button type="button" onClick={() => openConcierge(`Compare the ${liked.slice(0, 3).map((c) => c.model).join(" and the ")}`)} className="btn-accent mt-4 w-full">
              <Sparkles className="size-4" aria-hidden /> Help me choose
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

function RoundButton({ label, onClick, disabled, size, className, children }: { label: string; onClick: () => void; disabled?: boolean; size: "sm" | "md" | "lg"; className?: string; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.85 }}
      className={cn(
        "grid place-items-center rounded-full border border-line-strong bg-surface text-muted shadow-lg transition-colors duration-150 disabled:opacity-40",
        size === "sm" ? "size-11 sm:size-12" : size === "md" ? "size-12 sm:size-14" : "size-16 sm:size-[72px]",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

function SwipeCard({ car, depth, bio, onBio, onDecide }: { car: CarWithImages; depth: number; bio: boolean; onBio: (b: boolean) => void; onDecide: (liked: boolean) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-20, 20]);
  const likeOpacity = useTransform(x, [30, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -30], [1, 0]);
  const [photo, setPhoto] = useState(0);
  const dragged = useRef(false);
  const top = depth === 0;
  const photos = car.images.slice(0, 5);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 120 || info.velocity.x > 600) onDecide(true);
    else if (info.offset.x < -120 || info.velocity.x < -600) onDecide(false);
    setTimeout(() => (dragged.current = false), 0);
  }

  /** Tinder taps: left third goes back a photo, right third forward, middle opens the profile. */
  function onTapPhoto(e: React.MouseEvent<HTMLDivElement>) {
    if (dragged.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - r.left) / r.width;
    if (rel < 0.33) setPhoto((p) => Math.max(0, p - 1));
    else if (rel > 0.67) setPhoto((p) => Math.min(photos.length - 1, p + 1));
    else onBio(!bio);
  }

  return (
    <motion.article
      className={cn("absolute inset-0 flex flex-col overflow-hidden rounded-[32px] border border-line-strong bg-black text-white shadow-2xl shadow-black/40", top ? (bio ? "" : "cursor-grab active:cursor-grabbing") : "pointer-events-none")}
      style={{ x: top ? x : 0, rotate: top ? rotate : 0, zIndex: 10 - depth }}
      drag={top && !bio ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.9}
      onDragStart={() => (dragged.current = true)}
      onDragEnd={onDragEnd}
      variants={{
        enter: { scale: 0.85, y: 40, opacity: 0 },
        rest: { scale: 1 - depth * 0.05, y: depth * 20, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 26 } },
        gone: (d: number) => ({ x: d * 800, rotate: d * 40, opacity: 0, transition: { duration: 0.5, ease: ease.exit } }),
      }}
      initial="enter"
      animate="rest"
      exit="gone"
    >
      <motion.div layout className={cn("relative shrink-0 overflow-hidden", bio ? "h-[44%]" : "h-full")} transition={{ type: "spring", stiffness: 260, damping: 30 }} onClick={top ? onTapPhoto : undefined}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.img
            key={photos[photo]?.src}
            src={photos[photo]?.src}
            alt={`${car.year} ${car.make} ${car.model}, photo ${photo + 1}`}
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.35, ease: ease.enter } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          />
        </AnimatePresence>
        <div className="absolute inset-x-3 top-3 z-10 flex gap-1.5" aria-hidden>
          {photos.map((p, i) => (
            <span key={p.src} className={cn("h-1 flex-1 rounded-full transition-colors duration-200", i === photo ? "bg-white" : "bg-white/35")} />
          ))}
        </div>
        <div className="scrim-b absolute inset-0" />
        {top && !bio && (
          <>
            <motion.span style={{ opacity: likeOpacity }} className="absolute left-6 top-12 -rotate-12 rounded-xl border-4 border-[#4ade80] px-3 py-1 text-4xl font-black uppercase tracking-widest text-[#4ade80]">
              Like
            </motion.span>
            <motion.span style={{ opacity: nopeOpacity }} className="absolute right-6 top-12 rotate-12 rounded-xl border-4 border-[#ff4655] px-3 py-1 text-4xl font-black uppercase tracking-widest text-[#ff4655]">
              Nope
            </motion.span>
          </>
        )}
        {!bio && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6">
            {car.status === "new-arrival" && (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#4ade80]/20 px-2.5 py-1 text-xs font-medium text-[#86efac] backdrop-blur">
                <span className="size-1.5 rounded-full bg-[#4ade80]" /> New in town
              </span>
            )}
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate text-4xl font-bold tracking-tight sm:text-5xl">
                  {car.model} <span className="font-light">{car.year}</span>
                </h2>
                <p className="mt-1.5 flex items-center gap-1.5 text-[15px] text-white/85">
                  <BrandLogo brand={car.make} className="h-4 text-white/85" /> {car.make} · {car.variant}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[15px] text-white/70">
                  <Gauge className="size-4" aria-hidden /> {km(car.km)} driven
                </p>
              </div>
              <span className="pointer-events-auto shrink-0">
                <button type="button" onClick={(e) => { e.stopPropagation(); onBio(true); }} aria-label="Open profile" className="grid size-11 place-items-center rounded-full bg-white text-black shadow-lg transition-transform duration-150 hover:scale-110">
                  <Info className="size-5" />
                </button>
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e11d2a] px-3 py-1 text-sm font-semibold">{priceShort(car.price)}</span>
              {car.tags.slice(0, 2).map((t) => (
                <span key={t} className="rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur">
                  {INTERESTS[t]}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {bio && (
          <motion.div key="bio" className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-elevated text-fg" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: ease.enter, delay: 0.05 } }} exit={{ opacity: 0, y: 30, transition: { duration: 0.15 } }}>
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-elevated/95 px-6 pb-4 pt-5 backdrop-blur">
              <div className="min-w-0">
                <h2 className="truncate text-3xl font-bold tracking-tight">
                  {car.model} <span className="font-light text-muted">{car.year}</span>
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <BrandLogo brand={car.make} className="h-3.5" /> {car.make} · {car.variant}
                </p>
              </div>
              <button type="button" onClick={() => onBio(false)} aria-label="Close profile" className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e11d2a] text-white shadow-lg transition-transform duration-150 hover:scale-110">
                <ChevronDown className="size-5" />
              </button>
            </div>

            <div className="grid gap-6 px-6 py-5">
              <div className="flex items-baseline justify-between">
                <p className="display text-3xl tabular-nums">{priceShort(car.price)}</p>
                <p className="text-sm tabular-nums text-accent-fg">EMI {emiShort(car.price)}</p>
              </div>

              <ProfileBlock title="About me">
                <div className="grid gap-2 text-[15px] leading-relaxed">
                  {bioLines(car).map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                  <p className="text-muted">
                    <span className="font-medium text-fg">The showroom says:</span> {car.blurb}
                  </p>
                </div>
              </ProfileBlock>

              <ProfileBlock title="Into">
                <div className="flex flex-wrap gap-2">
                  {car.tags.map((t) => (
                    <span key={t} className="rounded-full border border-line-strong px-3 py-1.5 text-sm">
                      {INTERESTS[t]}
                    </span>
                  ))}
                </div>
              </ProfileBlock>

              <ProfileBlock title="The basics">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {[
                    [CalendarDays, `${car.year}`],
                    [Gauge, `${km(car.km)} driven`],
                    [Fuel, car.fuel],
                    [Settings2, `${car.transmission} · ${car.drive}`],
                    [KeyRound, ownerLabel(car.owners)],
                    [Users, `${car.seats} seats`],
                    [MapPin, `Registered ${car.regState}`],
                    [Zap, car.rangeKm ? `${car.rangeKm} km range` : car.engine],
                  ].map(([Icon, text], i) => {
                    const I = Icon as typeof Gauge;
                    return (
                      <li key={i} className="flex items-start gap-2.5">
                        <I className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
                        <span>{text as string}</span>
                      </li>
                    );
                  })}
                </ul>
              </ProfileBlock>

              <ProfileBlock title="Performance">
                <div className="grid gap-3">
                  <Bar label="Power" value={`${car.powerHp} hp`} pct={car.powerHp / 650} />
                  <Bar label="Torque" value={`${car.torqueNm} Nm`} pct={car.torqueNm / 860} />
                  <Bar label="0–100 km/h" value={`${car.zeroTo100} s`} pct={(11.5 - car.zeroTo100) / 8.5} />
                  <Bar label="Top speed" value={`${car.topSpeed} km/h`} pct={car.topSpeed / 330} />
                </div>
              </ProfileBlock>

              <ProfileBlock title="Highlights">
                <ul className="grid gap-2 text-sm">
                  {car.highlights.map((h) => (
                    <li key={h} className="flex gap-2.5">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-accent-fg" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              </ProfileBlock>

              <ProfileBlock title="Looking for">
                <p className="text-[15px]">{lookingFor(car)}</p>
              </ProfileBlock>

              <div className="grid grid-cols-2 gap-2.5 pb-2">
                <Link to={`/cars/${car.id}`} className="btn-inverse">
                  Full listing
                </Link>
                <a href={whatsappHref(`Hi VIP Motors, could you give me a live video walkaround of the ${car.year} ${car.make} ${car.model}?`)} target="_blank" rel="noreferrer" className="btn-ghost">
                  <MessageCircle className="size-4" aria-hidden /> Video call
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function ProfileBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-subtle">{title}</h3>
      {children}
    </section>
  );
}

function Bar({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-fg/10">
        <motion.div className="h-full origin-left rounded-full bg-accent" initial={{ scaleX: 0 }} animate={{ scaleX: Math.max(0.06, Math.min(1, pct)) }} transition={{ duration: 0.8, ease: ease.enter, delay: 0.15 }} />
      </div>
    </div>
  );
}

function Results({ liked, onRestart, onCompare, onAsk }: { liked: CarWithImages[]; onRestart: () => void; onCompare: (ids: string[]) => void; onAsk: (t: string) => void }) {
  const top3 = liked.slice(0, 3);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 220, damping: 22 } }} className="absolute inset-0 flex flex-col items-center justify-center rounded-[32px] border border-line-strong bg-surface p-6 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-accent text-on-accent">
        <Heart className="size-9 fill-current" aria-hidden />
      </span>
      <h2 className="display mt-6 text-4xl">{liked.length ? `It's a match${liked.length > 1 ? `, ×${liked.length}` : ""}!` : "No matches this round"}</h2>
      <p className="mt-2 max-w-xs text-sm text-muted">{liked.length ? "They're waiting in your shortlist." : "Try a different budget or body style."}</p>
      {liked.length > 0 && (
        <div className="mt-6 flex -space-x-4">
          {top3.map((c, n) => (
            <motion.img key={c.id} src={c.images[0]?.src.replace(/\.jpg$/, "-sm.jpg")} alt={c.model} className="size-20 rounded-full border-4 border-surface object-cover" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0, transition: { delay: 0.2 + n * 0.08, type: "spring", stiffness: 300, damping: 16 } }} />
          ))}
        </div>
      )}
      <div className="mt-8 grid w-full max-w-xs gap-2.5">
        {liked.length >= 2 && (
          <>
            <button type="button" onClick={() => onAsk(`Compare the ${top3.map((c) => c.model).join(" and the ")}`)} className="btn-accent w-full">
              <Sparkles className="size-4" aria-hidden /> Help me choose
            </button>
            <Link to={`/compare?ids=${top3.map((c) => c.id).join(",")}`} onClick={() => onCompare(top3.map((c) => c.id))} className="btn-ghost w-full">
              <Scale className="size-4" aria-hidden /> Compare side by side
            </Link>
          </>
        )}
        {liked.length === 1 && (
          <Link to={`/cars/${liked[0].id}`} className="btn-accent w-full">
            See the {liked[0].model}
          </Link>
        )}
        <button type="button" onClick={onRestart} className="btn-ghost w-full">
          <RotateCcw className="size-4" aria-hidden /> Swipe again
        </button>
      </div>
    </motion.div>
  );
}
