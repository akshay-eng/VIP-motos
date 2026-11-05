import { Link } from "react-router";
import { Heart, Scale, Sparkles } from "lucide-react";
import { byId, type CarWithImages } from "@/data/inventory";
import { ListingCard } from "@/components/collection/ListingCard";
import { useApp } from "@/state/app-state";

export default function Shortlist() {
  const { shortlist, setCompare, openConcierge } = useApp();
  const cars = shortlist.map((id) => byId.get(id)).filter((c): c is CarWithImages => !!c);
  return (
    <div className="container-x pb-24 pt-24 lg:pt-28">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Shortlist</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl">Saved cars</h1>
          <p className="mt-3 text-sm text-muted">Saved in this browser. Share the list with the team when you book a visit.</p>
        </div>
        {cars.length >= 2 && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/compare?ids=${cars.slice(0, 3).map((c) => c.id).join(",")}`} onClick={() => setCompare(cars.slice(0, 3).map((c) => c.id))} className="btn-ghost">
              <Scale className="size-4" aria-hidden /> Compare {Math.min(cars.length, 3)}
            </Link>
            <button type="button" onClick={() => openConcierge(`Compare the ${cars.slice(0, 3).map((c) => c.model).join(" and the ")}`)} className="btn-accent">
              <Sparkles className="size-4" aria-hidden /> Help me choose
            </button>
          </div>
        )}
      </div>
      {cars.length ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {cars.map((c, i) => (
            <ListingCard key={c.id} car={c} index={i} />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid place-items-center rounded-3xl border border-dashed border-line-strong px-6 py-20 text-center">
          <Heart className="size-8 text-accent-fg" aria-hidden />
          <p className="display mt-5 text-2xl">Nothing saved yet</p>
          <p className="mt-2 max-w-sm text-sm text-muted">Tap the heart on any car to keep it here.</p>
          <Link to="/cars" className="btn-accent mt-6">
            Browse the stock
          </Link>
        </div>
      )}
    </div>
  );
}
