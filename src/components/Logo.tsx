import { useId } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";

/**
 * The VIP Motors badge, redrawn as SVG from the shield logo: a metallic
 * shield, a red coupé in outline, and the wordmark. `withText` adds the
 * VIP / MOTORS / EST. 2010 lettering for large sizes.
 */
export function Badge({ className, withText = false, draw = false }: { className?: string; withText?: boolean; draw?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 110" className={className} aria-hidden>
      <defs>
        <linearGradient id={`rim-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f4f5" />
          <stop offset="0.45" stopColor="#8e8e95" />
          <stop offset="0.55" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#52525b" />
        </linearGradient>
      </defs>
      <path d="M9 13Q50 1 91 13L89 62Q86 89 50 106Q14 89 11 62Z" fill="#0b0b0c" stroke={`url(#rim-${id})`} strokeWidth="3.2" />
      <path
        d={withText ? "M17 47c6-7 15-10 25-12 8-7 17-10 28-9 7 .6 12 4 16 10l1 5h-4a7 7 0 0 0-14 0H38a7 7 0 0 0-14 0h-6z" : "M14 62c7-9 18-13 31-15 9-9 21-13 34-12 9 1 15 5 20 13l1 6h-5a9 9 0 0 0-18 0H42a9 9 0 0 0-18 0h-8z"}
        transform={withText ? undefined : "translate(-6 -6) scale(0.98)"}
        fill="none"
        stroke="#e11d2a"
        strokeWidth={withText ? 2.4 : 3.2}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        className={draw ? "[stroke-dasharray:1] [stroke-dashoffset:1] [animation:logo-draw_1.1s_var(--ease-expo)_0.15s_forwards]" : undefined}
      />
      {withText && (
        <>
          <text x="50" y="71" textAnchor="middle" fill="#e11d2a" fontFamily="Saira, sans-serif" fontStyle="italic" fontWeight="900" fontSize="17" style={{ fontVariationSettings: '"wdth" 125' }}>
            VIP
          </text>
          <text x="50" y="85" textAnchor="middle" fill="#fafafa" fontFamily="Saira, sans-serif" fontWeight="800" fontSize="11.5" style={{ fontVariationSettings: '"wdth" 125' }}>
            MOTORS
          </text>
          <path d="M28 89.5h44" stroke="#d4d4d8" strokeWidth="0.6" />
          <text x="50" y="96.5" textAnchor="middle" fill="#d4d4d8" fontFamily="Saira, sans-serif" fontWeight="500" fontSize="5" letterSpacing="0.8">
            EST. 2010
          </text>
        </>
      )}
    </svg>
  );
}

/** Wordmark as on the showroom signboard: red italic VIP, extended MOTORS. */
export function Wordmark({ className, onPhoto = false }: { className?: string; onPhoto?: boolean }) {
  return (
    <span className={cn("flex items-baseline gap-[0.28em] leading-none", className)}>
      <span className="display-italic text-[1.3em] text-accent">VIP</span>
      <span className={cn("display text-[1em] tracking-[0.04em]", onPhoto ? "text-white" : "text-fg")}>MOTORS</span>
    </span>
  );
}

export function Logo({ className, onPhoto = false }: { className?: string; onPhoto?: boolean }) {
  return (
    <Link to="/" aria-label="VIP Motors home" className={cn("group inline-flex items-center gap-2.5", className)}>
      <Badge className="h-9 w-auto shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
      <span className="flex flex-col">
        <Wordmark className="text-[15px] sm:text-[17px]" onPhoto={onPhoto} />
        <span className={cn("mt-1 text-[8.5px] font-medium uppercase tracking-[0.38em]", onPhoto ? "text-white/60" : "text-subtle")}>Est. 2010 · Bengaluru</span>
      </span>
    </Link>
  );
}
