import { useMemo, useRef, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Search, Sparkles, X } from "lucide-react";
import { inventory, type CarWithImages } from "@/data/inventory";
import { byPriceDesc, KMS, matches, PRICES, readFilters, YEARS, type Filters } from "@/lib/filters";
import { search } from "@/lib/search";
import { useMediaQuery } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";
import { useApp } from "@/state/app-state";
import { ExploreBar, type ExploreActions } from "./ExploreBar";
import { ListingCard } from "./ListingCard";

/**
 * Every car on the floor, most expensive first, with the Explore By filters.
 * Filters live in the URL of whichever page shows the collection.
 */
export function Collection({ id = "collection", heading }: { id?: string; heading?: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const f = useMemo(() => readFilters(params), [params]);
  const { openSearch, openConcierge } = useApp();
  const top = useRef<HTMLDivElement>(null);

  const cars = useMemo(() => {
    const pool = inventory.filter((c) => matches(c, f));
    if (!f.q) return pool.sort(byPriceDesc);
    const ranked = search(f.q, 999).cars.map((c) => c.id);
    return ranked.map((rid) => pool.find((c) => c.id === rid)).filter((c): c is CarWithImages => !!c);
  }, [f]);

  function update(mut: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params);
    mut(next);
    setParams(next, { replace: true, preventScrollReset: true });
    // Bring the results into view if the filters were changed from below them.
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth" });
  }

  const actions: ExploreActions = {
    toggle: (param, value) =>
      update((p) => {
        const cur = (p.get(param) ?? "").split(",").filter(Boolean);
        const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
        if (next.length) p.set(param, next.join(","));
        else p.delete(param);
      }),
    set: (param, value) => update((p) => (value ? p.set(param, value) : p.delete(param))),
    clear: (keys) => update((p) => (keys ?? ["brand", "body", "fuel", "price", "year", "km", "use", "status", "q"]).forEach((k) => p.delete(k))),
  };

  const chips = chipsFor(f, actions);
  const signature = params.toString();

  return (
    <section id={id} className="scroll-mt-16 lg:scroll-mt-[76px]">
      <div ref={top} className="-translate-y-px" />
      <ExploreBar
        f={f}
        total={cars.length}
        actions={actions}
        right={
          <>
            <span className="text-sm tabular-nums text-muted">
              <span className="font-semibold text-fg">{cars.length}</span> cars
            </span>
          </>
        }
      />

      <div className="container-wide pb-12 pt-8 sm:pt-10">
        <div className="mb-8 flex flex-col gap-5 sm:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>{heading}</div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => openSearch(f.q)} className="flex h-11 min-w-[260px] items-center gap-3 rounded-full border border-line-strong bg-surface px-4 text-left text-sm text-muted transition-colors duration-150 hover:border-accent/60 sm:min-w-[340px]">
              <Search className="size-4 text-accent-fg" aria-hidden />
              <span className="flex-1 truncate">{f.q ? `“${f.q}”` : "Search by make, model or budget"}</span>
              <kbd className="hidden rounded-md border border-line-strong px-1.5 text-[11px] sm:block">⌘K</kbd>
            </button>
          </div>
        </div>

        {chips.length > 0 && (
          <motion.div layout className="mb-8 flex flex-wrap items-center gap-2">
            <AnimatePresence initial={false}>
              {chips.map((c) => (
                <motion.button
                  key={c.label}
                  layout
                  type="button"
                  onClick={c.clear}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[13px] font-medium text-on-accent transition-colors duration-150 hover:bg-accent-strong"
                >
                  {c.label} <X className="size-3.5" aria-hidden />
                  <span className="sr-only">Remove filter</span>
                </motion.button>
              ))}
            </AnimatePresence>
            {chips.length > 1 && (
              <button type="button" onClick={() => actions.clear()} className="h-9 px-2 text-[13px] text-muted hover:text-fg">
                Clear all
              </button>
            )}
          </motion.div>
        )}

        {cars.length === 0 ? (
          <div className="grid place-items-center rounded-[32px] border border-dashed border-line-strong px-6 py-24 text-center">
            <p className="display text-3xl">Nothing on the floor matches that.</p>
            <p className="mt-3 max-w-md text-muted">New cars arrive most weeks. Loosen a filter, or ask the Co-Driver to find the nearest match.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => actions.clear()} className="btn-ghost">
                Clear filters
              </button>
              <button type="button" onClick={() => openConcierge()} className="btn-accent">
                <Sparkles className="size-4" aria-hidden /> Ask the Co-Driver
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={signature} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1, transition: { duration: 0.45, ease: ease.enter } }} exit={{ opacity: 0, scale: 0.985, transition: { duration: 0.18 } }}>
              <Gallery cars={cars} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}

