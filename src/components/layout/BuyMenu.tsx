import { useState } from "react";
import { Link } from "react-router";
import { NavigationMenu } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Car, ChevronRight, Droplet, Fuel, IndianRupee, Leaf, Sparkles, Tag, Zap } from "lucide-react";
import { brands, byId, inventory, type CarWithImages } from "@/data/inventory";
import { BodyIcon } from "@/components/BodyIcon";
import { BrandLogo } from "@/components/BrandLogo";
import { CATEGORIES, FUELS, inCategory, PRICES } from "@/lib/filters";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";

type Section = "brands" | "budget" | "body" | "fuel" | "collections";

const RAIL: { key: Section; label: string; hint: string; icon: typeof Tag }[] = [
  { key: "brands", label: "Brands", hint: `${brands.length} marques`, icon: Tag },
  { key: "budget", label: "Budget", hint: "₹19 L to ₹3.65 Cr", icon: IndianRupee },
  { key: "body", label: "Body style", hint: "SUV, sedan, sports…", icon: Car },
  { key: "fuel", label: "Fuel", hint: "Petrol to electric", icon: Fuel },
  { key: "collections", label: "Collections", hint: "Hand-picked edits", icon: Sparkles },
];

const FUEL_ICON = { Petrol: Fuel, Diesel: Droplet, Hybrid: Leaf, Electric: Zap } as const;

const COLLECTIONS: { label: string; to: string; car: string; test: (c: CarWithImages) => boolean }[] = [
  { label: "Hypercars, ₹3 Cr+", to: "/cars?price=30000000-", car: "ferrari-roma-2022", test: (c) => c.price >= 3e7 },
  { label: "Just arrived", to: "/cars?status=new-arrival", car: "mercedes-eqs-580-2024", test: (c) => c.status === "new-arrival" },
  { label: "Chauffeur-driven", to: "/cars?use=chauffeur", car: "rolls-royce-ghost-2019", test: (c) => c.tags.includes("chauffeur") },
  { label: "Off-road ready", to: "/cars?use=offroad", car: "land-rover-defender-110-2023", test: (c) => c.tags.includes("offroad") },
];

const count = (test: (c: CarWithImages) => boolean) => inventory.filter(test).length;

