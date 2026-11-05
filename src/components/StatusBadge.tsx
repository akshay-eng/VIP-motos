import type { Status } from "@/data/types";
import { cn } from "@/lib/cn";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  if (status === "available") return null;
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-medium",
        status === "booked" ? "bg-bg/80 text-muted ring-1 ring-line-strong" : "bg-accent text-on-accent",
        className,
      )}
    >
      {status === "booked" ? "Booked" : "Just arrived"}
    </span>
  );
}
