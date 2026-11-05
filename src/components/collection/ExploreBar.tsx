import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CalendarDays, Car, ChevronDown, Droplet, Fuel, Gauge, IndianRupee, Leaf, Tag, X, Zap } from "lucide-react";
import { brandOf, brands, inventory, type CarWithImages } from "@/data/inventory";
import { BodyIcon } from "@/components/BodyIcon";
import { BrandLogo } from "@/components/BrandLogo";
import { CATEGORIES, FUELS, inCategory, KMS, matches, PRICES, YEARS, type FilterKey, type Filters } from "@/lib/filters";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";

type Panel = "price" | "brand" | "category" | "fuel" | "year" | "km";

const TABS: { key: Panel; label: string; icon: typeof Tag }[] = [
  { key: "price", label: "Price", icon: IndianRupee },
  { key: "brand", label: "Brand", icon: Tag },
  { key: "category", label: "Category", icon: Car },
  { key: "fuel", label: "Fuel", icon: Fuel },
  { key: "year", label: "Year", icon: CalendarDays },
  { key: "km", label: "KM Driven", icon: Gauge },
];

const FUEL_ICON = { Petrol: Fuel, Diesel: Droplet, Hybrid: Leaf, Electric: Zap } as const;
const FUEL_NOTE = { Petrol: "Turbo sixes, V8s and V12s", Diesel: "Torque for the highway", Hybrid: "Cheaper in city traffic", Electric: "Silent, instant, zero fuel" } as const;

export interface ExploreActions {
  toggle: (param: "brand" | "body" | "fuel", value: string) => void;
  set: (param: "price" | "year" | "km", value: string | null) => void;
  clear: (params?: string[]) => void;
}

