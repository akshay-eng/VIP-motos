import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Banknote, Check, ClipboardCheck, FileText, Home as HomeIcon } from "lucide-react";
import { brands, byId } from "@/data/inventory";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { site, telHref } from "@/data/site";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";

const STEPS = ["Your car", "Condition", "Contact"];
const YEARS = Array.from({ length: 14 }, (_, i) => 2026 - i);
const BRAND_OPTIONS = [...new Set([...brands.map((b) => b.name), "Mercedes-AMG", "Maserati", "Lexus", "Other"])];

const HOW = [
  { icon: FileText, title: "Share the details", body: "Make, model, year, kilometres and a few photos if you have them. Takes about two minutes." },
  { icon: HomeIcon, title: "Doorstep inspection", body: "We come to your home or office anywhere in Bengaluru. About 45 minutes, no obligation." },
  { icon: ClipboardCheck, title: "A firm offer", body: "A written offer after the inspection, based on the car's condition and current demand." },
  { icon: Banknote, title: "Paid at handover", body: "Payment by bank transfer when you hand over the keys. We handle the RC transfer and any loan closure." },
];

type Form = Record<string, string>;

export default function Sell() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<Form>({ owners: "1", exchange: "no" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate(s: number) {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.brand) e.brand = "Choose the make.";
      if (!form.model?.trim()) e.model = "Tell us the model, e.g. GLE 300d.";
      if (!form.year) e.year = "Choose the year.";
    }
    if (s === 1) {
      if (!form.km || Number(form.km.replace(/\D/g, "")) <= 0) e.km = "Roughly how many kilometres?";
    }
    if (s === 2) {
      if (!form.name?.trim()) e.name = "Your name, please.";
      if ((form.phone ?? "").replace(/\D/g, "").length < 10) e.phone = "Enter a 10-digit mobile number.";
    }
    setErrors(e);
    return !Object.keys(e).length;
  }

  function next() {
    if (!validate(step)) return;
    if (step === STEPS.length - 1) {
      setDone(true);
      return;
    }
    setDir(1);
    setStep((s) => s + 1);
  }

  const exampleCar = byId.get("bmw-x5-40i-2022");

  return (
    <div className="pb-24 pt-24 lg:pt-28">
      <section className="container-x grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <Reveal className="lg:pt-6">
          <p className="eyebrow">Sell or exchange</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl lg:text-6xl">Sell your luxury car without the runaround.</h1>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-muted">
            One inspection at your door, one written offer, payment at handover. Or put the value towards any car on our floor and drive home in it the same day.
          </p>
          <ul className="mt-8 grid gap-3 text-sm">
            {["No listing, no strangers visiting your home", "Outstanding loan? We close it with your bank", "RC transfer and insurance paperwork handled"].map((t) => (
              <li key={t} className="flex gap-3 text-fg/85">
                <Check className="mt-0.5 size-4 shrink-0 text-accent-fg" aria-hidden /> {t}
              </li>
            ))}
          </ul>
          {exampleCar && (
            <div className="mt-10 hidden overflow-hidden rounded-3xl lg:block">
              <img src={exampleCar.images[0].src} alt="" className="aspect-[16/9] w-full object-cover" />
            </div>
          )}
        </Reveal>

        <div className="rounded-[28px] border border-line-strong bg-surface p-5 sm:p-8">
          {done ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: ease.enter } }} className="flex min-h-[460px] flex-col items-center justify-center text-center">
              <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1, transition: { duration: 0.45, ease: ease.enter, delay: 0.1 } }} className="grid size-16 place-items-center rounded-full bg-accent text-on-accent">
                <Check className="size-7" />
              </motion.span>
              <h2 className="display mt-6 text-3xl">Thanks, {form.name?.split(" ")[0]}.</h2>
              <p className="mt-3 max-w-sm text-muted">
                We'll call {form.phone} to set up the inspection for your {form.year} {form.brand} {form.model}.
              </p>
              <p className="mt-6 text-sm text-subtle">
                Prefer to talk now? <a href={telHref} className="text-fg underline decoration-accent/60 underline-offset-4">{site.phone}</a>
              </p>
            </motion.div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Step {step + 1} of {STEPS.length}: <span className="text-muted">{STEPS[step]}</span>
                </p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-1.5" aria-hidden>
                {STEPS.map((s, i) => (
                  <div key={s} className="h-1 overflow-hidden rounded-full bg-white/10">
                    <motion.div className="h-full origin-left rounded-full bg-accent" initial={false} animate={{ scaleX: i <= step ? 1 : 0, transition: { duration: 0.45, ease: ease.standard } }} />
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  next();
                }}
                noValidate
                className="mt-8"
              >
                <div className="relative min-h-[340px] overflow-hidden">
                  <AnimatePresence mode="wait" custom={dir} initial={false}>
                    <motion.div
                      key={step}
                      custom={dir}
                      initial={{ opacity: 0, x: dir * 24 }}
                      animate={{ opacity: 1, x: 0, transition: { duration: 0.38, ease: ease.enter } }}
                      exit={{ opacity: 0, x: dir * -16, transition: { duration: 0.2, ease: ease.exit } }}
                      className="grid gap-5"
                    >
                      {step === 0 && (
                        <>
                          <Field label="Make" error={errors.brand}>
                            <select className="field" value={form.brand ?? ""} onChange={set("brand")} aria-invalid={!!errors.brand}>
                              <option value="">Choose a make</option>
                              {BRAND_OPTIONS.map((b) => (
                                <option key={b}>{b}</option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Model and variant" error={errors.model}>
                            <input className="field" value={form.model ?? ""} onChange={set("model")} placeholder="e.g. X5 xDrive40i M Sport" aria-invalid={!!errors.model} />
                          </Field>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Year" error={errors.year}>
                              <select className="field" value={form.year ?? ""} onChange={set("year")} aria-invalid={!!errors.year}>
                                <option value="">Year</option>
                                {YEARS.map((y) => (
                                  <option key={y}>{y}</option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Registration">
                              <input className="field uppercase" value={form.reg ?? ""} onChange={set("reg")} placeholder="KA-03" />
                            </Field>
                          </div>
                        </>
                      )}
                      {step === 1 && (
                        <>
                          <Field label="Kilometres driven" error={errors.km}>
                            <input className="field tabular-nums" inputMode="numeric" value={form.km ?? ""} onChange={set("km")} placeholder="e.g. 32,000" aria-invalid={!!errors.km} />
                          </Field>
                          <fieldset>
                            <legend className="label">Owners so far</legend>
                            <div className="flex gap-2">
                              {["1", "2", "3+"].map((o) => (
                                <label key={o} className={cn("chip flex-1 cursor-pointer justify-center", form.owners === o && "border-accent bg-accent/10")}>
                                  <input type="radio" name="owners" value={o} checked={form.owners === o} onChange={set("owners")} className="sr-only" />
                                  {o}
                                </label>
                              ))}
                            </div>
                          </fieldset>
                          <fieldset>
                            <legend className="label">Interested in exchanging for one of our cars?</legend>
                            <div className="flex gap-2">
                              {[
                                ["no", "Just selling"],
                                ["yes", "Yes, exchange"],
                              ].map(([v, l]) => (
                                <label key={v} className={cn("chip flex-1 cursor-pointer justify-center", form.exchange === v && "border-accent bg-accent/10")}>
                                  <input type="radio" name="exchange" value={v} checked={form.exchange === v} onChange={set("exchange")} className="sr-only" />
                                  {l}
                                </label>
                              ))}
                            </div>
                          </fieldset>
                          <Field label="Anything we should know? (optional)">
                            <textarea className="field h-24 py-3" value={form.notes ?? ""} onChange={set("notes")} placeholder="Service history, accidents, modifications, extended warranty…" />
                          </Field>
                        </>
                      )}
                      {step === 2 && (
                        <>
                          <Field label="Your name" error={errors.name}>
                            <input className="field" autoComplete="name" value={form.name ?? ""} onChange={set("name")} aria-invalid={!!errors.name} />
                          </Field>
                          <Field label="Mobile number" error={errors.phone}>
                            <input className="field tabular-nums" inputMode="tel" autoComplete="tel-national" value={form.phone ?? ""} onChange={set("phone")} placeholder="98xxx xxxxx" aria-invalid={!!errors.phone} />
                          </Field>
                          <Field label="Area in Bengaluru (for the inspection)">
                            <input className="field" value={form.area ?? ""} onChange={set("area")} placeholder="e.g. Malleshwaram" />
                          </Field>
                          <p className="text-xs text-subtle">We'll only call about this car. No spam, no sharing your number.</p>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="mt-6 flex gap-3">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDir(-1);
                        setStep((s) => s - 1);
                      }}
                      className="btn-ghost"
                    >
                      <ArrowLeft className="size-4" aria-hidden /> Back
                    </button>
                  )}
                  <button type="submit" className="btn-accent flex-1">
                    {step === STEPS.length - 1 ? "Request my offer" : "Continue"} <ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>

      <section id="how" className="container-x mt-24 scroll-mt-24 lg:mt-32">
        <Reveal>
          <p className="eyebrow">How it works</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">Four steps from first call to payment.</h2>
        </Reveal>
        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW.map(({ icon: Icon, title, body }, i) => (
            <RevealItem key={title} className="rounded-3xl border border-line bg-surface p-6">
              <div className="flex items-center justify-between">
                <Icon className="size-6 text-accent-fg" aria-hidden />
                <span className="display text-sm text-subtle">0{i + 1}</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-warn">
          {error}
        </span>
      )}
    </label>
  );
}
