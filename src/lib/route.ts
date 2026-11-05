// Decides who answers a search: the deterministic index, the Co-Driver, or
// both. Lookups ("urus", "suv under 1 cr") stay instant and exact; questions
// and briefs ("best car for Coorg with kids", "compare x5 and q7") go to the
// Co-Driver, which can reason about fit, comparisons and finance.
import type { SearchResult } from "./search";

export type RouteMode = "search" | "ai" | "hybrid";

export interface Route {
  mode: RouteMode;
  /** Shown to the visitor, so the routing never feels arbitrary. */
  reason: string;
}

const ASKS = /\b(which|what|whats|what's|should|recommend|suggest|best|better|compare|comparison|vs|versus|difference|emi|loan|finance|afford|monthly|worth|good for|for my|for the|family|weekend|trips?|kids|children|wife|husband|dad|mom|mother|father|parents|chauffeur|commute|daily|looking for|i want|i need|help me|advice|between|like the|similar|cheaper than|instead of)\b/;

export function routeQuery(raw: string, res: SearchResult): Route {
  const q = raw.trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean).length;
  const asks = q.endsWith("?") || ASKS.test(q) || words >= 6;

  const found = res.cars.length + res.brands.length + res.categories.length > 0;

  if (asks && res.named.length) return { mode: "hybrid", reason: "A question about a specific car: Co-Driver answer plus exact matches" };
  if (asks) return { mode: "ai", reason: "Sounds like a brief, so the Co-Driver is answering" };
  if (!found) return { mode: "ai", reason: "No exact match, so the Co-Driver is answering" };
  return { mode: "search", reason: "Exact matches" };
}
