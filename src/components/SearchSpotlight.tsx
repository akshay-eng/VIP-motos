import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { CornerDownLeft, Search, Sparkles, X, Zap } from "lucide-react";
import { brands, byId, inventory, type CarWithImages } from "@/data/inventory";
import { initialState, respond } from "@/ai/engine";
import { getApiKey } from "@/ai/key";
import type { ConciergeReply } from "@/ai/types";
import { search } from "@/lib/search";
import { routeQuery, type Route } from "@/lib/route";
import { inCategory, type Category } from "@/lib/filters";
import { km, priceShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";
import { useApp } from "@/state/app-state";
import { BodyIcon } from "./BodyIcon";
import { BrandLogo } from "./BrandLogo";

type Tab = "all" | "ai" | "cars" | "brands" | "body";

type Item =
  | { kind: "car"; car: CarWithImages; note?: string; group: "ai" | "cars" }
  | { kind: "brand"; name: string }
  | { kind: "cat"; cat: Category }
  | { kind: "continue" };

const isTyping = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/** Opens on ⌘K / Ctrl+K, or "/" when not typing in a field. */
function useSearchShortcut(open: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      } else if (e.key === "/" && !isTyping(e.target)) {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
}

// Names the inline completion can finish, most specific first.
const COMPLETIONS = [
  ...inventory.flatMap((c) => [
    { text: `${c.make} ${c.model}`, to: `/cars/${c.id}` },
    { text: c.model, to: `/cars/${c.id}` },
  ]),
  ...brands.map((b) => ({ text: b.name, to: `/cars?brand=${encodeURIComponent(b.name)}` })),
];

function completionFor(q: string) {
  const t = q.toLowerCase();
  if (t.trim().length < 2) return null;
  const hit = COMPLETIONS.find((c) => c.text.toLowerCase().startsWith(t) && c.text.length > q.length);
  return hit ? { rest: hit.text.slice(q.length), full: hit.text, to: hit.to } : null;
}

/**
 * Search in the manner of macOS Spotlight: a frosted bar over the page, with
 * results only once you type. A router decides whether the deterministic
 * index, the Co-Driver, or both answer the query.
 */
export function SearchSpotlight() {
  const { search: state, openSearch, closeSearch, openConcierge } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [active, setActive] = useState(0);
  const [claude, setClaude] = useState<{ q: string; reply: ConciergeReply } | null>(null);
  const [thinking, setThinking] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useSearchShortcut(openSearch);

  useEffect(() => {
    if (state.open) {
      setQ(state.query);
      setTab("all");
      setActive(0);
    }
  }, [state.open, state.query]);

  const trimmed = q.trim();
  const res = useMemo(() => search(q), [q]);
  const route: Route | null = trimmed ? routeQuery(q, res) : null;
  const usesAI = route?.mode === "ai" || route?.mode === "hybrid";
  const local = useMemo(() => (usesAI ? respond(trimmed, initialState()).reply : null), [usesAI, trimmed]);
  const ai = claude && claude.q === trimmed ? claude.reply : local;
  const completion = completionFor(q);

  // With an API key, questions are answered by Claude once typing pauses.
  useEffect(() => {
    const key = getApiKey();
    if (!usesAI || !key || !trimmed) return;
    let live = true;
    const t = setTimeout(async () => {
      setThinking(true);
      try {
        const { askClaude } = await import("@/ai/claude");
        const reply = await askClaude([{ id: "q", role: "user", text: trimmed }], key);
        if (live) setClaude({ q: trimmed, reply });
      } catch {
        // The on-device answer is already showing.
      } finally {
        if (live) setThinking(false);
      }
    }, 750);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [usesAI, trimmed]);

  const groups = useMemo(() => {
    const aiCars: Item[] = (ai?.cars ?? []).map((r) => ({ kind: "car", car: byId.get(r.id)!, note: r.reasons[0], group: "ai" }));
    const aiIds = new Set((ai?.cars ?? []).map((r) => r.id));
    const cars: Item[] = res.cars.filter((c) => route?.mode !== "ai" || !aiIds.has(c.id)).map((car) => ({ kind: "car", car, group: "cars" }));
    return {
      ai: usesAI ? [...aiCars, { kind: "continue" } as Item] : [],
      cars: route?.mode === "ai" ? cars.slice(0, 3) : cars,
      brands: res.brands.map((name) => ({ kind: "brand", name }) as Item),
      body: res.categories.map((cat) => ({ kind: "cat", cat }) as Item),
    };
  }, [ai, res, route?.mode, usesAI]);

  const order: Exclude<Tab, "all">[] = route?.mode === "search" ? ["cars", "brands", "body", "ai"] : ["ai", "cars", "brands", "body"];
  const visible = order.filter((g) => groups[g].length && (tab === "all" || tab === g));
  const items = visible.flatMap((g) => groups[g]);
  if (route?.mode === "search" && tab === "all") items.push({ kind: "continue" });

  useEffect(() => setActive(0), [q, tab]);
  useEffect(() => {
    list.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function hrefFor(item: Item) {
    if (item.kind === "car") return `/cars/${item.car.id}`;
    if (item.kind === "brand") return `/cars?brand=${encodeURIComponent(item.name)}`;
    if (item.kind === "cat") return `/cars?body=${item.cat}`;
    return null;
  }

  function run(item: Item | undefined) {
    if (!item) return;
    closeSearch();
    if (item.kind === "continue") openConcierge(trimmed || undefined);
    else navigate(hrefFor(item)!);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if ((e.key === "Tab" || e.key === "ArrowRight") && completion && e.currentTarget.selectionStart === q.length) {
      e.preventDefault();
      setQ(completion.full);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (completion && active === 0 && route?.mode === "search") {
        closeSearch();
        navigate(completion.to);
      } else run(items[active]);
    }
  }

  const counts: Record<Tab, number> = { all: 0, ai: groups.ai.length ? 1 : 0, cars: groups.cars.length, brands: groups.brands.length, body: groups.body.length };
  const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "ai", label: "Co-Driver" },
    { key: "cars", label: "Cars" },
    { key: "brands", label: "Brands" },
    { key: "body", label: "Body styles" },
  ];

  let idx = -1;
  const rowFor = (item: Item) => {
    idx += 1;
    const i = idx;
    const on = i === active;
    const href = hrefFor(item);
    const body = (
      <>
        {on && <motion.span layoutId="spot-active" className="absolute inset-0 rounded-2xl bg-white/75 shadow-sm dark:bg-white/10" transition={{ type: "spring", stiffness: 600, damping: 42 }} />}
        <span className="relative flex min-w-0 flex-1 items-center gap-3.5">
          {item.kind === "car" && (
            <>
              <img src={item.car.images[0]?.src.replace(/\.jpg$/, "-sm.jpg")} alt="" className="size-12 shrink-0 rounded-xl object-cover shadow-sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">
                  <Highlight text={`${item.car.make} ${item.car.model}`} q={item.group === "cars" ? trimmed : ""} />
                </span>
                <span className="block truncate text-[13px] text-muted">{item.note ?? `${item.car.year} · ${item.car.variant} · ${km(item.car.km)}`}</span>
              </span>
              <span className="shrink-0 text-[13px] tabular-nums text-muted">{priceShort(item.car.price)}</span>
            </>
          )}
          {item.kind === "brand" && (
            <>
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/70 shadow-sm dark:bg-white/10">
                <BrandLogo brand={item.name} className="h-6 text-fg/80" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">{item.name}</span>
                <span className="block text-[13px] text-muted">Brand</span>
              </span>
              <span className="shrink-0 text-[13px] tabular-nums text-muted">{plural(brands.find((b) => b.name === item.name)?.count ?? 0)}</span>
            </>
          )}
          {item.kind === "cat" && (
            <>
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/70 shadow-sm dark:bg-white/10">
                <BodyIcon category={item.cat} className="h-6 text-fg/80" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">{item.cat === "Sports" ? "Sports cars" : `${item.cat}s`}</span>
                <span className="block text-[13px] text-muted">Body style</span>
              </span>
              <span className="shrink-0 text-[13px] tabular-nums text-muted">{plural(inventory.filter((c) => inCategory(c, item.cat)).length)}</span>
            </>
          )}
          {item.kind === "continue" && (
            <>
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#e11d2a] text-white shadow-sm">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">{usesAI ? "Continue with the Co-Driver" : "Ask the Co-Driver"}</span>
                <span className="block truncate text-[13px] text-muted">“{trimmed}”</span>
              </span>
            </>
          )}
          {on && (
            <kbd className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] text-muted shadow-sm dark:bg-white/10">
              <CornerDownLeft className="size-3" aria-label="Enter" />
            </kbd>
          )}
        </span>
      </>
    );
    const common = { "data-idx": i, id: `spot-${i}`, role: "option", "aria-selected": on, onMouseMove: () => setActive(i), className: "relative flex w-full items-center rounded-2xl px-3 py-2 text-left" };
    return href ? (
      <Link key={i} to={href} {...common} onClick={closeSearch}>
        {body}
      </Link>
    ) : (
      <button key={i} type="button" {...common} onClick={() => run(item)}>
        {body}
      </button>
    );
  };

  return (
    <Dialog.Root open={state.open} onOpenChange={(o) => !o && closeSearch()}>
      <AnimatePresence>
        {state.open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div className="fixed inset-0 z-[60] bg-black/15 dark:bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                input.current?.focus();
                input.current?.select();
              }}
            >
              <motion.div
                className="fixed left-1/2 top-3 z-[60] flex max-h-[calc(100dvh-24px)] w-[min(760px,calc(100vw-24px))] -translate-x-1/2 flex-col overflow-hidden rounded-[26px] border border-white/60 bg-white/60 text-fg shadow-[0_40px_120px_-30px_rgba(0,0,0,0.55)] ring-1 ring-black/5 backdrop-blur-2xl backdrop-saturate-[1.8] sm:top-[14vh] sm:max-h-[76dvh] dark:border-white/10 dark:bg-[#1c1c1f]/65 dark:ring-white/5"
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 32 } }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.14, ease: ease.exit } }}
              >
                <Dialog.Title className="sr-only">Search</Dialog.Title>
                <Dialog.Description className="sr-only">Type a make, model or budget, or ask a question. Arrow keys move, Enter opens, Tab completes.</Dialog.Description>
                <div className="flex h-[68px] shrink-0 items-center gap-3.5 px-5 sm:h-[76px]">
                  <Search className="size-6 shrink-0 text-fg/55" aria-hidden />
                  <div className="relative min-w-0 flex-1">
                    {completion && (
                      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre text-[22px] font-light sm:text-[26px]">
                        <span className="opacity-0">{q}</span>
                        <span className="text-fg/35">{completion.rest}</span>
                        <span className="ml-3 hidden rounded-lg bg-white/70 px-2 py-0.5 text-[13px] font-normal text-muted shadow-sm sm:inline dark:bg-white/10">— Open</span>
                      </div>
                    )}
                    <input
                      ref={input}
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Search cars, or ask the Co-Driver"
                      aria-label="Search"
                      role="combobox"
                      aria-expanded={!!trimmed}
                      aria-controls="spot-results"
                      aria-activedescendant={trimmed ? `spot-${active}` : undefined}
                      autoComplete="off"
                      spellCheck={false}
                      className="relative h-12 w-full bg-transparent text-[22px] font-light text-fg placeholder:text-fg/35 focus:outline-none sm:text-[26px]"
                    />
                  </div>
                  {q ? (
                    <button type="button" onClick={() => { setQ(""); input.current?.focus(); }} aria-label="Clear" className="grid size-8 shrink-0 place-items-center rounded-full bg-fg/10 text-fg/60 hover:bg-fg/15">
                      <X className="size-4" />
                    </button>
                  ) : (
                    <Dialog.Close aria-label="Close search" className="grid size-8 shrink-0 place-items-center rounded-full text-fg/50 hover:bg-fg/10 sm:hidden">
                      <X className="size-4" />
                    </Dialog.Close>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {trimmed && (
                    <motion.div key="results" className="flex min-h-0 flex-col border-t border-black/5 dark:border-white/10" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto", transition: { duration: 0.3, ease: ease.enter } }} exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}>
                      <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
                        {TABS.filter((t) => t.key === "all" || counts[t.key]).map((t) => (
                          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("relative h-8 shrink-0 rounded-full px-4 text-[13px] font-medium transition-colors duration-150", tab === t.key ? "text-fg" : "text-fg/55 hover:text-fg")}>
                            {tab === t.key && <motion.span layoutId="spot-tab" className="absolute inset-0 rounded-full bg-white/80 shadow-sm dark:bg-white/15" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                            <span className="relative">{t.label}</span>
                          </button>
                        ))}
                        {route && (
                          <span className="ml-auto hidden shrink-0 items-center gap-1.5 pl-3 text-[11px] text-fg/45 sm:flex">
                            {route.mode === "search" ? <Zap className="size-3" aria-hidden /> : <Sparkles className="size-3 text-[#ff4655]" aria-hidden />}
                            {route.reason}
                          </span>
                        )}
                      </div>

                      <div ref={list} id="spot-results" role="listbox" aria-label="Results" className="min-h-0 overflow-y-auto overscroll-contain px-2 pb-2">
                        {visible.map((g) => (
                          <section key={g} className="mb-1">
                            <h3 className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg/40">
                              {g === "ai" && <Sparkles className="size-3 text-[#ff4655]" aria-hidden />}
                              {g === "ai" ? "Co-Driver" : g === "cars" ? (route?.mode === "ai" ? "Also matching" : "Cars") : g === "brands" ? "Brands" : "Body styles"}
                              {g === "ai" && thinking && <span className="ml-1 normal-case tracking-normal text-fg/40">refining with Claude…</span>}
                            </h3>
                            {g === "ai" && ai && (
                              <motion.p key={ai.text} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mx-1 mb-1.5 rounded-2xl bg-white/50 px-4 py-3 text-[14px] leading-relaxed text-fg/85 dark:bg-white/[0.06]">
                                {ai.text}
                              </motion.p>
                            )}
                            {groups[g].map(rowFor)}
                          </section>
                        ))}
                        {route?.mode === "search" && tab === "all" && rowFor({ kind: "continue" })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

const plural = (n: number) => `${n} car${n === 1 ? "" : "s"}`;

const NOISE = new Set(["the", "for", "and", "with", "under", "over", "car", "cars", "lakh", "crore", "my", "is", "good"]);

/** Bolds the parts of a name that match what was typed. */
function Highlight({ text, q }: { text: string; q: string }) {
  const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1 && !NOISE.has(t));
  if (!tokens.length) return <>{text}</>;
  const re = new RegExp(`(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  return (
    <>
      {text.split(re).map((part, i) =>
        tokens.includes(part.toLowerCase()) ? (
          <span key={i} className="font-semibold">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
