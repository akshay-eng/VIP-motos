import { useEffect, useRef, type ReactNode } from "react";
import { animate, motion, useInView, useReducedMotion, useSpring } from "motion/react";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";

/** Masked word-by-word reveal for headlines. */
export function SplitReveal({ text, className, wordClassName, delay = 0, step = 0.07, as: Tag = "span" }: { text: string; className?: string; wordClassName?: (word: string, i: number) => string | undefined; delay?: number; step?: number; as?: "span" | "h1" | "h2" | "h3" | "p" }) {
  const words = text.split(" ");
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className={cn("inline-block will-change-transform", wordClassName?.(w, i))}
            initial={{ y: "110%", rotate: 4 }}
            whileInView={{ y: "0%", rotate: 0 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.9, ease: ease.enter, delay: delay + i * step }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Counts up to `to` the first time it scrolls into view. */
export function CountUp({ to, suffix = "", className, duration = 1.6 }: { to: number; suffix?: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = `${to}${suffix}`;
      return;
    }
    const c = animate(0, to, { duration, ease: ease.enter, onUpdate: (v) => (el.textContent = `${Math.round(v)}${suffix}`) });
    return () => c.stop();
  }, [inView, to, suffix, duration, reduce]);
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      0{suffix}
    </span>
  );
}

/** Pulls its child a little toward the pointer. Desktop pointers only. */
export function Magnetic({ children, strength = 0.3, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 260, damping: 18 });
  const y = useSpring(0, { stiffness: 260, damping: 18 });
  return (
    <motion.div
      ref={ref}
      className={cn("inline-flex", className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Thin red light streaks sweeping across, after the showroom's facade lighting. */
export function Streaks({ className, count = 3 }: { className?: string; count?: number }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="streak absolute h-[38%] w-[2px] rounded-full bg-gradient-to-b from-transparent via-[#ff4655] to-transparent opacity-0 shadow-[0_0_18px_4px_rgba(225,29,42,0.45)]"
          style={{ left: `${48 + i * 12}%`, top: `${[8, 30, 52][i % 3]}%`, ["--streak-delay" as string]: `${i * 1.3}s`, ["--streak-duration" as string]: `${4.2 + i * 0.8}s` }}
        />
      ))}
    </div>
  );
}
