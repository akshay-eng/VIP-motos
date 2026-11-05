import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { inventory, brands } from "@/data/inventory";
import { site } from "@/data/site";
import { asset } from "@/lib/asset";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";

const VALUES = [
  { word: "Luxury", body: "We only stock cars we'd be proud to drive ourselves. If a car fails the inspection, it doesn't reach the floor." },
  { word: "Experience", body: "Coffee, a quiet showroom and no pressure. Test drives at your door, and the paperwork done for you." },
  { word: "Exclusivity", body: "A small, curated floor rather than a lot of hundreds. Rare specs and the colours people wait months for." },
];

export default function About() {
    return (
    <div className="pb-24">
      <section className="relative isolate flex min-h-[70dvh] items-end overflow-hidden bg-black pb-14 pt-32 text-white">
        <img src={asset("showroom/storefront.jpg")} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-bg/45" />
        <div className="scrim-b absolute inset-0 -z-10" />
        <div className="container-x">
          <Reveal className="max-w-3xl">
            <p className="eyebrow">About {site.name}</p>
            <h1 className="display mt-3 text-4xl sm:text-5xl lg:text-6xl">{site.promise}</h1>
          </Reveal>
        </div>
      </section>

      <section className="container-x grid gap-12 py-20 lg:grid-cols-[1fr_1.3fr] lg:gap-20 lg:py-28">
        <Reveal>
          <p className="eyebrow">Who we are</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">A showroom in Rajajinagar, for people who care about cars.</h2>
        </Reveal>
        <Reveal className="grid gap-5 text-[16px] leading-relaxed text-fg/80">
          <p>Since {site.established}, VIP Motors has been a pre-owned luxury car showroom on Magadi Main Road in Rajajinagar, Bengaluru. We buy, inspect and sell cars from the marques people dream about, and we arrange the loan, the insurance and the warranty under the same roof.</p>
          <p>Every car on our floor is hand-picked. We check its history, inspect it end to end, and price it fairly for what it is. When you buy from us, you get the confidence of buying new with the value of buying pre-owned.</p>
          <p>Follow the new arrivals and deliveries on Instagram at <a href={site.instagram} target="_blank" rel="noreferrer" className="text-accent-fg hover:text-accent-strong">{site.instagramHandle}</a>.</p>
        </Reveal>
      </section>

      <section className="border-y border-line bg-surface py-20 lg:py-28">
        <div className="container-x">
          <RevealGroup className="grid gap-4 lg:grid-cols-3">
            {VALUES.map((v) => (
              <RevealItem key={v.word} className="rounded-3xl border border-line bg-bg p-8">
                <p className="display text-3xl text-accent-fg">{v.word}</p>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">{v.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
          <dl className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              [String(inventory.length), "cars on the floor"],
              [String(brands.length), "marques in stock"],
              [site.instagramFollowers, "followers on Instagram"],
              [String(new Date().getFullYear() - site.established), "years in Bengaluru"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="display text-5xl tabular-nums">{n}</dd>
                <p className="mt-2 text-sm text-muted">{l}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-x flex flex-col items-start justify-between gap-6 py-20 sm:flex-row sm:items-center">
        <h2 className="display max-w-xl text-3xl">See the collection, or come and see it in person.</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/cars" className="btn-accent">
            Browse the stock <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link to="/contact" className="btn-ghost">
            Plan a visit
          </Link>
        </div>
      </section>
    </div>
  );
}
