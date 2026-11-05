import { Link } from "react-router";
import { ArrowRight, BadgePercent, CarFront, RefreshCcw, ShieldCheck, Sparkle, Umbrella } from "lucide-react";
import { byId } from "@/data/inventory";
import { EmiCalculator } from "@/components/EmiCalculator";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { useApp } from "@/state/app-state";

const SERVICES = [
  { id: "finance", icon: BadgePercent, title: "Car loans", body: "Pre-owned luxury car finance through partner banks, with the paperwork handled at our desk. Bring your KYC; we do the rest.", cta: "Check my eligibility" },
  { id: "insurance", icon: Umbrella, title: "Insurance", body: "Transfer the existing policy to your name or renew with a comprehensive cover, including zero depreciation and engine protection where available.", cta: "Get an insurance quote" },
  { id: "warranty", icon: ShieldCheck, title: "Extended warranty", body: "Cover for engine, gearbox and major electricals on eligible cars, with the term set by age and kilometres.", cta: "Ask about warranty" },
  { id: "exchange", icon: RefreshCcw, title: "Exchange", body: "Trade in your current car against one of ours. We value it at your door and adjust the price on the spot.", cta: "Value my car", to: "/sell" },
  { id: "test-drive", icon: CarFront, title: "Doorstep test drives", body: "Anywhere in Bengaluru. Choose the car and a slot; we bring it to your home or office.", cta: "Book a test drive" },
  { id: "care", icon: Sparkle, title: "Detailing and protection", body: "Ceramic coating, paint protection film and interior detailing before delivery, arranged with our partner studio.", cta: "Ask about detailing" },
];

export default function Services() {
  const { requestCallback } = useApp();
  const example = byId.get("audi-q7-55-tfsi-2022")!;
  return (
    <div className="pb-24 pt-24 lg:pt-28">
      <section className="container-x">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">Services</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl lg:text-6xl">Everything after you pick the car.</h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">Finance, insurance, warranty and exchange, arranged at one desk in the showroom, so the day you choose a car is the day you drive it home.</p>
        </Reveal>
        <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ id, icon: Icon, title, body, cta, to }) => (
            <RevealItem key={id} id={id} className="flex scroll-mt-28 flex-col rounded-3xl border border-line bg-surface p-7">
              <Icon className="size-7 text-accent-fg" aria-hidden />
              <h2 className="mt-8 text-xl font-semibold">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{body}</p>
              {to ? (
                <Link to={to} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent-fg hover:text-accent-strong">
                  {cta} <ArrowRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <button type="button" onClick={() => requestCallback({ intent: id === "test-drive" ? "test-drive" : "callback" })} className="mt-6 inline-flex items-center gap-2 self-start text-sm font-medium text-accent-fg hover:text-accent-strong">
                  {cta} <ArrowRight className="size-4" aria-hidden />
                </button>
              )}
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="container-x mt-24">
        <Reveal>
          <p className="eyebrow">Plan the finance</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">What would the EMI be?</h2>
          <p className="mt-3 text-sm text-muted">
            Worked out on a {example.year} {example.make} {example.model} at its asking price. Every car page has its own calculator.
          </p>
        </Reveal>
        <div className="mt-8">
          <EmiCalculator price={example.price} carId={example.id} />
        </div>
      </section>
    </div>
  );
}
