import type { Body, Fuel, Tag } from "@/data/types";

export type SortKey = "price-asc" | "price-desc" | "power" | "newest" | "km" | "range";

/** Everything the Co-Driver has understood so far in a conversation. */
export interface Prefs {
  budgetMax?: number;
  budgetMin?: number;
  /** "around 80 lakh": a point to stay close to. */
  budgetTarget?: number;
  noBudget?: boolean;
  bodies: Body[];
  /** Soft body preference, e.g. "sports car" leans coupe or convertible. */
  softBodies: Body[];
  brands: string[];
  excludeBrands: string[];
  fuels: Fuel[];
  excludeFuels: Fuel[];
  minSeats?: number;
  tags: Tag[];
  yearMin?: number;
  kmMax?: number;
  colors: string[];
  excludeColors: string[];
  sort?: SortKey;
  /** Cars to find alternatives to ("something like the X5"). */
  similarTo?: string;
  /** A ceiling that is never stretched: "cheaper than these" means cheaper. */
  hardMax?: number;
  /** A model family the visitor named ("range rover"), with its label. */
  family?: { label: string; ids: string[] };
}

export const emptyPrefs = (): Prefs => ({
  bodies: [],
  softBodies: [],
  brands: [],
  excludeBrands: [],
  fuels: [],
  excludeFuels: [],
  tags: [],
  colors: [],
  excludeColors: [],
});

export interface Recommendation {
  id: string;
  reasons: string[];
}

export type ReplyAction =
  | { type: "compare"; ids: string[] }
  | { type: "link"; to: string; label: string }
  | { type: "callback"; carId?: string; intent: "callback" | "test-drive" }
  | { type: "external"; href: string; label: string };

/** A removable chip showing one thing the Co-Driver understood. */
export interface Understood {
  key: string;
  label: string;
}

export interface ConciergeReply {
  text: string;
  cars: Recommendation[];
  chips: string[];
  understood: Understood[];
  actions: ReplyAction[];
  /** Car ids to render as a side-by-side spec table. */
  compare?: string[];
  emi?: { carId: string; downPct: number; rate: number; rows: { months: number; emi: number }[] };
  source: "local" | "claude";
  note?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  reply?: ConciergeReply;
}
