import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Plus, Sparkles, X } from "lucide-react";
import { byId, carName, inventory, type CarWithImages } from "@/data/inventory";
import { emiFrom, km, ownerLabel, priceShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { COMPARE_LIMIT, useApp } from "@/state/app-state";

type Row = { label: string; value: (c: CarWithImages) => string; num?: (c: CarWithImages) => number; better?: "high" | "low" };

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "Price and history",
    rows: [
      { label: "Price", value: (c) => priceShort(c.price), num: (c) => c.price, better: "low" },
      { label: "EMI from", value: (c) => `₹${Math.round(emiFrom(c.price)).toLocaleString("en-IN")}/mo`, num: (c) => c.price, better: "low" },
      { label: "Year", value: (c) => String(c.year), num: (c) => c.year, better: "high" },
      { label: "Kilometres", value: (c) => km(c.km), num: (c) => c.km, better: "low" },
      { label: "Ownership", value: (c) => ownerLabel(c.owners), num: (c) => c.owners, better: "low" },
      { label: "Registration", value: (c) => c.regState },
    ],
  },
  {
    title: "Performance",
    rows: [
      { label: "Engine", value: (c) => c.engine },
      { label: "Power", value: (c) => `${c.powerHp} hp`, num: (c) => c.powerHp, better: "high" },
      { label: "Torque", value: (c) => `${c.torqueNm} Nm`, num: (c) => c.torqueNm, better: "high" },
      { label: "0–100 km/h", value: (c) => `${c.zeroTo100} s`, num: (c) => c.zeroTo100, better: "low" },
      { label: "Top speed", value: (c) => `${c.topSpeed} km/h`, num: (c) => c.topSpeed, better: "high" },
      { label: "Drive", value: (c) => c.drive },
    ],
  },
  {
    title: "Practicality",
    rows: [
      { label: "Body", value: (c) => c.body },
      { label: "Seats", value: (c) => String(c.seats), num: (c) => c.seats, better: "high" },
      { label: "Fuel", value: (c) => c.fuel },
      { label: "Range", value: (c) => (c.rangeKm ? `${c.rangeKm} km` : "—") },
      { label: "Colour", value: (c) => c.exterior },
    ],
  },
];

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const { compare, setCompare, openConcierge } = useApp();
  const fromUrl = (params.get("ids") ?? "").split(",").filter((id) => byId.has(id));
  const ids = fromUrl.length ? fromUrl : compare;
  const cars = ids.map((id) => byId.get(id)!).slice(0, COMPARE_LIMIT);

  // Keep the tray and the URL describing the same set.
  useEffect(() => {
    if (fromUrl.length && fromUrl.join() !== compare.join()) setCompare(fromUrl);
    // Only the URL drives this sync.
  }, [params]);

  function setIds(next: string[]) {
    setCompare(next);
    setParams(next.length ? { ids: next.join(",") } : {}, { replace: true });
  }

  const slots = Array.from({ length: COMPARE_LIMIT }, (_, i) => cars[i] ?? null);
  // Phones: label on its own line, three value columns under it.
  // Desktop: a label column beside the three cars.
  const grid = "grid grid-cols-3 gap-x-2 sm:gap-x-4 md:grid-cols-[170px_repeat(3,minmax(0,1fr))]";

  return (
    <div className="container-x pb-28 pt-24 lg:pt-28">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Compare</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl">Side by side</h1>
          <p className="mt-3 text-sm text-muted">Up to three cars. The better figure in each row is marked in red.</p>
        </div>
        {cars.length >= 2 && (
          <button type="button" onClick={() => openConcierge(`Compare the ${cars.map((c) => c.model).join(" and the ")}`)} className="btn-ghost w-full sm:w-auto">
            <Sparkles className="size-4 text-accent-fg" aria-hidden /> Ask the Co-Driver which to pick
          </button>
        )}
      </div>

      <div className="sticky top-16 z-10 -mx-4 mt-8 border-b border-line bg-bg/95 px-4 pb-3 pt-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-[76px] lg:-mx-10 lg:px-10">
        <div className={grid}>
          <div className="hidden md:block" />
          {slots.map((c, i) =>
            c ? (
              <div key={c.id} className="relative min-w-0">
                <Link to={`/cars/${c.id}`} className="block overflow-hidden rounded-xl sm:rounded-2xl">
                  <img src={c.images[0]?.src.replace(/\.jpg$/, "-sm.jpg")} alt={carName(c)} className="aspect-[4/3] w-full object-cover" />
                </Link>
                <button type="button" onClick={() => setIds(ids.filter((x) => x !== c.id))} aria-label={`Remove ${c.model}`} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/70 text-white hover:bg-black sm:right-2 sm:top-2 sm:size-8">
                  <X className="size-3.5 sm:size-4" />
                </button>
                <p className="mt-2 hidden text-xs text-subtle sm:block">{c.year}</p>
                <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-tight sm:mt-0 sm:text-base">
                  <span className="hidden sm:inline">{c.make} </span>
                  {c.model}
                </p>
                <p className="hidden truncate text-sm text-muted sm:block">{c.variant}</p>
              </div>
            ) : (
              <AddSlot key={`empty-${i}`} exclude={ids} onAdd={(id) => setIds([...ids, id])} />
            ),
          )}
        </div>
      </div>

      {cars.length > 0 &&
        GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="mt-8 border-b border-line pb-3 text-xs font-medium uppercase tracking-[0.14em] text-subtle">{g.title}</h2>
            {g.rows.map((r) => {
              const nums = r.num ? cars.map(r.num) : [];
              const best = r.better === "high" ? Math.max(...nums) : r.better === "low" ? Math.min(...nums) : undefined;
              const differs = nums.some((n) => n !== best);
              return (
                <div key={r.label} className={cn(grid, "border-b border-line py-3")}>
                  <p className="col-span-3 mb-1.5 text-xs text-subtle md:col-span-1 md:mb-0 md:text-sm md:text-muted">{r.label}</p>
                  {slots.map((c, i) => (
                    <p key={i} className={cn("min-w-0 break-words text-[13px] tabular-nums sm:text-sm", c && best !== undefined && differs && r.num!(c) === best ? "font-semibold text-accent-fg" : "text-fg/90")}>
                      {c ? r.value(c) : ""}
                    </p>
                  ))}
                </div>
              );
            })}
          </section>
        ))}

      {cars.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-line-strong p-10 text-center">
          <p className="text-muted">Add cars with the Compare button on any listing, or pick them above.</p>
          <Link to="/cars" className="btn-accent mt-6">
            Browse the stock
          </Link>
        </div>
      )}
    </div>
  );
}

function AddSlot({ exclude, onAdd }: { exclude: string[]; onAdd: (id: string) => void }) {
  return (
    <div className="relative flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong text-xs text-muted transition-colors duration-150 hover:border-accent/60 hover:text-fg sm:gap-3 sm:rounded-2xl sm:text-sm">
      <Plus className="size-4 sm:size-5" aria-hidden />
      Add a car
      {/* Covers the slot so a tap opens the native picker on phones. */}
      <select className="absolute inset-0 cursor-pointer opacity-0" value="" onChange={(e) => e.target.value && onAdd(e.target.value)} aria-label="Add a car to compare">
        <option value="">Choose a car</option>
        {inventory
          .filter((c) => !exclude.includes(c.id))
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.year} {c.make} {c.model} · {priceShort(c.price)}
            </option>
          ))}
      </select>
    </div>
  );
}
