import { useRef } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Fuel, Gauge, Heart, MapPin, MessageCircle, PhoneCall, Scale } from "lucide-react";
import { carTitle, type CarWithImages } from "@/data/inventory";
import { whatsappHref } from "@/data/site";
import { BrandLogo } from "@/components/BrandLogo";
import { ImageCarousel } from "@/components/ImageCarousel";
import { StatusBadge } from "@/components/StatusBadge";
import { useTransitionNavigate } from "@/components/ViewTransitions";
import { km, priceFull, priceShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";
import { useApp } from "@/state/app-state";

const round = "grid place-items-center rounded-full text-white backdrop-blur transition-[transform,background-color] duration-200 hover:scale-110 active:scale-90";

/**
 * A stock card in the style of the collection grid: registration, name and
 * price up top, a big swipeable photo with call and WhatsApp on it, then the
 * three numbers people scan for. `compact` is the two-up phone layout.
 */
export function ListingCard({ car, compact = false, index = 0 }: { car: CarWithImages; compact?: boolean; index?: number }) {
  const { shortlist, toggleShortlist, compare, toggleCompare, requestCallback } = useApp();
  const go = useTransitionNavigate();
  const photo = useRef<HTMLDivElement>(null);
  const saved = shortlist.includes(car.id);
  const comparing = compare.includes(car.id);
  const title = carTitle(car);
  const href = `/cars/${car.id}`;

  return (
    <motion.article
      data-vt-card
      initial={{ opacity: 0, y: 60, rotate: index % 2 ? 1.5 : -1.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "0px 0px -6% 0px" }}
      transition={{ duration: 0.8, ease: ease.enter }}
      className="group relative overflow-hidden rounded-[24px] border border-line bg-surface transition-[border-color] duration-300 hover:border-accent/40"
    >
      <Link to={href} className={cn("flex items-start justify-between gap-3", compact ? "px-3 pb-2.5 pt-3" : "px-5 pb-4 pt-5")}>
        <div className="min-w-0">
          <span className={cn("inline-flex items-center rounded-md bg-fg font-semibold tabular-nums text-bg", compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[11px]")}>Reg. {car.year}</span>
          <h3 className={cn("mt-2 font-semibold leading-tight tracking-tight", compact ? "line-clamp-2 text-[13px]" : "truncate text-xl")}>
            {car.make} {car.model}
            {!compact && <span className="font-normal text-muted"> {car.variant}</span>}
          </h3>
          <p className={cn("display mt-1.5 tabular-nums", compact ? "text-base" : "text-[26px]")} title={priceFull(car.price)}>
            {compact ? priceShort(car.price) : priceFull(car.price)}
          </p>
        </div>
        {!compact && <BrandLogo brand={car.make} className="mt-1 h-8 text-fg/25 transition-colors duration-500 group-hover:text-accent-fg" />}
      </Link>

      <div className={cn("relative overflow-hidden bg-surface-2", compact ? "aspect-square" : "aspect-[8/7]")}>
        <div ref={photo} data-vt-img className="h-full">
          <ImageCarousel images={car.images} alt={title} className="h-full"  onOpen={() => go(href, photo.current)} counter="left" />
        </div>
        <div className="pointer-events-none absolute left-3 top-3">
          <StatusBadge status={car.status} className={compact ? "px-2 py-0.5 text-[9px]" : undefined} />
        </div>
        <div className={cn("absolute flex gap-2", compact ? "right-2 top-2" : "right-3 top-3")}>
          <button type="button" onClick={() => toggleShortlist(car.id)} aria-label={saved ? `Remove ${car.model} from shortlist` : `Save ${car.model} to shortlist`} aria-pressed={saved} className={cn(round, "bg-black/55 hover:bg-black/75", compact ? "size-8" : "size-10")}>
            <Heart className={cn(compact ? "size-3.5" : "size-[18px]", saved && "fill-[#e11d2a] text-[#ff4655]")} />
          </button>
          {!compact && (
            <button type="button" onClick={() => toggleCompare(car.id)} aria-label={comparing ? `Remove ${car.model} from compare` : `Compare the ${car.model}`} aria-pressed={comparing} className={cn(round, "size-10", comparing ? "bg-[#e11d2a]" : "bg-black/55 hover:bg-black/75")}>
              <Scale className="size-[18px]" />
            </button>
          )}
        </div>
        <div className={cn("absolute flex gap-2", compact ? "bottom-2 right-2" : "bottom-4 right-4")}>
          {!compact && (
            <button type="button" onClick={() => requestCallback({ carId: car.id, intent: "callback" })} aria-label={`Request a call back about the ${car.model}`} className={cn(round, "size-11 bg-[#0b0b0c] shadow-lg")}>
              <PhoneCall className="size-[18px]" />
            </button>
          )}
          <a href={whatsappHref(`Hi VIP Motors, I'm interested in the ${title} (${priceShort(car.price)}).`)} target="_blank" rel="noreferrer" aria-label={`WhatsApp us about the ${car.model}`} className={cn(round, "bg-[#25d366] shadow-lg", compact ? "size-8" : "size-11")}>
            <MessageCircle className={compact ? "size-4" : "size-5"} />
          </a>
        </div>
      </div>

      <Link to={href} tabIndex={-1} aria-hidden className={cn("grid grid-cols-3 divide-x divide-line border-t border-line text-muted", compact ? "py-2.5 text-[10px]" : "py-4 text-sm")}>
        <span className="flex items-center justify-center gap-1.5 truncate px-1 tabular-nums">
          <Gauge className={cn("shrink-0 text-subtle", compact ? "size-3" : "size-4")} />
          {compact ? `${Math.round(car.km / 1000)}k km` : km(car.km)}
        </span>
        <span className="flex items-center justify-center gap-1.5 truncate px-1">
          <Fuel className={cn("shrink-0 text-subtle", compact ? "size-3" : "size-4")} />
          {car.fuel}
        </span>
        <span className="flex items-center justify-center gap-1.5 truncate px-1">
          <MapPin className={cn("shrink-0 text-subtle", compact ? "size-3" : "size-4")} />
          {car.regState}
        </span>
      </Link>
    </motion.article>
  );
}
