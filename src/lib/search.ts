// Instant search for the Spotlight panel. Plain text ("urus", "x5 m sport")
// matches names and specs; phrases like "suv under 1 cr" or "red convertible"
// also go through the Co-Driver's parser so they narrow the stock properly.
import { brandOf, brands, inventory, type CarWithImages } from "@/data/inventory";
import { colorFamily, parseMessage } from "@/ai/parse";
import { CATEGORIES, inCategory, type Category } from "./filters";

const STOP = new Set(["a", "an", "the", "for", "with", "and", "or", "my", "me", "under", "below", "above", "over", "less", "more", "than", "within", "upto", "up", "to", "around", "about", "budget", "lakh", "lakhs", "lac", "l", "cr", "crore", "crores", "rs", "inr", "km", "kms", "seater", "seats", "seat", "car", "cars", "i", "want", "need", "show", "find", "looking", "something", "some", "any", "in", "on", "of", "no", "not"]);

function haystack(c: CarWithImages) {
  return `${c.year} ${c.make} ${brandOf(c)} ${c.model} ${c.variant} ${c.body} ${c.fuel} ${c.exterior} ${c.drive} ${(c.aliases ?? []).join(" ")} ${c.tags.join(" ")}`
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ");
}

const HAY = new Map(inventory.map((c) => [c.id, haystack(c).split(/\s+/)]));

function tokenScore(words: string[], token: string) {
  if (words.includes(token)) return 4;
  if (words.some((w) => w.startsWith(token))) return 3;
  if (token.length >= 3 && words.some((w) => w.includes(token))) return 1;
  return 0;
}

export interface SearchResult {
  cars: CarWithImages[];
  /** Cars the query named outright ("urus", "the x5"). */
  named: string[];
  brands: string[];
  categories: Category[];
  /** True when the query reads like a request the Co-Driver should answer. */
  conversational: boolean;
}

export function search(raw: string, limit = 8): SearchResult {
  const q = raw.trim().toLowerCase();
  if (!q) return { cars: [], named: [], brands: [], categories: [], conversational: false };

  const tokens = q.replace(/[^a-z0-9₹. ]+/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t) && !/^\d+(\.\d+)?$/.test(t));
  const yearTokens = q.match(/\b20[12]\d\b/g)?.map(Number) ?? [];
  const parsed = parseMessage(raw);
  const p = parsed.prefs;
  const constrained = parsed.touched.size > 0;

  const passes = (c: CarWithImages) => {
    if (p.budgetMax && c.price > p.budgetMax * 1.05) return false;
    if (p.budgetMin && c.price < p.budgetMin) return false;
    if (p.bodies.length && !p.bodies.includes(c.body)) return false;
    if (p.fuels.length && !p.fuels.includes(c.fuel)) return false;
    if (p.excludeFuels.includes(c.fuel)) return false;
    if (p.brands.length && !p.brands.includes(brandOf(c))) return false;
    if (p.excludeBrands.includes(brandOf(c))) return false;
    if (p.minSeats && c.seats < p.minSeats) return false;
    if (p.colors.length && !p.colors.includes(colorFamily(c.exterior))) return false;
    if (p.excludeColors.includes(colorFamily(c.exterior))) return false;
    if (p.yearMin && c.year < p.yearMin) return false;
    return true;
  };

  const scored = inventory
    .map((c) => {
      const words = HAY.get(c.id)!;
      const per = tokens.map((t) => tokenScore(words, t));
      const text = per.reduce((a: number, b) => a + b, 0) + (yearTokens.includes(c.year) ? 3 : 0);
      const allTokens = per.length > 0 && per.every((s) => s > 0);
      const named = parsed.models.includes(c.id);
      return { c, text, allTokens, named, ok: passes(c) };
    })
    // A named car always shows. Otherwise it must pass what the parser
    // understood, and match every word, or any word when the query also
    // carried constraints ("weekend car under 1 cr").
    .filter(({ text, allTokens, named, ok }) => named || (ok && (allTokens || (constrained && (tokens.length === 0 || text > 0)))))
    .sort((a, b) => Number(b.named) - Number(a.named) || Number(b.allTokens) - Number(a.allTokens) || b.text - a.text || b.c.price - a.c.price);

  const brandHits = brands
    .map((b) => b.name)
    .filter((name) => tokens.some((t) => name.toLowerCase().split(/[\s-]/).some((w) => w.startsWith(t))) || p.brands.includes(name));
  const catHits = CATEGORIES.filter((cat) => tokens.some((t) => cat.toLowerCase().startsWith(t)) || p.bodies.includes(cat as never) || (cat === "Sports" && (p.softBodies.length > 0 || /sport|super ?car|fast/.test(q))));

  return {
    cars: scored.slice(0, limit).map((s) => s.c),
    named: parsed.models,
    brands: brandHits.slice(0, 6),
    categories: catHits.filter((cat) => inventory.some((c) => inCategory(c, cat))).slice(0, 4),
    conversational: q.split(/\s+/).length >= 4 || /\b(for|my|family|weekend|best|suggest|recommend|which|should)\b/.test(q),
  };
}

/** Total matches for "See all", without the display limit. */
export function searchCount(raw: string) {
  return search(raw, 999).cars.length;
}
