import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CarImage } from "@/data/types";
import { cn } from "@/lib/cn";

/**
 * Photo strip built on CSS scroll-snap: native swiping on touch screens,
 * arrow buttons for mouse and trackpad (the strip doesn't take wheel or
 * trackpad scrolling, so vertical page scrolls pass straight through), and a
 * 01/05 counter.
 */
export function ImageCarousel({
  images,
  alt,
  size = "sm",
  className,
  onIndexChange,
  imgClassName,
  selected,
  onOpen,
  counter = "right",
}: {
  images: CarImage[];
  alt: string;
  size?: "sm" | "lg";
  className?: string;
  imgClassName?: string;
  onIndexChange?: (i: number) => void;
  /** Scrolls to this photo when it changes (thumbnail strips). */
  selected?: number;
  /** Called when a photo is clicked, e.g. to open a lightbox. */
  onOpen?: (i: number) => void;
  /** Which corner the 01/05 counter sits in. */
  counter?: "left" | "right";
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.i);
            setIndex(i);
            onIndexChange?.(i);
          }
        }
      },
      { root: el, threshold: 0.6 },
    );
    el.querySelectorAll("[data-i]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [images, onIndexChange]);

  useEffect(() => {
    const el = track.current;
    if (el && selected !== undefined) el.scrollTo({ left: selected * el.clientWidth, behavior: "smooth" });
  }, [selected]);

  const go = (dir: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = track.current;
    if (!el) return;
    const next = Math.min(images.length - 1, Math.max(0, index + dir));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  if (!images.length) return <div className={cn("bg-surface-2", className)} />;

  return (
    <div className={cn("group/carousel relative overflow-hidden", className)}>
      <div ref={track} className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-hidden pointer-coarse:overflow-x-auto pointer-coarse:overscroll-x-contain">
        {images.map((img, i) => (
          <div key={img.src} data-i={i} className={cn("relative h-full w-full shrink-0 snap-center", onOpen && "cursor-zoom-in")} onClick={onOpen ? () => onOpen(i) : undefined}>
            <img
              src={size === "sm" ? img.src.replace(/\.jpg$/, "-sm.jpg") : img.src}
              alt={i === 0 ? alt : `${alt}, photo ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
              className={cn("h-full w-full object-cover", imgClassName)}
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={go(-1)}
            disabled={index === 0}
            className="absolute left-2 top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-bg/70 text-fg opacity-0 transition-opacity duration-150 group-hover/carousel:opacity-100 disabled:!opacity-0 md:grid"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={go(1)}
            disabled={index === images.length - 1}
            className="absolute right-2 top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-bg/70 text-fg opacity-0 transition-opacity duration-150 group-hover/carousel:opacity-100 disabled:!opacity-0 md:grid"
          >
            <ChevronRight className="size-4" />
          </button>
          <span className={cn("pointer-events-none absolute bottom-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] tabular-nums text-white/90", counter === "left" ? "left-2.5" : "right-2.5")}>
            {String(index + 1).padStart(2, "0")}/{String(images.length).padStart(2, "0")}
          </span>
        </>
      )}
    </div>
  );
}