/** The "Buy a car" menu: pick a way in on the left, see just that on the right. */
export function BuyMenuContent() {
  const [active, setActive] = useState<Section>("brands");
  return (
    <div className="grid w-[min(920px,calc(100vw-48px))] grid-cols-[230px_1fr] overflow-hidden rounded-3xl border border-line-strong bg-elevated text-fg shadow-2xl shadow-black/30">
      <nav className="flex flex-col gap-1 border-r border-line bg-surface p-3" aria-label="Browse by">
        {RAIL.map(({ key, label, hint, icon: Icon }) => {
          const on = key === active;
          return (
            <button
              key={key}
              type="button"
              onMouseEnter={() => setActive(key)}
              onFocus={() => setActive(key)}
              onClick={() => setActive(key)}
              aria-current={on}
              className={cn("relative flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors duration-150", on ? "text-fg" : "text-fg/70 hover:text-fg")}
            >
              {on && <motion.span layoutId="buy-rail" className="absolute inset-0 rounded-2xl bg-elevated shadow-sm ring-1 ring-line" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <span className={cn("relative grid size-9 place-items-center rounded-xl transition-colors duration-150", on ? "bg-accent text-on-accent" : "bg-fg/5")}>
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block truncate text-xs text-subtle">{hint}</span>
              </span>
              <ChevronRight className={cn("relative size-4 transition-opacity duration-150", on ? "opacity-60" : "opacity-0")} aria-hidden />
            </button>
          );
        })}
        <NavigationMenu.Link asChild>
          <Link to="/cars" className="mt-auto flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-semibold text-accent-fg hover:bg-accent/10">
            All {inventory.length} cars <ArrowRight className="size-4" aria-hidden />
          </Link>
        </NavigationMenu.Link>
      </nav>

      <div className="relative min-h-[380px] p-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={active} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: ease.enter } }} exit={{ opacity: 0, x: -8, transition: { duration: 0.12 } }}>
            {active === "brands" && (
              <ul className="grid grid-cols-4 gap-2">
                {brands.map((b) => (
                  <li key={b.name}>
                    <MenuLink to={`/cars?brand=${encodeURIComponent(b.name)}`} className="flex-col items-center gap-2 py-4 text-center">
                      <BrandLogo brand={b.name} className="h-8 text-fg/80 transition-colors duration-150 group-hover:text-accent-fg" />
                      <span className="w-full truncate text-[13px] font-medium">{b.name}</span>
                      <span className="text-[11px] tabular-nums text-subtle">
                        {b.count} car{b.count === 1 ? "" : "s"}
                      </span>
                    </MenuLink>
                  </li>
                ))}
              </ul>
            )}
            {active === "budget" && (
              <ul className="grid gap-2">
                {PRICES.map((p) => (
                  <li key={p.key}>
                    <MenuLink to={`/cars?price=${p.key}`} className="items-center gap-5 px-5 py-4">
                      <span className="flex items-end gap-1" aria-hidden>
                        {[1, 2, 3, 4, 5].map((t) => (
                          <span key={t} className={cn("w-2 rounded-sm", t <= p.tier ? "bg-accent" : "bg-line-strong")} style={{ height: 6 + t * 4 }} />
                        ))}
                      </span>
                      <span className="flex-1 text-[15px] font-medium">{p.label}</span>
                      <span className="text-xs tabular-nums text-subtle">{count((c) => c.price >= p.min && c.price < p.max)} cars</span>
                      <ArrowRight className="size-4 text-subtle transition-transform duration-150 group-hover:translate-x-1" aria-hidden />
                    </MenuLink>
                  </li>
                ))}
              </ul>
            )}
            {active === "body" && (
              <ul className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <MenuLink to={`/cars?body=${cat}`} className="flex-col items-center gap-2 py-5 text-center">
                      <BodyIcon category={cat} className="h-12 text-fg/75 transition-colors duration-150 group-hover:text-accent-fg" />
                      <span className="text-sm font-medium">{cat === "MPV" ? "MPV / MUV" : cat}</span>
                      <span className="text-[11px] tabular-nums text-subtle">{count((c) => inCategory(c, cat))} cars</span>
                    </MenuLink>
                  </li>
                ))}
              </ul>
            )}
            {active === "fuel" && (
              <ul className="grid grid-cols-2 gap-2">
                {FUELS.map((fuel) => {
                  const Icon = FUEL_ICON[fuel];
                  return (
                    <li key={fuel}>
                      <MenuLink to={`/cars?fuel=${fuel}`} className="items-center gap-4 p-5">
                        <span className="grid size-12 place-items-center rounded-2xl bg-fg/5 transition-colors duration-150 group-hover:bg-accent group-hover:text-on-accent">
                          <Icon className="size-6" aria-hidden />
                        </span>
                        <span className="flex-1">
                          <span className="block text-[15px] font-semibold">{fuel}</span>
                          <span className="text-xs tabular-nums text-subtle">{count((c) => c.fuel === fuel)} cars</span>
                        </span>
                      </MenuLink>
                    </li>
                  );
                })}
              </ul>
            )}
            {active === "collections" && (
              <ul className="grid grid-cols-2 gap-3">
                {COLLECTIONS.map((c) => {
                  const car = byId.get(c.car)!;
                  return (
                    <li key={c.label}>
                      <NavigationMenu.Link asChild>
                        <Link to={c.to} className="group relative block aspect-[16/9] overflow-hidden rounded-2xl bg-black text-white">
                          <img src={car.images[0]?.src.replace(/\.jpg$/, "-sm.jpg")} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-expo)]" />
                          <div className="scrim-b absolute inset-0" />
                          <span className="absolute inset-x-4 bottom-3 flex items-end justify-between">
                            <span className="text-[15px] font-semibold">{c.label}</span>
                            <span className="text-xs tabular-nums text-white/75">{count(c.test)} cars</span>
                          </span>
                        </Link>
                      </NavigationMenu.Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function MenuLink({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) {
  return (
    <NavigationMenu.Link asChild>
      <Link to={to} className={cn("group flex rounded-2xl border border-line bg-surface transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/50", className)}>
        {children}
      </Link>
    </NavigationMenu.Link>
  );
}

