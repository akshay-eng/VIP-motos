import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight, ArrowUpRight, Search, Sparkles } from "lucide-react";
import { brands, inventory } from "@/data/inventory";
import { site } from "@/data/site";
import { BrandLogo } from "@/components/BrandLogo";
import { CountUp, Streaks } from "@/components/fx";
import { INTRO_SECONDS } from "@/components/Intro";
import { priceShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";
import { useApp } from "@/state/app-state";

// The most expensive cars on the floor lead the slideshow.
const SLIDES = [...inventory].sort((a, b) => b.price - a.price).slice(0, 5);
const SLIDE_MS = 6000;
const PROMPTS = ["Family SUV under ₹1 Cr", "Weekend sports car", "Chauffeur-driven sedan", "Electric, long range"];
const LINES = ["Bengaluru's", "finest", "luxury cars."];

export function Hero() {
  const [i, setI] = useState(0);
  const { openConcierge, openSearch } = useApp();
  const ref = useRef<HTMLElement>(null);
  const car = SLIDES[i];

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [i]);

  // Pointer parallax: the photo drifts with the mouse, the outline type against it.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const imgX = useTransform(sx, (v) => v * -18);
  const imgY = useTransform(sy, (v) => v * -12);
  const typeX = useTransform(sx, (v) => v * 40);

  // Scroll parallax: copy lifts and fades, the photo zooms.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const zoom = useTransform(scrollYProgress, [0, 1], [1, 1.18]);

  const d = INTRO_SECONDS;

  return (
    <section
      ref={ref}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        mx.set(e.clientX / innerWidth - 0.5);
        my.set(e.clientY / innerHeight - 0.5);
      }}
      className="relative isolate flex min-h-[640px] flex-col justify-end overflow-hidden bg-black pb-8 pt-32 text-white sm:pb-10 lg:min-h-[min(88dvh,900px)]"
    >
      <motion.div className="absolute inset-[-3%] -z-10" style={{ x: imgX, y: imgY, scale: zoom }}>
        <AnimatePresence initial={false}>
          <motion.img
            key={car.id}
            src={car.images[0].src}
            alt=""
            className="drift absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.12, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 1.4, ease: ease.enter } }}
            exit={{ opacity: 0, transition: { duration: 1.2, ease: ease.standard } }}
          />
        </AnimatePresence>
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-black/45" />
      <div className="scrim-b absolute inset-0 -z-10" />
      <div className="absolute inset-y-0 left-0 -z-10 w-2/3 bg-gradient-to-r from-black/70 to-transparent" />
      <Streaks className="-z-10 opacity-70" />

      <motion.span
        aria-hidden
        style={{ x: typeX }}
        className="display-italic text-outline pointer-events-none absolute -right-[4vw] top-[14%] -z-10 select-none text-[30vw] leading-none text-white/[0.09] lg:text-[24vw]"
        initial={{ opacity: 0, x: 120 }}
        animate={{ opacity: 1, transition: { duration: 1.4, ease: ease.enter, delay: d + 0.2 } }}
      >
        VIP
      </motion.span>

      <motion.div className="container-x" style={{ y: copyY, opacity: copyOpacity }}>
        <motion.p className="eyebrow !text-white/80" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.7, ease: ease.enter, delay: d } }}>
          <span className="mr-3 inline-block h-px w-10 bg-accent align-middle" />
          Est. {site.established} · Rajajinagar, Bengaluru
        </motion.p>
        <h1 className="mt-5 max-w-4xl text-[46px] sm:text-7xl lg:text-[80px] 2xl:text-[96px]" aria-label={LINES.join(" ")}>
          {LINES.map((line, n) => (
            <span key={line} className="block overflow-hidden pb-[0.08em]" aria-hidden>
              <motion.span
                className={cn("block", n === 1 ? "display-italic text-accent" : "display")}
                initial={{ y: "115%", skewY: 6 }}
                animate={{ y: "0%", skewY: 0, transition: { duration: 1.05, ease: ease.enter, delay: d + 0.1 + n * 0.12 } }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: ease.enter, delay: d + 0.5 } }}>
          {inventory.length} hand-picked cars, from the Ferrari down. Search the floor, or tell the AI Co-Driver how you drive and it finds your match.
        </motion.p>

        <motion.button
          type="button"
          onClick={() => openSearch()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: ease.enter, delay: d + 0.62 } }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="group mt-8 flex w-full max-w-2xl items-center gap-3 rounded-full border border-white/25 bg-black/55 p-2 pl-6 text-left backdrop-blur-md transition-colors duration-150 hover:border-white/50"
        >
          <Search className="size-5 shrink-0 text-[#ff4655]" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[15px] text-white/70 sm:text-lg">
            Search {inventory.length} cars, brands or budgets…
          </span>
          <kbd className="hidden rounded-md border border-white/25 px-1.5 py-0.5 text-[11px] text-white/70 sm:block">⌘K</kbd>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e11d2a] text-white transition-transform duration-300 group-hover:rotate-[-10deg] sm:size-12">
            <ArrowRight className="size-5" aria-hidden />
          </span>
        </motion.button>
        <motion.div className="mt-4 flex flex-wrap gap-2" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: d + 0.75 } } }}>
          {PROMPTS.map((p) => (
            <motion.button
              key={p}
              type="button"
              onClick={() => openConcierge(p)}
              title="Ask the Co-Driver"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: ease.enter } } }}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3.5 text-xs text-white/90 transition-colors duration-150 hover:border-[#e11d2a] hover:text-white"
            >
              <Sparkles className="size-3 text-[#ff4655]" aria-hidden />
              {p}
            </motion.button>
          ))}
        </motion.div>

        <motion.div className="mt-10 grid gap-6 border-t border-white/15 pt-5 lg:grid-cols-[1fr_auto]" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.8, delay: d + 0.9 } }}>
          <div className="flex min-w-0 items-center gap-5">
            <div className="flex shrink-0 gap-1 sm:gap-1.5" role="tablist" aria-label="Featured cars">
              {SLIDES.map((c, n) => (
                <button key={c.id} type="button" role="tab" aria-selected={n === i} aria-label={`${c.make} ${c.model}`} onClick={() => setI(n)} className="group grid h-6 w-5 place-items-center sm:w-12">
                  <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/25">
                    {n === i && <motion.span key={`${c.id}-${i}`} className="absolute inset-0 origin-left bg-accent" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: SLIDE_MS / 1000, ease: "linear" }} />}
                    {n < i && <span className="absolute inset-0 bg-white/70" />}
                  </span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={car.id} className="min-w-0" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: ease.enter } }} exit={{ opacity: 0, y: -10, transition: { duration: 0.25 } }}>
                <Link to={`/cars/${car.id}`} className="group flex min-w-0 items-center gap-3 text-sm">
                  <BrandLogo brand={car.make} className="h-5 text-white/80" />
                  <span className="truncate text-white/75">
                    {car.year} {car.make} {car.model}
                  </span>
                  <span className="display shrink-0 whitespace-nowrap text-base">{priceShort(car.price)}</span>
                  <ArrowUpRight className="size-4 shrink-0 text-accent-fg transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
          <dl className="hidden gap-8 text-sm lg:flex">
            {[
              { n: inventory.length, l: "cars on the floor" },
              { n: brands.length, l: "marques" },
              { n: new Date().getFullYear() - site.established, l: "years in Bengaluru" },
            ].map((s) => (
              <div key={s.l} className="text-right">
                <dd className="display text-2xl">
                  <CountUp to={s.n} />
                </dd>
                <dt className="text-xs text-white/60">{s.l}</dt>
              </div>
            ))}
          </dl>
        </motion.div>
      </motion.div>
    </section>
  );
}
