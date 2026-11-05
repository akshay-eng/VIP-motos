import { Link } from "react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Instagram } from "../icons";
import { brands } from "@/data/inventory";
import { mapsLink, site, telHref } from "@/data/site";
import { Badge } from "../Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface pb-24 pt-16 md:pb-10">
      <div className="container-x grid gap-12 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <Badge withText className="h-28 w-auto" />
          <p className="mt-5 text-sm leading-relaxed text-muted">{site.promise} Every car is inspected, history-checked and ready to drive away, with finance, insurance and warranty arranged in-house.</p>
          <p className="eyebrow mt-6">{site.tagline}</p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <div>
            <p className="mb-4 text-sm font-medium">Buy</p>
            <ul className="grid gap-2.5 text-sm text-muted">
              {brands.slice(0, 6).map((b) => (
                <li key={b.name}>
                  <Link to={`/cars?brand=${encodeURIComponent(b.name)}`} className="hover:text-fg">
                    {b.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/cars" className="text-fg hover:text-accent-fg">
                  All stock
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-sm font-medium">VIP Motors</p>
            <ul className="grid gap-2.5 text-sm text-muted">
              <li><Link to="/sell" className="hover:text-fg">Sell or exchange</Link></li>
              <li><Link to="/services" className="hover:text-fg">Finance and insurance</Link></li>
              <li><Link to="/services#warranty" className="hover:text-fg">Extended warranty</Link></li>
              <li><Link to="/about" className="hover:text-fg">About us</Link></li>
              <li><Link to="/contact" className="hover:text-fg">Visit the showroom</Link></li>
              <li><Link to="/compare" className="hover:text-fg">Compare cars</Link></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="mb-4 text-sm font-medium">Showroom</p>
            <ul className="grid gap-3 text-sm text-muted">
              <li>
                <a href={mapsLink} target="_blank" rel="noreferrer" className="flex gap-2.5 hover:text-fg">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    {site.address.line1}
                    <br />
                    {site.address.line2}
                  </span>
                </a>
              </li>
              <li>
                <a href={telHref} className="flex gap-2.5 hover:text-fg">
                  <Phone className="mt-0.5 size-4 shrink-0" aria-hidden /> {site.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="flex gap-2.5 break-all hover:text-fg">
                  <Mail className="mt-0.5 size-4 shrink-0" aria-hidden /> {site.email}
                </a>
              </li>
              <li>
                <a href={site.instagram} target="_blank" rel="noreferrer" className="flex gap-2.5 hover:text-fg">
                  <Instagram className="mt-0.5 size-4 shrink-0" aria-hidden /> {site.instagramHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="container-x mt-14 flex flex-col gap-3 border-t border-line pt-6 text-xs text-subtle sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name}, Bengaluru · Est. {site.established} · GSTIN {site.gstin}. Demo website: stock, prices and specifications are illustrative.
        </p>
        <Link to="/credits" className="hover:text-fg">
          Photo credits
        </Link>
      </div>
    </footer>
  );
}
