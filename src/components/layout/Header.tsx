import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Dialog, NavigationMenu } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Heart, Menu, Moon, Phone, Search, Sun, X } from "lucide-react";
import { inventory } from "@/data/inventory";
import { site, telHref } from "@/data/site";
import { cn } from "@/lib/cn";
import { dur, ease } from "@/lib/motion";
import { useApp } from "@/state/app-state";
import { useTheme } from "@/state/theme";
import { Logo } from "../Logo";
import { BuyMenuContent } from "./BuyMenu";

const LINKS = [
  { to: "/match", label: "VIP Match" },
  { to: "/sell", label: "Sell" },
  { to: "/contact", label: "Visit us" },
];

const MORE = [
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={(e) => toggle({ x: e.clientX, y: e.clientY })}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn("relative grid size-10 place-items-center overflow-hidden rounded-full transition-colors duration-150 hover:bg-current/10", className)}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={theme} initial={{ y: 22, rotate: -90, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: -22, rotate: 90, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 26 }}>
          {dark ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function Header() {
  const { pathname } = useLocation();
  const { shortlist, openSearch } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const overHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const tone = overHero ? "text-white" : "text-fg";

  return (
    <header className={cn("vt-header fixed inset-x-0 top-0 z-30 transition-[background-color,border-color,backdrop-filter] duration-300", overHero ? "border-b border-transparent bg-transparent" : "border-b border-line bg-bg/85 backdrop-blur-xl")}>
      <div className={cn("container-wide flex h-16 items-center gap-4 whitespace-nowrap lg:h-[76px] xl:gap-6", tone)}>
        <Logo onPhoto={overHero} />

        <NavigationMenu.Root className="relative hidden lg:block" delayDuration={80}>
          <NavigationMenu.List className="flex items-center gap-0.5">
            <NavigationMenu.Item>
              <NavigationMenu.Trigger className="group flex h-10 items-center gap-1 rounded-full px-3.5 text-sm opacity-85 transition-opacity duration-150 hover:opacity-100 data-[state=open]:opacity-100">
                Buy a car
                <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="absolute left-0 top-full pt-3">
                <motion.div initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35, ease: ease.enter }}>
                  <BuyMenuContent />
                </motion.div>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
            {LINKS.map((l) => {
              // Radix's asChild merges className as a string, so the active
              // state is worked out here rather than with NavLink's callback.
              const active = pathname === l.to || pathname.startsWith(`${l.to}/`);
              return (
                <NavigationMenu.Item key={l.to}>
                  <NavigationMenu.Link asChild active={active}>
                    <Link to={l.to} aria-current={active ? "page" : undefined} className={cn("relative flex h-10 items-center rounded-full px-3.5 text-sm transition-opacity duration-150 hover:opacity-100", active ? "opacity-100" : "opacity-85")}>
                      {l.label}
                      {active && <motion.span layoutId="nav-dot" className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent" />}
                    </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              );
            })}
          </NavigationMenu.List>
        </NavigationMenu.Root>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => openSearch()}
            className={cn(
              "mr-1 hidden h-11 items-center gap-3 rounded-full border px-4 text-sm transition-colors duration-150 lg:flex lg:w-[230px] xl:w-[330px]",
              overHero ? "border-white/25 bg-black/30 text-white/80 backdrop-blur hover:border-white/50" : "border-line-strong bg-surface text-muted hover:border-accent/60",
            )}
          >
            <Search className={cn("size-4", overHero ? "text-white" : "text-accent-fg")} aria-hidden />
            <span className="flex-1 truncate text-left">Search {inventory.length} cars…</span>
            <kbd className={cn("rounded-md border px-1.5 text-[11px]", overHero ? "border-white/25" : "border-line-strong")}>⌘K</kbd>
          </button>
          <button type="button" onClick={() => openSearch()} aria-label="Search stock" className="grid size-10 place-items-center rounded-full transition-colors duration-150 hover:bg-current/10 lg:hidden">
            <Search className="size-[18px]" />
          </button>
          <ThemeToggle />
          <Link to="/shortlist" aria-label={`Shortlist, ${shortlist.length} saved`} className="relative hidden size-10 place-items-center rounded-full transition-colors duration-150 hover:bg-current/10 sm:grid">
            <Heart className="size-[18px]" />
            {shortlist.length > 0 && (
              <motion.span key={shortlist.length} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold tabular-nums text-on-accent">
                {shortlist.length}
              </motion.span>
            )}
          </Link>
          <a href={telHref} className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm opacity-85 transition-opacity duration-150 hover:opacity-100 2xl:flex">
            <Phone className="size-4" aria-hidden /> {site.phone}
          </a>
          <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger aria-label="Open menu" className="grid size-10 place-items-center rounded-full transition-colors duration-150 hover:bg-current/10 lg:hidden">
        <Menu className="size-5" />
      </Dialog.Trigger>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div className="fixed inset-0 z-50 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.nav
                className="fixed inset-y-0 right-0 z-50 flex w-[88%] max-w-sm flex-col bg-elevated p-6 pt-[max(24px,env(safe-area-inset-top))] text-fg"
                initial={{ x: "100%" }}
                animate={{ x: 0, transition: { duration: dur.standard, ease: ease.enter } }}
                exit={{ x: "100%", transition: { duration: 0.3, ease: ease.exit } }}
              >
                <div className="flex items-center justify-between">
                  <Dialog.Title className="eyebrow">Menu</Dialog.Title>
                  <Dialog.Description className="sr-only">Site navigation</Dialog.Description>
                  <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <Dialog.Close aria-label="Close menu" className="grid size-10 place-items-center rounded-full hover:bg-fg/5">
                      <X className="size-5" />
                    </Dialog.Close>
                  </div>
                </div>
                <motion.ul className="mt-8 grid gap-1" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } }}>
                  {[{ to: "/cars", label: "Buy a car" }, ...LINKS, ...MORE, { to: "/shortlist", label: "Shortlist" }, { to: "/compare", label: "Compare" }].map((l) => (
                    <motion.li key={l.to} variants={{ hidden: { opacity: 0, x: 30 }, show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: ease.enter } } }}>
                      <Link to={l.to} className="display block py-2.5 text-2xl text-fg/90 transition-colors duration-150 hover:text-accent-fg">
                        {l.label}
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
                <div className="mt-auto grid gap-3 border-t border-line pt-6 text-sm text-muted">
                  <a href={telHref} className="flex items-center gap-2 text-fg">
                    <Phone className="size-4" aria-hidden /> {site.phone}
                  </a>
                  <p>
                    {site.address.line1}, {site.address.line2}
                  </p>
                </div>
              </motion.nav>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
