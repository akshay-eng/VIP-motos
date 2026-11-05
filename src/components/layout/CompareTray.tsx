import { Link, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Scale, X } from "lucide-react";
import { byId } from "@/data/inventory";
import { ease } from "@/lib/motion";
import { COMPARE_LIMIT, useApp } from "@/state/app-state";

export function CompareTray() {
  const { compare, toggleCompare, setCompare } = useApp();
  const { pathname } = useLocation();
  const show = compare.length > 0 && pathname !== "/compare";
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: ease.enter } }}
          exit={{ opacity: 0, y: 20, transition: { duration: 0.25, ease: ease.exit } }}
          className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-line-strong bg-surface-2 p-2.5 shadow-2xl md:bottom-6"
        >
          <ul className="flex gap-1.5">
            {compare.map((id) => {
              const c = byId.get(id);
              if (!c) return null;
              return (
                <li key={id} className="relative">
                  <img src={c.images[0]?.src.replace(/\.jpg$/, "-sm.jpg")} alt={c.model} className="h-11 w-16 rounded-lg object-cover" />
                  <button type="button" onClick={() => toggleCompare(id)} aria-label={`Remove ${c.model} from compare`} className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-fg text-bg">
                    <X className="size-3" />
                  </button>
                </li>
              );
            })}
            {Array.from({ length: COMPARE_LIMIT - compare.length }).map((_, i) => (
              <li key={i} className="h-11 w-16 rounded-lg border border-dashed border-line-strong" aria-hidden />
            ))}
          </ul>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => setCompare([])} className="hidden h-10 rounded-full px-3 text-xs text-muted hover:text-fg sm:block">
              Clear
            </button>
            <Link to={`/compare?ids=${compare.join(",")}`} className="btn-accent h-10 px-4 text-[13px]">
              <Scale className="size-4" aria-hidden /> Compare {compare.length}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
