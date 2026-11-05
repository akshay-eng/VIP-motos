import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowUpRight, Check, Heart, Scale, X } from "lucide-react";
import { byId, carTitle } from "@/data/inventory";
import type { ConciergeReply, Recommendation, ReplyAction } from "@/ai/types";
import { km, priceShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";
import { useApp } from "@/state/app-state";

export function RecCard({ rec, index, onNavigate }: { rec: Recommendation; index: number; onNavigate: () => void }) {
  const car = byId.get(rec.id);
  const { shortlist, toggleShortlist, requestCallback } = useApp();
  if (!car) return null;
  const saved = shortlist.includes(car.id);
  const cover = car.images[0]?.src.replace(/\.jpg$/, "-sm.jpg");
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: ease.enter, delay: 0.08 + index * 0.07 } }}
      className="overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <Link to={`/cars/${car.id}`} onClick={onNavigate} className="group flex gap-3 p-2.5">
        <div data-vt-img className="relative h-[84px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-surface-2">
          {cover && <img src={cover} alt={carTitle(car)} className="h-full w-full object-cover transition-transform duration-[600ms] ease-[var(--ease-premium)]" />}
          {index === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-on-accent">Top match</span>}
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <p className="truncate text-[15px] font-semibold leading-tight">
            {car.make} {car.model}
          </p>
          <p className="truncate text-xs text-muted">{car.variant}</p>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span className="display text-base tabular-nums">{priceShort(car.price)}</span>
            <span className="text-[11px] tabular-nums text-subtle">
              {car.year} · {km(car.km)}
            </span>
          </p>
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-subtle transition-colors duration-150 group-hover:text-accent-fg" aria-hidden />
      </Link>
      {rec.reasons.length > 0 && (
        <ul className="grid gap-1.5 border-t border-line px-3.5 py-3">
          {rec.reasons.map((r) => (
            <li key={r} className="flex gap-2 text-[13px] leading-snug text-fg/85">
              <Check className="mt-0.5 size-3.5 shrink-0 text-accent-fg" aria-hidden />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex border-t border-line">
        <button
          type="button"
          onClick={() => toggleShortlist(car.id)}
          aria-pressed={saved}
          className="flex h-10 flex-1 items-center justify-center gap-1.5 text-xs font-medium text-fg/85 transition-colors duration-150 hover:bg-white/5"
        >
          <Heart className={cn("size-3.5", saved && "fill-accent text-accent-fg")} aria-hidden /> {saved ? "Saved" : "Save"}
        </button>
        <span className="w-px bg-line" />
        <button
          type="button"
          onClick={() => requestCallback({ carId: car.id, intent: "test-drive" })}
          className="flex h-10 flex-1 items-center justify-center text-xs font-medium text-fg/85 transition-colors duration-150 hover:bg-white/5"
        >
          Book test drive
        </button>
      </div>
    </motion.li>
  );
}

export function UnderstoodChips({ reply, onRemove }: { reply: ConciergeReply; onRemove?: (key: string) => void }) {
  if (!reply.understood.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-subtle">Matching on</span>
      {reply.understood.map((u) => (
        <span key={u.key} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.06] pl-2.5 pr-1 text-xs text-fg/90">
          {u.label}
          {onRemove && (
            <button type="button" aria-label={`Remove ${u.label}`} onClick={() => onRemove(u.key)} className="grid size-5 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-white/10 hover:text-fg">
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

export function CompareTable({ ids }: { ids: string[] }) {
  const cars = ids.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => !!c);
  const rows: { label: string; value: (c: (typeof cars)[number]) => string; best?: (vals: number[]) => number; num?: (c: (typeof cars)[number]) => number }[] = [
    { label: "Price", value: (c) => priceShort(c.price), num: (c) => c.price, best: (v) => Math.min(...v) },
    { label: "Year", value: (c) => String(c.year), num: (c) => c.year, best: (v) => Math.max(...v) },
    { label: "Driven", value: (c) => km(c.km), num: (c) => c.km, best: (v) => Math.min(...v) },
    { label: "Power", value: (c) => `${c.powerHp} hp`, num: (c) => c.powerHp, best: (v) => Math.max(...v) },
    { label: "0–100", value: (c) => `${c.zeroTo100}s`, num: (c) => c.zeroTo100, best: (v) => Math.min(...v) },
    { label: "Seats", value: (c) => String(c.seats), num: (c) => c.seats, best: (v) => Math.max(...v) },
    { label: "Fuel", value: (c) => c.fuel },
    { label: "Drive", value: (c) => c.drive },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <table className="w-full table-fixed text-left text-xs">
        <thead className="bg-white/[0.04]">
          <tr>
            <th className="w-[64px] px-3 py-2.5 font-normal text-subtle" scope="col">
              <span className="sr-only">Spec</span>
            </th>
            {cars.map((c) => (
              <th key={c.id} scope="col" className="truncate px-2 py-2.5 font-semibold">
                {c.model}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const vals = r.num ? cars.map(r.num) : [];
            const best = r.best ? r.best(vals) : undefined;
            return (
              <tr key={r.label} className="border-t border-line">
                <th scope="row" className="px-3 py-2 font-normal text-subtle">
                  {r.label}
                </th>
                {cars.map((c, i) => (
                  <td key={c.id} className={cn("truncate px-2 py-2 tabular-nums", best !== undefined && vals[i] === best && vals.some((v) => v !== best) ? "text-accent-fg" : "text-fg/90")}>
                    {r.value(c)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function EmiTable({ emi }: { emi: NonNullable<ConciergeReply["emi"]> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="flex justify-between bg-white/[0.04] px-3.5 py-2.5 text-xs text-subtle">
        <span>{emi.downPct}% down · {emi.rate}% p.a.</span>
        <span>Monthly EMI</span>
      </div>
      {emi.rows.map((r) => (
        <div key={r.months} className="flex justify-between border-t border-line px-3.5 py-2.5 text-sm">
          <span className="text-muted">{r.months / 12} years</span>
          <span className="tabular-nums">₹{Math.round(r.emi).toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  );
}

export function ActionButtons({ actions, onNavigate }: { actions: ReplyAction[]; onNavigate: () => void }) {
  const { requestCallback, setCompare } = useApp();
  if (!actions.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a, i) => {
        if (a.type === "link")
          return (
            <Link key={i} to={a.to} onClick={onNavigate} className="btn-ghost h-9 px-4 text-[13px]">
              {a.label} <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          );
        if (a.type === "external")
          return (
            <a key={i} href={a.href} target="_blank" rel="noreferrer" className="btn-ghost h-9 px-4 text-[13px]">
              {a.label} <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          );
        if (a.type === "compare")
          return (
            <Link key={i} to={`/compare?ids=${a.ids.join(",")}`} onClick={() => { setCompare(a.ids); onNavigate(); }} className="btn-ghost h-9 px-4 text-[13px]">
              <Scale className="size-3.5" aria-hidden /> Open full comparison
            </Link>
          );
        return (
          <button key={i} type="button" onClick={() => requestCallback({ carId: a.carId, intent: a.intent })} className="btn-accent h-9 px-4 text-[13px]">
            {a.intent === "test-drive" ? "Book a test drive" : "Request a call back"}
          </button>
        );
      })}
    </div>
  );
}
