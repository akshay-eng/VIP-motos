import { NavLink } from "react-router";
import { motion } from "motion/react";
import { Car, Flame, Heart, Sparkles, Tag } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp } from "@/state/app-state";

const tab = ({ isActive }: { isActive: boolean }) =>
  cn("relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors duration-150", isActive ? "text-accent-fg" : "text-muted");

export function MobileTabBar() {
  const { openConcierge, shortlist } = useApp();
  const items = [
    { to: "/cars", label: "Buy", icon: Car },
    { to: "/match", label: "Match", icon: Flame },
  ];
  const after = [
    { to: "/sell", label: "Sell", icon: Tag },
    { to: "/shortlist", label: "Saved", icon: Heart },
  ];
  const render = (l: (typeof items)[number]) => (
    <NavLink key={l.to} to={l.to} className={tab}>
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="tab-active" className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
          <span className="relative">
            <l.icon className="size-5" aria-hidden />
            {l.to === "/shortlist" && shortlist.length > 0 && <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-semibold tabular-nums text-on-accent">{shortlist.length}</span>}
          </span>
          {l.label}
        </>
      )}
    </NavLink>
  );
  return (
    <nav aria-label="Quick navigation" className="vt-tabbar fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="flex h-16 items-stretch">
        {items.map(render)}
        <button type="button" onClick={() => openConcierge()} className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-fg">
          <span className="relative -mt-6 grid size-14 place-items-center rounded-full bg-accent text-on-accent shadow-lg shadow-accent/40">
            <span className="pulse-ring absolute inset-0 rounded-full bg-accent" aria-hidden />
            <Sparkles className="relative size-6" aria-hidden />
          </span>
          Co-Driver
        </button>
        {after.map(render)}
      </div>
    </nav>
  );
}
