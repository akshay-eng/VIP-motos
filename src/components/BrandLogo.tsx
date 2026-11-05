import { SIMPLE_ICON_PATHS } from "@/data/brand-logos";
import { cn } from "@/lib/cn";

// Simple Icons has no Mercedes-Benz, Land Rover, Lexus or Jaguar marks, so
// these are simplified stand-ins. Swap in official artwork for production.
function Custom({ brand }: { brand: string }) {
  switch (brand) {
    case "Mercedes-Benz":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10.9" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M12 1.9 13.15 11 20.6 16.9 12 13.3 3.4 16.9 10.85 11Z" fill="currentColor" />
        </svg>
      );
    case "Lexus":
      return (
        <svg viewBox="0 0 30 20" aria-hidden>
          <ellipse cx="15" cy="10" rx="13.8" ry="8.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M17.6 4.2 11.2 14.6h9.6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        </svg>
      );
    case "Land Rover":
      return (
        <svg viewBox="0 0 44 22" aria-hidden>
          <ellipse cx="22" cy="11" rx="20.8" ry="9.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <text x="22" y="13.4" textAnchor="middle" fontSize="5.6" fontWeight="800" letterSpacing="0.2" fill="currentColor" fontFamily="Saira, sans-serif">
            LAND ROVER
          </text>
        </svg>
      );
    case "Jaguar":
      return (
        <svg viewBox="0 0 56 14" aria-hidden>
          <text x="28" y="11" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="2.4" fill="currentColor" fontFamily="Saira, sans-serif" fontStyle="italic">
            JAGUAR
          </text>
        </svg>
      );
    default:
      return null;
  }
}

/** A brand's mark in currentColor; falls back to a monogram. */
export function BrandLogo({ brand, className, title }: { brand: string; className?: string; title?: string }) {
  const key = brand.startsWith("Mercedes") ? "Mercedes-Benz" : brand;
  const path = SIMPLE_ICON_PATHS[key];
  const custom = !path ? Custom({ brand: key }) : null;
  return (
    <span role="img" aria-label={title ?? key} className={cn("inline-flex max-w-full shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-w-full", className)}>
      {path ? (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d={path} fill="currentColor" />
        </svg>
      ) : custom ? (
        custom
      ) : (
        <span className="display text-[0.7em]">{key.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}
