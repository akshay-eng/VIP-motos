import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Check, Heart, Sparkles } from "lucide-react";
import { byId, carTitle } from "@/data/inventory";
import type { ConciergeReply, Recommendation } from "@/ai/types";
import { BrandLogo } from "@/components/BrandLogo";
import { emiShort, km, priceShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";
import { useApp } from "@/state/app-state";
import { ActionButtons, CompareTable, EmiTable, UnderstoodChips } from "./ReplyBlocks";

const STARTERS = [
  { prompt: "7-seater SUV for the family under ₹1 Cr", car: "audi-q7-55-tfsi-2022" },
  { prompt: "A weekend sports car, budget no bar", car: "porsche-911-carrera-s-2021" },
  { prompt: "Chauffeur-driven sedan for business", car: "maybach-s580-2022" },
  { prompt: "Electric luxury car with long range", car: "mercedes-eqs-580-2024" },
  { prompt: "Something for Coorg trails, under 1.5 cr", car: "land-rover-defender-110-2023" },
  { prompt: "My first luxury car under 50 lakh", car: "mercedes-c220d-2023" },
];

/** The right-hand side of the Co-Driver: whatever the latest answer showed, large. */
export function MatchesPane({ reply, onSend, onRemove, onNavigate }: { reply?: ConciergeReply; onSend: (t: string) => void; onRemove: (k: string) => void; onNavigate: () => void }) {
  const has = !!reply && (reply.cars.length > 0 || !!reply.compare || !!reply.emi);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AnimatePresence mode="wait" initial={false}>
        {has && reply ? (
          <motion.div key={reply.text} className="min-h-0 flex-1 overflow-y-auto p-6 xl:p-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: ease.enter } }} exit={{ opacity: 0, y: -10, transition: { duration: 0.18 } }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{reply.compare ? "Side by side" : reply.emi ? "Finance" : "Your matches"}</p>
                <h3 className="display mt-2 text-3xl">{reply.compare ? "How they compare" : reply.emi ? "The monthly numbers" : `${reply.cars.length} car${reply.cars.length === 1 ? "" : "s"} for you`}</h3>
              </div>
              <UnderstoodChips reply={reply} onRemove={reply.source === "local" ? onRemove : undefined} />
            </div>
            {reply.cars.length > 0 && !reply.compare && (
              <ul className={cn("mt-6 grid gap-5", reply.cars.length > 1 && "xl:grid-cols-2")}>
                {reply.cars.map((r, i) => (
                  <MatchCard key={r.id} rec={r} index={i} big={reply.cars.length === 1 || (i === 0 && reply.cars.length === 3)} onNavigate={onNavigate} />
                ))}
              </ul>
            )}
            {reply.compare && (
              <div className="mt-6 grid gap-5">
                <div className="grid grid-cols-3 gap-3">
                  {reply.compare.map((id) => {
                    const c = byId.get(id);
                    return c ? (
                      <Link key={id} to={`/cars/${id}`} onClick={onNavigate} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-black text-white">
                        <img src={c.images[0]?.src.replace(/\.jpg$/, "-sm.jpg")} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700" />
                        <div className="scrim-b absolute inset-0" />
                        <span className="absolute inset-x-3 bottom-2.5 text-sm font-semibold">{c.model}</span>
                      </Link>
                    ) : null;
                  })}
                </div>
                <CompareTable ids={reply.compare} />
              </div>
            )}
            {reply.emi && (
              <div className="mt-6 max-w-md">
                <EmiTable emi={reply.emi} />
              </div>
            )}
            <div className="mt-6">
              <ActionButtons actions={reply.actions} onNavigate={onNavigate} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="start" className="min-h-0 flex-1 overflow-y-auto p-6 xl:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="eyebrow">Start here</p>
            <h3 className="display mt-2 text-3xl">Tell me what you drive towards.</h3>
            <p className="mt-2 max-w-lg text-sm text-muted">Pick one of these, or type it your way on the left. Matches appear here, big enough to fall for.</p>
            <motion.ul className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-3" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}>
              {STARTERS.map((s) => {
                const c = byId.get(s.car)!;
                return (
                  <motion.li key={s.prompt} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: ease.enter } } }}>
                    <button type="button" onClick={() => onSend(s.prompt)} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black text-left text-white">
                      <img src={c.images[0]?.src.replace(/\.jpg$/, "-sm.jpg")} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-[transform,opacity] duration-700 ease-[var(--ease-expo)] group-hover:opacity-100" />
                      <div className="scrim-b absolute inset-0" />
                      <span className="absolute inset-x-4 bottom-3.5 flex items-end justify-between gap-2">
                        <span className="text-sm font-medium leading-snug">{s.prompt}</span>
                        <Sparkles className="size-4 shrink-0 text-[#ff4655]" aria-hidden />
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchCard({ rec, index, big, onNavigate }: { rec: Recommendation; index: number; big: boolean; onNavigate: () => void }) {
  const car = byId.get(rec.id);
  const { shortlist, toggleShortlist, requestCallback } = useApp();
  if (!car) return null;
  const saved = shortlist.includes(car.id);
  return (
    <motion.li
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: ease.enter, delay: 0.08 + index * 0.09 } }}
      className={cn("overflow-hidden rounded-[24px] border border-line bg-bg", big && "xl:col-span-2")}
    >
      <Link to={`/cars/${car.id}`} onClick={onNavigate} className="group block">
        <div data-vt-img className={cn("relative overflow-hidden bg-black", big ? "aspect-[21/9]" : "aspect-[16/10]")}>
          <img src={car.images[0]?.src} alt={carTitle(car)} className="h-full w-full object-cover transition-transform duration-[900ms] ease-[var(--ease-expo)]" />
          <div className="scrim-b absolute inset-0" />
          <span className="absolute left-4 top-4 rounded-full bg-[#e11d2a] px-2.5 py-1 text-[11px] font-semibold text-white">{index === 0 ? "Top match" : `#${index + 1}`}</span>
          <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-4 text-white">
            <div className="min-w-0">
              <BrandLogo brand={car.make} className="h-5 text-white/85" />
              <p className="display mt-2 truncate text-2xl">{car.model}</p>
              <p className="truncate text-sm text-white/70">
                {car.year} · {km(car.km)} · {car.variant}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="display text-2xl tabular-nums">{priceShort(car.price)}</p>
              <p className="text-xs text-white/70">EMI {emiShort(car.price)}</p>
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 size-5 text-white/80 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
        </div>
      </Link>
      {rec.reasons.length > 0 && (
        <ul className="grid gap-2 px-5 py-4">
          {rec.reasons.map((r) => (
            <li key={r} className="flex gap-2.5 text-sm leading-snug text-fg/85">
              <Check className="mt-0.5 size-4 shrink-0 text-accent-fg" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      )}
      <div className="flex border-t border-line">
        <button type="button" onClick={() => toggleShortlist(car.id)} aria-pressed={saved} className="flex h-11 flex-1 items-center justify-center gap-1.5 text-sm font-medium text-fg/85 transition-colors duration-150 hover:bg-fg/5">
          <Heart className={cn("size-4", saved && "fill-accent text-accent-fg")} aria-hidden /> {saved ? "Saved" : "Save"}
        </button>
        <span className="w-px bg-line" />
        <button type="button" onClick={() => requestCallback({ carId: car.id, intent: "test-drive" })} className="flex h-11 flex-1 items-center justify-center text-sm font-medium text-fg/85 transition-colors duration-150 hover:bg-fg/5">
          Book a test drive
        </button>
      </div>
    </motion.li>
  );
}
