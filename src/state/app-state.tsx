import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { load, save } from "@/lib/storage";

export const COMPARE_LIMIT = 3;

export type CallbackIntent = "callback" | "test-drive" | "reserve";

interface CallbackRequest {
  carId?: string;
  intent: CallbackIntent;
}

/** A message handed to the Co-Driver from elsewhere, optionally about one car. */
export interface PendingPrompt {
  text: string;
  carId?: string;
}

interface AppState {
  shortlist: string[];
  toggleShortlist: (id: string) => void;
  compare: string[];
  toggleCompare: (id: string) => boolean;
  setCompare: (ids: string[]) => void;
  recent: string[];
  markViewed: (id: string) => void;

  conciergeOpen: boolean;
  /** Opens the Co-Driver, optionally sending a message straight away. */
  openConcierge: (prompt?: string, carId?: string) => void;
  closeConcierge: () => void;
  pendingPrompt: PendingPrompt | null;
  takePendingPrompt: () => PendingPrompt | null;

  callback: CallbackRequest | null;
  requestCallback: (req: CallbackRequest) => void;
  closeCallback: () => void;

  /** The Spotlight search overlay, optionally opened with a query. */
  search: { open: boolean; query: string };
  openSearch: (query?: string) => void;
  closeSearch: () => void;
}

const Ctx = createContext<AppState | null>(null);

function usePersisted(key: string) {
  const [value, setValue] = useState<string[]>(() => load(key, []));
  const update = useCallback(
    (next: (prev: string[]) => string[]) =>
      setValue((prev) => {
        const v = next(prev);
        save(key, v);
        return v;
      }),
    [key],
  );
  return [value, update] as const;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [shortlist, setShortlist] = usePersisted("vip.shortlist");
  const [compare, setCompareState] = usePersisted("vip.compare");
  const [recent, setRecent] = usePersisted("vip.recent");
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<PendingPrompt | null>(null);
  const [callback, setCallback] = useState<CallbackRequest | null>(null);
  const [search, setSearch] = useState({ open: false, query: "" });

  const value = useMemo<AppState>(
    () => ({
      shortlist,
      toggleShortlist: (id) => setShortlist((s) => (s.includes(id) ? s.filter((x) => x !== id) : [id, ...s])),
      compare,
      toggleCompare: (id) => {
        if (compare.includes(id)) {
          setCompareState((s) => s.filter((x) => x !== id));
          return true;
        }
        if (compare.length >= COMPARE_LIMIT) return false;
        setCompareState((s) => [...s, id]);
        return true;
      },
      setCompare: (ids) => setCompareState(() => ids.slice(0, COMPARE_LIMIT)),
      recent,
      markViewed: (id) => setRecent((s) => [id, ...s.filter((x) => x !== id)].slice(0, 8)),

      conciergeOpen,
      openConcierge: (prompt, carId) => {
        if (prompt) setPendingPrompt({ text: prompt, carId });
        setConciergeOpen(true);
      },
      closeConcierge: () => setConciergeOpen(false),
      pendingPrompt,
      takePendingPrompt: () => {
        const p = pendingPrompt;
        if (p) setPendingPrompt(null);
        return p;
      },

      callback,
      requestCallback: setCallback,
      closeCallback: () => setCallback(null),

      search,
      openSearch: (query = "") => setSearch({ open: true, query }),
      closeSearch: () => setSearch((s) => ({ ...s, open: false })),
    }),
    [shortlist, compare, recent, conciergeOpen, pendingPrompt, callback, search, setShortlist, setCompareState, setRecent],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}
