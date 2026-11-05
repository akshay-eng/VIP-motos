import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ease } from "@/lib/motion";
import { Badge } from "./Logo";

const KEY = "vip.intro";

function shouldPlay() {
  if (typeof window === "undefined") return false;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (new URLSearchParams(location.search).has("ask")) return false;
  try {
    return !sessionStorage.getItem(KEY);
  } catch {
    return true;
  }
}

/** Decided once per page load, so the hero can hold its entrance until the curtain lifts. */
export const introPlays = shouldPlay();
export const INTRO_SECONDS = introPlays ? 2.15 : 0;

/**
 * Once per session: the badge draws itself, the wordmark slams in, a red
 * light streak sweeps across, then the screen splits open.
 */
export function Intro() {
  const [open, setOpen] = useState(introPlays);

  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* fine */
    }
    const t = setTimeout(() => setOpen(false), 1750);
    document.documentElement.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence onExitComplete={() => (document.documentElement.style.overflow = "")}>
      {open && (
        <motion.div key="intro" className="fixed inset-0 z-[70] text-white" exit={{ pointerEvents: "none" }} aria-hidden>
          <motion.div className="absolute inset-x-0 top-0 h-1/2 bg-[#070708]" exit={{ y: "-100%", transition: { duration: 0.85, ease: ease.inOut } }} />
          <motion.div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#070708]" exit={{ y: "100%", transition: { duration: 0.85, ease: ease.inOut } }} />
          <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-6" exit={{ opacity: 0, scale: 1.08, transition: { duration: 0.35, ease: ease.exit } }}>
            <motion.div initial={{ opacity: 0, scale: 0.6, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.8, ease: ease.enter } }}>
              <Badge className="h-28 w-auto drop-shadow-[0_0_30px_rgba(225,29,42,0.35)]" draw />
            </motion.div>
            <div className="flex items-baseline gap-3 overflow-hidden px-4">
              <motion.span className="display-italic text-5xl text-[#e11d2a] sm:text-7xl" initial={{ x: -80, skewX: -20, opacity: 0 }} animate={{ x: 0, skewX: 0, opacity: 1, transition: { duration: 0.6, ease: ease.enter, delay: 0.45 } }}>
                VIP
              </motion.span>
              <span className="display flex text-4xl sm:text-6xl">
                {"MOTORS".split("").map((ch, i) => (
                  <motion.span key={i} className="inline-block" initial={{ y: "120%" }} animate={{ y: 0, transition: { duration: 0.55, ease: ease.enter, delay: 0.6 + i * 0.045 } }}>
                    {ch}
                  </motion.span>
                ))}
              </span>
            </div>
            <motion.p className="text-[11px] font-medium uppercase tracking-[0.5em] text-white/60" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 1.05, duration: 0.5 } }}>
              Est. 2010 · Bengaluru
            </motion.p>
          </motion.div>
          <motion.div
            className="absolute left-0 top-1/2 h-[3px] w-full origin-left bg-gradient-to-r from-transparent via-[#e11d2a] to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 0], transition: { duration: 0.9, times: [0, 0.6, 1], ease: ease.enter, delay: 1.0 } }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