const OFFSETS = [0, 96, 36, 132];
const OFFSETS_COMPACT = [0, 44, 0, 0];

/**
 * Staggered columns, filled left to right so price order reads across the
 * rows. The columns start offset and rise into line as you scroll, so the
 * gallery finishes flush instead of leaving a ragged gap above what follows.
 */
function Gallery({ cars }: { cars: CarWithImages[] }) {
  const xl = useMediaQuery("(min-width: 1536px)");
  const lg = useMediaQuery("(min-width: 1024px)");
  const sm = useMediaQuery("(min-width: 640px)");
  const reduce = useReducedMotion();
  const cols = xl ? 4 : lg ? 3 : 2;
  const compact = !sm;
  const offsets = compact ? OFFSETS_COMPACT : OFFSETS;
  const ref = useRef<HTMLDivElement>(null);
  // Progress reaches 1 as the gallery's bottom meets the viewport's bottom,
  // which is exactly when every column has risen by its own offset.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y0 = useTransform(scrollYProgress, [0, 1], [0, -offsets[0]]);
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -offsets[1]]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -offsets[2]]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -offsets[3]]);
  const ys = [y0, y1, y2, y3];

  const columns = Array.from({ length: cols }, (_, i) => cars.map((c, k) => ({ c, k })).filter(({ k }) => k % cols === i));
  // The offsets add layout height that the rise takes back; reclaim it.
  const reclaim = reduce ? 0 : Math.max(...offsets.slice(0, cols));

  return (
    <div ref={ref} className={cn("flex items-start", compact ? "gap-3" : "gap-5 xl:gap-7")} style={{ marginBottom: -reclaim }}>
      {columns.map((col, i) => (
        <motion.div key={i} className={cn("flex min-w-0 flex-1 flex-col", compact ? "gap-3" : "gap-5 xl:gap-7")} style={{ y: reduce ? 0 : ys[i], marginTop: offsets[i] }}>
          {col.map(({ c, k }) => (
            <ListingCard key={c.id} car={c} compact={compact} index={k} />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

function chipsFor(f: Filters, a: ExploreActions) {
  const out: { label: string; clear: () => void }[] = [];
  if (f.q) out.push({ label: `“${f.q}”`, clear: () => a.clear(["q"]) });
  if (f.price) out.push({ label: PRICES.find((p) => p.key === f.price)?.label ?? "Price", clear: () => a.set("price", null) });
  f.brands.forEach((b) => out.push({ label: b, clear: () => a.toggle("brand", b) }));
  f.categories.forEach((c) => out.push({ label: c, clear: () => a.toggle("body", c) }));
  f.fuels.forEach((x) => out.push({ label: x, clear: () => a.toggle("fuel", x) }));
  if (f.year) out.push({ label: YEARS.find((y) => y.key === f.year)?.label ?? f.year, clear: () => a.set("year", null) });
  if (f.km) out.push({ label: KMS.find((k) => k.key === f.km)?.label ?? f.km, clear: () => a.set("km", null) });
  if (f.use) out.push({ label: f.use[0].toUpperCase() + f.use.slice(1).replace("-", " "), clear: () => a.clear(["use"]) });
  if (f.status) out.push({ label: "Just arrived", clear: () => a.clear(["status"]) });
  return out;
}