export function ExploreBar({ f, total, actions, right }: { f: Filters; total: number; actions: ExploreActions; right?: ReactNode }) {
  const [open, setOpen] = useState<Panel | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = (skip: FilterKey, test: (c: CarWithImages) => boolean) => inventory.filter((c) => matches(c, f, skip) && test(c)).length;
  const selected: Record<Panel, number> = {
    price: f.price ? 1 : 0,
    brand: f.brands.length,
    category: f.categories.length,
    fuel: f.fuels.length,
    year: f.year ? 1 : 0,
    km: f.km ? 1 : 0,
  };
  const panelParams: Record<Panel, string[]> = { price: ["price"], brand: ["brand"], category: ["body"], fuel: ["fuel"], year: ["year"], km: ["km"] };

  return (
    <div ref={root} className="sticky top-16 z-20 border-y border-line bg-bg/90 backdrop-blur-xl lg:top-[76px]">
      <div className="container-wide flex h-14 items-center gap-1 sm:h-16">
        <span className="mr-3 hidden shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-subtle lg:block">Explore by</span>
        <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const on = open === key;
            const n = selected[key];
            return (
              <button
                key={key}
                type="button"
                aria-expanded={on}
                aria-controls="explore-panel"
                onClick={() => setOpen(on ? null : key)}
                className={cn(
                  "relative flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm transition-colors duration-150 sm:px-4",
                  on ? "bg-fg text-bg" : n ? "bg-accent/10 text-accent-fg" : "text-fg/85 hover:bg-fg/5",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
                {n > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold tabular-nums text-on-accent">{n}</span>}
                <ChevronDown className={cn("size-3.5 transition-transform duration-300", on && "rotate-180")} aria-hidden />
              </button>
            );
          })}
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-2">{right}</div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            id="explore-panel"
            role="dialog"
            aria-label={`Filter by ${TABS.find((t) => t.key === open)?.label}`}
            className="absolute inset-x-0 top-full"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: ease.enter } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.18, ease: ease.exit } }}
          >
            <div className="container-wide">
              <div className="max-h-[min(640px,72dvh)] overflow-y-auto rounded-b-[28px] border border-t-0 border-line-strong bg-elevated p-4 shadow-2xl shadow-black/30 sm:p-7">
                <AnimatePresence mode="wait">
                  <motion.div key={open} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.1 } }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.02 } } }}>
                    {open === "price" && (
                      <Grid className="grid-cols-1 sm:grid-cols-3 lg:grid-cols-5">
                        {PRICES.map((p) => (
                          <Tile key={p.key} on={f.price === p.key} disabled={!count("price", (c) => c.price >= p.min && c.price < p.max)} onClick={() => actions.set("price", f.price === p.key ? null : p.key)}>
                            <span className="flex items-end gap-1" aria-hidden>
                              {[1, 2, 3, 4, 5].map((t) => (
                                <span key={t} className={cn("w-2.5 rounded-sm transition-colors duration-300", t <= p.tier ? "bg-accent" : "bg-line-strong")} style={{ height: 8 + t * 6 }} />
                              ))}
                            </span>
                            <span className="mt-4 text-base font-semibold">{p.label}</span>
                            <Count n={count("price", (c) => c.price >= p.min && c.price < p.max)} />
                          </Tile>
                        ))}
                      </Grid>
                    )}
                    {open === "brand" && (
                      <Grid className="grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
                        {brands.map((b) => {
                          const n = count("brands", (c) => brandOf(c) === b.name);
                          return (
                            <Tile key={b.name} on={f.brands.includes(b.name)} disabled={!n} onClick={() => actions.toggle("brand", b.name)} className="items-center text-center">
                              <BrandLogo brand={b.name} className="h-10 sm:h-12" />
                              <span className="mt-3 w-full truncate text-[13px] font-medium">{b.name}</span>
                              <Count n={n} />
                            </Tile>
                          );
                        })}
                      </Grid>
                    )}
                    {open === "category" && (
                      <Grid className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
                        {CATEGORIES.map((cat) => {
                          const n = count("categories", (c) => inCategory(c, cat));
                          return (
                            <Tile key={cat} on={f.categories.includes(cat)} disabled={!n} onClick={() => actions.toggle("body", cat)} className="items-center text-center">
                              <BodyIcon category={cat} className="h-14 sm:h-16" />
                              <span className="mt-3 text-[15px] font-medium">{cat === "MPV" ? "MPV / MUV" : cat}</span>
                              <Count n={n} />
                            </Tile>
                          );
                        })}
                      </Grid>
                    )}
                    {open === "fuel" && (
                      <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {FUELS.map((fuel) => {
                          const Icon = FUEL_ICON[fuel];
                          const n = count("fuels", (c) => c.fuel === fuel);
                          return (
                            <Tile key={fuel} on={f.fuels.includes(fuel)} disabled={!n} onClick={() => actions.toggle("fuel", fuel)} className="flex-row items-center gap-4">
                              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-fg/5 transition-colors duration-200 group-aria-pressed:bg-accent group-aria-pressed:text-on-accent">
                                <Icon className="size-6" aria-hidden />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-base font-semibold">{fuel}</span>
                                <span className="block truncate text-xs text-muted">{FUEL_NOTE[fuel]}</span>
                              </span>
                              <span className="text-xs tabular-nums text-subtle">{n}</span>
                              <ArrowRight className="size-4 text-subtle transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                            </Tile>
                          );
                        })}
                      </Grid>
                    )}
                    {open === "year" && (
                      <Grid className="grid-cols-2 lg:grid-cols-4">
                        {YEARS.map((y) => {
                          const n = count("year", (c) => c.year >= y.min && c.year <= y.max);
                          return (
                            <Tile key={y.key} on={f.year === y.key} disabled={!n} onClick={() => actions.set("year", f.year === y.key ? null : y.key)}>
                              <CalendarDays className="size-7 text-accent-fg" aria-hidden />
                              <span className="display mt-4 text-2xl">{y.key.replace("-", "–").replace(/–$/, "+").replace(/^–/, "≤ ")}</span>
                              <span className="text-sm text-muted">{y.label}</span>
                              <Count n={n} />
                            </Tile>
                          );
                        })}
                      </Grid>
                    )}
                    {open === "km" && (
                      <Grid className="grid-cols-2 lg:grid-cols-4">
                        {KMS.map((k) => {
                          const n = count("km", (c) => c.km >= k.min && c.km < k.max);
                          return (
                            <Tile key={k.key} on={f.km === k.key} disabled={!n} onClick={() => actions.set("km", f.km === k.key ? null : k.key)}>
                              <Dial level={k.level} />
                              <span className="mt-3 text-base font-semibold">{k.label}</span>
                              <Count n={n} />
                            </Tile>
                          );
                        })}
                      </Grid>
                    )}
                  </motion.div>
                </AnimatePresence>
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
                  <button type="button" onClick={() => actions.clear(panelParams[open])} disabled={!selected[open]} className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm text-muted transition-colors duration-150 hover:text-fg disabled:opacity-40">
                    <X className="size-4" aria-hidden /> Clear {TABS.find((t) => t.key === open)?.label.toLowerCase()}
                  </button>
                  <button type="button" onClick={() => setOpen(null)} className="btn-accent h-11 px-6">
                    Show {total} car{total === 1 ? "" : "s"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Grid({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid gap-2.5 sm:gap-3", className)}>{children}</div>;
}

function Tile({ on, disabled, onClick, className, children }: { on: boolean; disabled?: boolean; onClick: () => void; className?: string; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      disabled={disabled && !on}
      onClick={onClick}
      variants={{ hidden: { opacity: 0, y: 12, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: ease.enter } } }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-[border-color,background-color,color] duration-200 disabled:pointer-events-none disabled:opacity-35 sm:p-5",
        on ? "border-accent bg-accent/[0.08] text-fg [&_svg]:text-accent-fg" : "border-line bg-surface text-fg/90 hover:border-line-strong",
        className,
      )}
    >
      {children}
      {on && <motion.span layoutId="tile-check" className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent" />}
    </motion.button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="mt-1 text-xs tabular-nums text-subtle">{n ? `${n} car${n === 1 ? "" : "s"}` : "None right now"}</span>;
}

/** A small speedometer whose needle rises with the kilometre bucket. */
function Dial({ level }: { level: number }) {
  const angle = -80 + (level - 1) * 53;
  return (
    <svg viewBox="0 0 64 40" className="h-10 w-auto" aria-hidden>
      <path d="M6 36 A26 26 0 0 1 58 36" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-line-strong" />
      <path d="M6 36 A26 26 0 0 1 58 36" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-accent" pathLength={4} strokeDasharray={`${level} 4`} />
      <g transform={`rotate(${angle} 32 36)`}>
        <path d="M32 36 V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx="32" cy="36" r="3.5" fill="currentColor" />
    </svg>
  );
}
