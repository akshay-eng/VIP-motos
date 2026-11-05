import { useState } from "react";
import { Slider } from "radix-ui";
import { emi, LOAN_DEFAULTS, priceShort } from "@/lib/format";
import { useApp } from "@/state/app-state";

export function EmiCalculator({ price, carId }: { price: number; carId?: string }) {
  const [down, setDown] = useState(LOAN_DEFAULTS.downPct);
  const [months, setMonths] = useState(LOAN_DEFAULTS.months);
  const [rate, setRate] = useState(LOAN_DEFAULTS.rate);
  const { requestCallback } = useApp();
  const principal = price * (1 - down / 100);
  const monthly = emi(principal, rate, months);
  const interest = monthly * months - principal;

  return (
    <div className="grid gap-8 rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid gap-7">
        <Range label="Down payment" value={down} min={10} max={90} step={5} onChange={setDown} display={`${down}% · ${priceShort(price * (down / 100))}`} />
        <Range label="Tenure" value={months} min={12} max={84} step={12} onChange={setMonths} display={`${months / 12} years`} />
        <Range label="Interest rate" value={rate} min={7.5} max={14} step={0.25} onChange={setRate} display={`${rate.toFixed(2)}% p.a.`} />
      </div>
      <div className="flex flex-col justify-between gap-6 rounded-2xl bg-bg p-6">
        <div>
          <p className="text-sm text-muted">Monthly EMI</p>
          <p className="display mt-2 text-4xl tabular-nums" aria-live="polite">
            ₹{Math.round(monthly).toLocaleString("en-IN")}
          </p>
          <dl className="mt-5 grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Loan amount</dt>
              <dd className="tabular-nums">{priceShort(principal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Total interest</dt>
              <dd className="tabular-nums">{priceShort(interest)}</dd>
            </div>
          </dl>
        </div>
        <div>
          <button type="button" onClick={() => requestCallback({ carId, intent: "callback" })} className="btn-accent w-full">
            Talk to the finance desk
          </button>
          <p className="mt-3 text-center text-xs text-subtle">Indicative only. Partner banks confirm the final rate.</p>
        </div>
      </div>
    </div>
  );
}

function Range({ label, value, min, max, step, onChange, display }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm font-medium tabular-nums">{display}</span>
      </div>
      <Slider.Root value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} className="relative flex h-6 touch-none select-none items-center" aria-label={label}>
        <Slider.Track className="relative h-1 flex-1 rounded-full bg-white/10">
          <Slider.Range className="absolute h-full rounded-full bg-accent" />
        </Slider.Track>
        <Slider.Thumb className="block size-5 rounded-full border-2 border-accent bg-bg shadow transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30" />
      </Slider.Root>
    </div>
  );
}
