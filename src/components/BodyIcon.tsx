import type { Category } from "@/lib/filters";
import { cn } from "@/lib/cn";

// Side-profile line drawings, one per category, drawn on a 120x48 grid with
// wheels at x=32 and x=88 so they line up when shown together.
const BODY: Record<Category, { shell: string; glass: string; extra?: string }> = {
  Sports: {
    shell: "M5 35 L7 30 L28 27 Q44 17 64 16 Q78 16 92 24 L111 28 Q116 29 116 33 V35 H98 A10 10 0 0 0 78 35 H42 A10 10 0 0 0 22 35 Z",
    glass: "M43 25 Q54 19 64 19 Q72 19 82 24 Z",
    extra: "M6 27 H15 M10 27 V30",
  },
  SUV: {
    shell: "M5 35 L6 21 Q7 14 15 13 L74 12 Q80 12 84 16 L93 24 L110 27 Q115 28 115 33 V35 H100 A10 10 0 0 0 80 35 H40 A10 10 0 0 0 20 35 Z",
    glass: "M13 23 L15 16 H42 V23 Z M46 16 H71 Q75 16 78 19 L83 23 H46 Z",
    extra: "M20 11 H66",
  },
  Sedan: {
    shell: "M5 35 L7 29 L29 27 L43 18 Q56 13 70 15 L87 26 L108 28 Q114 29 114 33 V35 H98 A10 10 0 0 0 78 35 H42 A10 10 0 0 0 22 35 Z",
    glass: "M45 26 L49 20 Q58 16 68 17 L80 26 Z",
  },
  Coupe: {
    shell: "M5 35 L9 29 L34 25 Q50 14 68 15 Q80 16 92 25 L110 28 Q115 29 115 33 V35 H98 A10 10 0 0 0 78 35 H42 A10 10 0 0 0 22 35 Z",
    glass: "M44 24 Q55 18 67 18 Q76 18 84 24 Z",
  },
  Convertible: {
    shell: "M5 35 L7 28 L40 25 H54 L60 20 L64 25 L94 26 L110 28 Q115 29 115 33 V35 H98 A10 10 0 0 0 78 35 H42 A10 10 0 0 0 22 35 Z",
    glass: "M60 20 L68 25",
    extra: "M38 25 Q40 20 46 20 Q50 20 52 25",
  },
  MPV: {
    shell: "M5 35 V18 Q5 11 13 11 H70 Q77 11 82 16 L95 25 L110 27 Q115 28 115 33 V35 H100 A10 10 0 0 0 80 35 H40 A10 10 0 0 0 20 35 Z",
    glass: "M12 22 V15 H30 V22 Z M34 15 H52 V22 H34 Z M56 15 H70 Q74 15 77 18 L82 22 H56 Z",
    extra: "M54 26 V33",
  },
};

export function BodyIcon({ category, className }: { category: Category; className?: string }) {
  const b = BODY[category];
  return (
    <svg viewBox="0 0 120 48" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={cn("h-12 w-auto", className)} aria-hidden>
      <path d={b.shell} />
      <path d={b.glass} className="opacity-70" />
      {b.extra && <path d={b.extra} />}
      {[32, 88].map((x) => (
        <g key={x}>
          <circle cx={x} cy={35} r={7.5} />
          <circle cx={x} cy={35} r={2.6} className="opacity-60" />
        </g>
      ))}
      <path d="M2 43.5 H118" className="opacity-25" />
    </svg>
  );
}
