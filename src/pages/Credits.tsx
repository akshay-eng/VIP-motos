import { inventory, carTitle } from "@/data/inventory";
import manifest from "@/data/image-manifest.json";

export default function Credits() {
  const misc = Object.values((manifest as { misc: Record<string, { src: string; title: string; credit: string; license: string; source: string }[]> }).misc).flat();
  return (
    <div className="container-x pb-24 pt-28">
      <p className="eyebrow">Photo credits</p>
      <h1 className="display mt-3 text-4xl">Photography</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
        Car photographs on this demo come from Wikimedia Commons under Creative Commons licences. They show the same model as each listing, not the exact car in stock. Each photo is credited below with its author and licence.
      </p>
      <div className="mt-12 grid gap-10">
        {inventory.map((car) => (
          <section key={car.id}>
            <h2 className="text-base font-semibold">{carTitle(car)}</h2>
            <ul className="mt-3 grid gap-1.5 text-[13px] text-muted">
              {car.images.map((img) => (
                <li key={img.src}>
                  <a href={img.source} target="_blank" rel="noreferrer" className="text-fg/85 underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                    {img.title}
                  </a>{" "}
                  · {img.credit} · {img.license}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {misc.length > 0 && (
          <section>
            <h2 className="text-base font-semibold">Other photography</h2>
            <ul className="mt-3 grid gap-1.5 text-[13px] text-muted">
              {misc.map((img) => (
                <li key={img.src}>
                  <a href={img.source} target="_blank" rel="noreferrer" className="text-fg/85 underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                    {img.title}
                  </a>{" "}
                  · {img.credit} · {img.license}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
