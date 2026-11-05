import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import { byId, carTitle } from "@/data/inventory";
import { site, telHref } from "@/data/site";
import { ease, dur } from "@/lib/motion";
import { useApp } from "@/state/app-state";

const COPY = {
  callback: { title: "Request a call back", cta: "Call me back", done: "We'll call you shortly." },
  "test-drive": { title: "Book a test drive", cta: "Book my test drive", done: "Your test drive request is in." },
  reserve: { title: "Reserve this car", cta: "Request reservation", done: "We'll confirm the reservation by phone." },
};

const SLOTS = ["Today, evening", "Tomorrow, morning", "Tomorrow, evening", "This weekend"];

export function CallbackDialog() {
  const { callback, closeCallback } = useApp();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [atHome, setAtHome] = useState(false);
  const car = callback?.carId ? byId.get(callback.carId) : undefined;
  const intent = callback?.intent ?? "callback";
  const copy = COPY[intent];

  useEffect(() => {
    if (callback) {
      setSent(false);
      setError(null);
      setAtHome(false);
    }
  }, [callback]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const phone = String(data.get("phone") ?? "").replace(/\D/g, "");
    if (phone.length < 10) {
      setError("Enter a 10-digit mobile number so we can reach you.");
      return;
    }
    // Front-end demo: this is where the lead would be posted to a CRM.
    setError(null);
    setSent(true);
  }

  return (
    <Dialog.Root open={!!callback} onOpenChange={(o) => !o && closeCallback()}>
      <AnimatePresence>
        {callback && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: dur.standard, ease: ease.standard } }}
                exit={{ opacity: 0, transition: { duration: 0.25, ease: ease.exit } }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-3xl border border-line-strong bg-surface-2 p-6 shadow-2xl sm:inset-x-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 mb-[env(safe-area-inset-bottom)]"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0, transition: { duration: dur.standard, ease: ease.enter } }}
                exit={{ opacity: 0, y: 16, transition: { duration: 0.25, ease: ease.exit } }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="display text-2xl">{copy.title}</Dialog.Title>
                    <Dialog.Description className="mt-1.5 text-sm text-muted">
                      {car ? carTitle(car) : `Talk to the ${site.name} team`}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close aria-label="Close" className="grid size-9 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-white/5 hover:text-fg">
                    <X className="size-4" />
                  </Dialog.Close>
                </div>

                {sent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1, transition: { duration: dur.standard, ease: ease.enter } }} className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
                    <span className="grid size-14 place-items-center rounded-full bg-accent text-on-accent">
                      <Check className="size-6" />
                    </span>
                    <p className="text-lg font-medium">{copy.done}</p>
                    <p className="text-sm text-muted">
                      In a hurry? Call <a className="text-fg underline decoration-accent/60 underline-offset-4" href={telHref}>{site.phone}</a>.
                    </p>
                    <Dialog.Close className="btn-ghost mt-2">Done</Dialog.Close>
                  </motion.div>
                ) : (
                  <form onSubmit={submit} className="mt-6 grid gap-4" noValidate>
                    <div>
                      <label className="label" htmlFor="cb-name">Your name</label>
                      <input id="cb-name" name="name" className="field" autoComplete="name" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="cb-phone">Mobile number</label>
                      <div className="flex gap-2">
                        <span className="field flex w-16 shrink-0 items-center justify-center text-muted">+91</span>
                        <input id="cb-phone" name="phone" className="field tabular-nums" inputMode="tel" autoComplete="tel-national" placeholder="98xxx xxxxx" aria-invalid={!!error} aria-describedby={error ? "cb-error" : undefined} />
                      </div>
                      {error && (
                        <p id="cb-error" role="alert" className="mt-1.5 text-xs text-warn">
                          {error}
                        </p>
                      )}
                    </div>
                    {intent !== "callback" && (
                      <>
                        <fieldset>
                          <legend className="label">Preferred time</legend>
                          <div className="flex flex-wrap gap-2">
                            {SLOTS.map((s, i) => (
                              <label key={s} className="chip cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:checked]:text-fg">
                                <input type="radio" name="slot" value={s} defaultChecked={i === 1} className="sr-only" />
                                {s}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <label className="flex cursor-pointer items-center gap-3 text-sm text-fg/90">
                          <input type="checkbox" checked={atHome} onChange={(e) => setAtHome(e.target.checked)} className="size-4 accent-[var(--color-accent)]" />
                          Bring the car to my home or office in Bengaluru
                        </label>
                      </>
                    )}
                    <button type="submit" className="btn-accent mt-1 w-full">
                      {copy.cta}
                    </button>
                    <p className="text-center text-xs text-subtle">We'll only use your number to talk about this enquiry.</p>
                  </form>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
