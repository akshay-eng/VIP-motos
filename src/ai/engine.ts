// The on-device Co-Driver: merges what each message says into running
// preferences, ranks the stock, and writes a short, specific reply.
import { inventory, byId, brandOf, carName, type CarWithImages } from "@/data/inventory";
import type { Body, Fuel, Tag } from "@/data/types";
import { site } from "@/data/site";
import { emi as emiCalc, emiFrom, km, ownerLabel, priceShort, LOAN_DEFAULTS } from "@/lib/format";
import { colorFamily, parseMessage, type Parsed } from "./parse";
import { emptyPrefs, type ConciergeReply, type Prefs, type Recommendation, type Understood } from "./types";

export interface EngineState {
  prefs: Prefs;
  /** Every car shown so far in this search, so "more" skips them. */
  shown: string[];
  /** Cars in the most recent answer: what "these" and "it" refer to. */
  last: string[];
  /** The car the last answer was about, after a detail or EMI question. */
  focus?: string;
}

export const initialState = (): EngineState => ({ prefs: emptyPrefs(), shown: [], last: [] });

const PAGE = 3;

const cheapest = [...inventory].filter((c) => c.status !== "booked").sort((a, b) => a.price - b.price)[0];

const TAG_LABEL: Record<Tag, string> = {
  family: "Family",
  chauffeur: "Chauffeur-driven",
  performance: "Performance",
  offroad: "Off-road",
  city: "City driving",
  highway: "Highway",
  eco: "Low running cost",
  statement: "Statement car",
  weekend: "Weekend car",
  "first-luxury": "First luxury car",
  reliable: "Reliability",
  comfort: "Comfort",
  tech: "Tech",
  value: "Value",
  "open-top": "Open-top",
};

const BODY_PLURAL: Record<Body, string> = {
  SUV: "SUVs",
  Sedan: "sedans",
  Coupe: "coupés",
  Convertible: "convertibles",
  MPV: "MPVs",
};

const NUM_WORD = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

// ---------- preferences ----------

function mergePrefs(base: Prefs, parsed: Parsed): Prefs {
  const { prefs: incoming, touched } = parsed;
  const groups = [...touched].filter((k) => k !== "sort" && k !== "colors" && k !== "excludeColors");
  // "Only petrol" tweaks the last search; "a red convertible" or two new
  // criteria at once start a new one.
  const fresh = !parsed.refines && (parsed.namesCar || touched.has("family") || groups.length >= 2) && !parsed.models.length;
  const p: Prefs = fresh ? emptyPrefs() : structuredClone(base);

  if (touched.has("budgetMax")) {
    p.budgetMax = incoming.budgetMax;
    p.budgetMin = incoming.budgetMin;
    p.budgetTarget = incoming.budgetTarget;
    p.noBudget = incoming.noBudget;
  }
  if (touched.has("bodies")) p.bodies = incoming.bodies;
  if (touched.has("softBodies")) p.softBodies = incoming.softBodies;
  if (touched.has("brands")) {
    p.brands = incoming.brands;
    p.excludeBrands = p.excludeBrands.filter((b) => !incoming.brands.includes(b));
  }
  if (touched.has("excludeBrands")) {
    p.excludeBrands = [...new Set([...p.excludeBrands, ...incoming.excludeBrands])];
    p.brands = p.brands.filter((b) => !incoming.excludeBrands.includes(b));
  }
  if (touched.has("fuels")) {
    p.fuels = incoming.fuels;
    p.excludeFuels = p.excludeFuels.filter((f) => !incoming.fuels.includes(f));
  }
  if (touched.has("excludeFuels")) {
    p.excludeFuels = [...new Set([...p.excludeFuels, ...incoming.excludeFuels])];
    p.fuels = p.fuels.filter((f) => !incoming.excludeFuels.includes(f));
  }
  if (touched.has("minSeats")) p.minSeats = incoming.minSeats;
  if (touched.has("tags")) p.tags = [...new Set([...(fresh ? [] : p.tags), ...incoming.tags])];
  if (touched.has("yearMin")) p.yearMin = incoming.yearMin;
  if (touched.has("kmMax")) p.kmMax = incoming.kmMax;
  if (touched.has("colors")) {
    p.colors = incoming.colors;
    p.excludeColors = p.excludeColors.filter((c) => !incoming.colors.includes(c));
  }
  if (touched.has("excludeColors")) {
    p.excludeColors = [...new Set([...p.excludeColors, ...incoming.excludeColors])];
    p.colors = p.colors.filter((c) => !incoming.excludeColors.includes(c));
  }
  if (touched.has("sort")) p.sort = incoming.sort;
  if (touched.has("family")) p.family = incoming.family;
  else if (touched.has("brands")) p.family = undefined;
  if (fresh || touched.has("budgetMax")) p.hardMax = undefined;
  return p;
}

export function describePrefs(p: Prefs): Understood[] {
  const out: Understood[] = [];
  if (p.noBudget) out.push({ key: "budget", label: "Budget no bar" });
  else if (p.budgetTarget) out.push({ key: "budget", label: `Around ${priceShort(p.budgetTarget)}` });
  else if (p.budgetMin && p.budgetMax) out.push({ key: "budget", label: `${priceShort(p.budgetMin)} to ${priceShort(p.budgetMax)}` });
  else if (p.budgetMax) out.push({ key: "budget", label: `Under ${priceShort(p.budgetMax)}` });
  else if (p.budgetMin) out.push({ key: "budget", label: `Above ${priceShort(p.budgetMin)}` });
  p.bodies.forEach((b) => out.push({ key: `body:${b}`, label: b }));
  if (p.softBodies.length) out.push({ key: "softBodies", label: "Sports car" });
  p.brands.forEach((b) => out.push({ key: `brand:${b}`, label: b }));
  p.excludeBrands.forEach((b) => out.push({ key: `xbrand:${b}`, label: `No ${b}` }));
  p.fuels.forEach((f) => out.push({ key: `fuel:${f}`, label: f }));
  p.excludeFuels.forEach((f) => out.push({ key: `xfuel:${f}`, label: `No ${f.toLowerCase()}` }));
  if (p.minSeats) out.push({ key: "seats", label: `${p.minSeats}+ seats` });
  p.tags.forEach((t) => out.push({ key: `tag:${t}`, label: TAG_LABEL[t] }));
  if (p.yearMin) out.push({ key: "year", label: `${p.yearMin} or newer` });
  if (p.kmMax) out.push({ key: "km", label: `Under ${km(p.kmMax)}` });
  p.colors.forEach((c) => out.push({ key: `color:${c}`, label: c[0].toUpperCase() + c.slice(1) }));
  p.excludeColors.forEach((c) => out.push({ key: `xcolor:${c}`, label: `No ${c}` }));
  if (p.similarTo) {
    const ref = byId.get(p.similarTo);
    if (ref) out.push({ key: "similar", label: `Like the ${ref.model}` });
  }
  if (p.hardMax) out.push({ key: "hardMax", label: `Under ${priceShort(p.hardMax)}` });
  if (p.family) out.push({ key: "family", label: p.family.label });
  return out;
}

export function removePref(p: Prefs, key: string): Prefs {
  const n = structuredClone(p);
  const [kind, value] = key.split(":");
  switch (kind) {
    case "budget":
      n.budgetMax = n.budgetMin = n.budgetTarget = undefined;
      n.noBudget = false;
      break;
    case "body":
      n.bodies = n.bodies.filter((b) => b !== value);
      break;
    case "softBodies":
      n.softBodies = [];
      break;
    case "brand":
      n.brands = n.brands.filter((b) => b !== value);
      break;
    case "xbrand":
      n.excludeBrands = n.excludeBrands.filter((b) => b !== value);
      break;
    case "fuel":
      n.fuels = n.fuels.filter((f) => f !== value);
      break;
    case "xfuel":
      n.excludeFuels = n.excludeFuels.filter((f) => f !== value);
      break;
    case "seats":
      n.minSeats = undefined;
      break;
    case "tag":
      n.tags = n.tags.filter((t) => t !== value);
      break;
    case "year":
      n.yearMin = undefined;
      break;
    case "km":
      n.kmMax = undefined;
      break;
    case "color":
      n.colors = n.colors.filter((c) => c !== value);
      break;
    case "xcolor":
      n.excludeColors = n.excludeColors.filter((c) => c !== value);
      break;
    case "similar":
      n.similarTo = undefined;
      break;
    case "hardMax":
      n.hardMax = undefined;
      break;
    case "family":
      n.family = undefined;
      break;
  }
  return n;
}

// ---------- ranking ----------

interface Ranked {
  car: CarWithImages;
  score: number;
  overBudget: boolean;
}

interface Relaxed {
  budget?: number;
  dropped: string[];
}

const STRETCH = 1.08;

function passes(car: CarWithImages, p: Prefs, budgetCap: number | undefined, drop: Set<string>) {
  if (budgetCap !== undefined && car.price > budgetCap) return false;
  if (p.budgetMin && car.price < p.budgetMin) return false;
  if (!drop.has("body") && p.bodies.length && !p.bodies.includes(car.body)) return false;
  if (p.brands.length && !p.brands.includes(brandOf(car))) return false;
  if (p.excludeBrands.includes(brandOf(car))) return false;
  if (!drop.has("fuel") && p.fuels.length && !p.fuels.includes(car.fuel)) return false;
  if (p.excludeFuels.includes(car.fuel)) return false;
  if (!drop.has("seats") && p.minSeats && car.seats < p.minSeats) return false;
  if (!drop.has("year") && p.yearMin && car.year < p.yearMin) return false;
  if (!drop.has("km") && p.kmMax && car.km > p.kmMax) return false;
  if (p.similarTo && car.id === p.similarTo) return false;
  if (p.hardMax && car.price > p.hardMax) return false;
  if (p.family && !p.family.ids.includes(car.id)) return false;
  if (p.excludeColors.includes(colorFamily(car.exterior))) return false;
  return true;
}

function score(car: CarWithImages, p: Prefs, maxPrice: number) {
  let s = 0;
  for (const tag of p.tags) {
    if (car.tags.includes(tag)) s += 3;
    else if (tag === "chauffeur" || tag === "family" || tag === "offroad") s -= 2;
    switch (tag) {
      case "performance":
        s += car.powerHp / 160 + (car.zeroTo100 < 5 ? 1.5 : 0);
        break;
      case "offroad":
        s += car.drive === "4x4" ? 3 : car.body === "SUV" && car.drive === "AWD" ? 0.5 : -3;
        break;
      case "eco":
        s += car.fuel === "Electric" ? 4 : car.fuel === "Hybrid" ? 3 : car.fuel === "Diesel" ? 0.5 : -0.5;
        break;
      case "family":
        s += car.seats >= 7 ? 2 : car.seats >= 5 ? 1 : -4;
        if (car.body === "SUV" || car.body === "MPV") s += 1;
        break;
      case "chauffeur":
        if (car.body === "Sedan" || car.body === "MPV") s += 1.5;
        if (car.seats <= 2) s -= 5;
        break;
      case "city":
        if (car.body !== "SUV" && car.body !== "MPV") s += 1;
        break;
      case "statement":
        s += Math.min(3, car.price / 1e7);
        break;
      case "value":
        s += (1 - car.price / maxPrice) * 3;
        break;
      case "reliable":
        if (car.make === "Toyota" || car.make === "Lexus") s += 2;
        if (car.make === "Volvo") s += 1;
        break;
    }
  }
  if (p.softBodies.includes(car.body)) s += 2.5;
  if (p.colors.length && p.colors.includes(colorFamily(car.exterior))) s += 2.5;
  if (p.budgetTarget) s += 2 * Math.max(0, 1 - Math.abs(car.price - p.budgetTarget) / p.budgetTarget);
  else if (p.budgetMax && !p.tags.includes("value")) s += Math.min(1, car.price / p.budgetMax);
  if (p.noBudget) s += car.price / 1e7;
  if (p.similarTo) {
    const ref = byId.get(p.similarTo);
    if (ref) {
      if (ref.body === car.body) s += 3;
      s += 2 * Math.max(0, 1 - Math.abs(car.price - ref.price) / ref.price);
      s += car.tags.filter((t) => ref.tags.includes(t)).length;
      if (Math.abs(ref.seats - car.seats) <= 1) s += 1;
    }
  }
  if (car.status === "new-arrival") s += 0.3;
  s += 0.5 * Math.max(0, 1 - car.km / 100000);
  return s;
}

function sortRanked(list: Ranked[], sort: Prefs["sort"]) {
  const by: Record<NonNullable<Prefs["sort"]>, (a: Ranked, b: Ranked) => number> = {
    "price-asc": (a, b) => a.car.price - b.car.price,
    "price-desc": (a, b) => b.car.price - a.car.price,
    power: (a, b) => b.car.powerHp - a.car.powerHp,
    newest: (a, b) => b.car.year - a.car.year || a.car.km - b.car.km,
    km: (a, b) => a.car.km - b.car.km,
    range: (a, b) => (b.car.rangeKm ?? 0) - (a.car.rangeKm ?? 0),
  };
  return list.sort(sort ? (a, b) => by[sort](a, b) || b.score - a.score : (a, b) => b.score - a.score);
}

/** Ranks available stock, widening the search step by step if nothing fits. */
function rank(p: Prefs, exclude: string[]): { list: Ranked[]; relaxed: Relaxed } {
  // Booked cars only appear when the visitor names their model family.
  const pool = inventory.filter((c) => (c.status !== "booked" || p.family?.ids.includes(c.id)) && !exclude.includes(c.id));
  const maxPrice = Math.max(...inventory.map((c) => c.price));
  const attempts: { cap?: number; drop: string[] }[] = [
    { cap: p.budgetMax ? p.budgetMax * STRETCH : undefined, drop: [] },
    { cap: p.budgetMax ? p.budgetMax * 1.25 : undefined, drop: [] },
    { cap: p.budgetMax ? p.budgetMax * 1.25 : undefined, drop: ["year", "km"] },
    { cap: p.budgetMax ? p.budgetMax * 1.25 : undefined, drop: ["year", "km", "fuel"] },
    { cap: p.budgetMax ? p.budgetMax * 1.25 : undefined, drop: ["year", "km", "fuel", "body"] },
    { cap: p.budgetMax ? p.budgetMax * 1.5 : undefined, drop: ["year", "km", "fuel", "body", "seats"] },
  ];
  for (const [i, a] of attempts.entries()) {
    const drop = new Set(a.drop);
    const list = pool
      .filter((c) => passes(c, p, a.cap, drop))
      .map((car) => ({ car, score: score(car, p, maxPrice), overBudget: !!p.budgetMax && car.price > p.budgetMax }));
    if (list.length) {
      // With use-case tags, keep to cars that have at least one of them, as
      // long as that still leaves a real choice.
      const tagged = p.tags.length ? list.filter((r) => r.car.tags.some((t) => p.tags.includes(t))) : list;
      return {
        list: sortRanked(tagged.length >= 2 ? tagged : list, p.sort),
        relaxed: { budget: i > 0 && a.cap ? a.cap : undefined, dropped: a.drop },
      };
    }
  }
  return { list: [], relaxed: { dropped: [] } };
}

// ---------- copy ----------

function reasonsFor(car: CarWithImages, p: Prefs): string[] {
  const r: string[] = [];
  if (car.status === "booked") r.push("Booked right now; we can put you on the waitlist");
  const ref = p.similarTo ? byId.get(p.similarTo) : undefined;
  if (ref && car.price < ref.price) r.push(`${priceShort(ref.price - car.price)} less than the ${ref.model}`);
  else if (p.budgetTarget) r.push(`${priceShort(car.price)}, close to your ${priceShort(p.budgetTarget)} budget`);
  else if (p.budgetMax && car.price > p.budgetMax) r.push(`${priceShort(car.price - p.budgetMax)} over budget, worth the stretch`);
  else if (p.budgetMax) r.push(`${priceShort(car.price)}, inside your ${priceShort(p.budgetMax)} budget`);
  if (ref) {
    const shared = car.tags.filter((t) => ref.tags.includes(t)).map((t) => TAG_LABEL[t].toLowerCase());
    if (shared.length) r.push(`Same brief as the ${ref.model}: ${shared.slice(0, 2).join(", ")}`);
  }
  if (p.minSeats || p.tags.includes("family")) {
    const seatNote = car.highlights.find((h) => /seat|row/i.test(h));
    r.push(seatNote ? `${car.seats} seats · ${seatNote.toLowerCase()}` : `${car.seats} seats`);
  }
  if (p.tags.includes("performance") || p.softBodies.length) r.push(`${car.powerHp} hp, 0–100 km/h in ${car.zeroTo100}s`);
  if (p.tags.includes("offroad")) r.push(car.drive === "4x4" ? `Proper 4x4: ${car.highlights[0].toLowerCase()}` : `${car.drive}, with a ${car.body === "SUV" ? "raised SUV stance" : "sure-footed setup"}`);
  if (p.tags.includes("eco") || p.fuels.includes("Electric") || p.fuels.includes("Hybrid")) {
    if (car.fuel === "Electric") r.push(`Electric, ${car.rangeKm} km claimed range`);
    else if (car.fuel === "Hybrid") r.push("Hybrid, cheaper to run in traffic");
    else if (car.fuel === "Diesel") r.push("Diesel, the frugal choice for long runs");
  }
  if (p.tags.includes("chauffeur")) {
    const rear = car.highlights.find((h) => /rear|executive|lounge|recline|back/i.test(h));
    if (rear) r.push(rear);
  }
  if (p.tags.includes("comfort") && !p.tags.includes("chauffeur")) {
    const c = car.highlights.find((h) => /suspension|massage|airmatic|ride|quiet/i.test(h));
    if (c) r.push(c);
  }
  if (p.tags.includes("tech")) {
    const c = car.highlights.find((h) => /screen|display|hyperscreen|mbux|cockpit|head-up|adas/i.test(h));
    if (c) r.push(c);
  }
  if (p.tags.includes("value")) r.push(`EMI from about ${priceShort(Math.round(emiFrom(car.price) / 1000) * 1000).replace(" Lakh", "L")} a month`);
  if (p.colors.length && p.colors.includes(colorFamily(car.exterior))) r.push(`Finished in ${car.exterior}`);
  if (p.yearMin || p.kmMax || r.length < 2) r.push(`${car.year}, ${km(car.km)}, ${ownerLabel(car.owners)}`);
  if (r.length < 3) r.push(car.blurb);
  return [...new Set(r)].slice(0, 3);
}

/** "S-Class" is ambiguous next to a Maybach S-Class; fall back to the variant. */
function nameAmong(car: CarWithImages, cars: CarWithImages[]) {
  if (cars.filter((c) => c.model === car.model).length < 2) return car.model;
  const make = car.make.replace(/^Mercedes-(Benz)?/, "").trim();
  return `${make} ${car.variant.split(" ").slice(0, 2).join(" ")}`.trim();
}

/** Names what each car does best relative to the others shown. */
function standouts(cars: CarWithImages[], p: Prefs): string {
  if (cars.length < 2) return "";
  type Pick = { key: string; label: string; pick: (c: CarWithImages[]) => CarWithImages };
  const all: Record<string, Pick> = {
    quick: { key: "quick", label: "the quickest", pick: (c) => [...c].sort((a, b) => a.zeroTo100 - b.zeroTo100)[0] },
    value: { key: "value", label: "the best value", pick: (c) => [...c].sort((a, b) => a.price - b.price)[0] },
    newest: { key: "newest", label: "the newest", pick: (c) => [...c].sort((a, b) => b.year - a.year || a.km - b.km)[0] },
    roomy: { key: "roomy", label: "the roomiest", pick: (c) => [...c].sort((a, b) => b.seats - a.seats)[0] },
    km: { key: "km", label: "the least driven", pick: (c) => [...c].sort((a, b) => a.km - b.km)[0] },
    range: { key: "range", label: "goes furthest on a charge", pick: (c) => [...c].sort((a, b) => (b.rangeKm ?? 0) - (a.rangeKm ?? 0))[0] },
    rugged: { key: "rugged", label: "the most capable off-road", pick: (c) => [...c].sort((a, b) => Number(b.drive === "4x4") - Number(a.drive === "4x4") || b.torqueNm - a.torqueNm)[0] },
  };
  const order: string[] = [];
  if (p.fuels.includes("Electric") || p.sort === "range") order.push("range");
  if (p.tags.includes("performance") || p.softBodies.length) order.push("quick");
  if (p.tags.includes("offroad")) order.push("rugged");
  if (p.tags.includes("family") || p.minSeats) order.push("roomy");
  if (p.tags.includes("value") || p.tags.includes("first-luxury")) order.push("value");
  for (const k of ["value", "newest", "km", "quick", "roomy"]) if (!order.includes(k)) order.push(k);
  if (!cars.some((c) => c.rangeKm)) order.splice(order.indexOf("range") >>> 0, order.includes("range") ? 1 : 0);

  const used = new Set<string>();
  const parts: string[] = [];
  for (const k of order) {
    const { label, pick } = all[k];
    const c = pick(cars);
    if (used.has(c.id)) continue;
    // Skip a superlative that isn't really one (a tie on seats, say).
    if (k === "roomy" && cars.every((x) => x.seats === c.seats)) continue;
    if (k === "newest" && cars.every((x) => x.year === c.year)) continue;
    used.add(c.id);
    const name = nameAmong(c, cars);
    parts.push(label.startsWith("the ") ? `the ${name} is ${label}` : `the ${name} ${label}`);
    if (used.size === cars.length) break;
  }
  if (parts.length < 2) return "";
  const last = parts.pop();
  const sentence = `${parts.join(", ")} and ${last}.`;
  return sentence[0].toUpperCase() + sentence.slice(1);
}

function headline(n: number, p: Prefs, relaxed: Relaxed, more: boolean) {
  const count = NUM_WORD[n] ?? String(n);
  const dropped = new Set(relaxed.dropped);
  const seats = p.minSeats && !dropped.has("seats") ? `${NUM_WORD[p.minSeats] ?? p.minSeats}-seat ` : "";
  const fuel = p.fuels.length === 1 && !dropped.has("fuel") ? `${p.fuels[0].toLowerCase()} ` : "";
  const brand = p.brands.length === 1 && !p.family ? `${p.brands[0]} ` : "";
  let noun = p.bodies.length === 1 && !dropped.has("body") ? BODY_PLURAL[p.bodies[0]] : p.softBodies.length ? "sports cars" : "cars";
  if (p.family) noun = n === 1 ? p.family.label : `${p.family.label}${p.family.label.endsWith("s") ? "es" : "s"}`;
  if (n === 1) noun = noun.replace(/s$/, "").replace(/ie$/, "y");
  let budget = "";
  if (p.noBudget) budget = " with no ceiling on price";
  else if (p.budgetTarget) budget = ` around ${priceShort(p.budgetTarget)}`;
  else if (p.budgetMin && p.budgetMax) budget = ` between ${priceShort(p.budgetMin)} and ${priceShort(p.budgetMax)}`;
  else if (p.budgetMax) budget = ` under ${priceShort(p.budgetMax)}`;
  else if (p.budgetMin) budget = ` above ${priceShort(p.budgetMin)}`;
  else if (p.hardMax) budget = p.similarTo ? ` for less than the ${byId.get(p.similarTo)?.model}` : ` under ${priceShort(p.hardMax + 1)}`;
  if (p.similarTo && !p.hardMax) budget += ` like the ${byId.get(p.similarTo)?.model}`;
  const lead = more ? `${count[0].toUpperCase()}${count.slice(1)} more` : `${count[0].toUpperCase()}${count.slice(1)}`;
  let line = `${lead} ${seats}${fuel}${brand}${noun}${budget} from our floor.`;
  const anyLoosened = relaxed.dropped.some((d) => ({ year: p.yearMin, km: p.kmMax, fuel: p.fuels.length, body: p.bodies.length, seats: p.minSeats })[d as "year"]);
  if (relaxed.budget || anyLoosened) {
    const what: string[] = [];
    if (relaxed.budget && p.budgetMax) what.push(`stretched the budget to ${priceShort(relaxed.budget)}`);
    const map: Record<string, string> = { year: "the year", km: "the kilometre limit", fuel: "the fuel type", body: "the body style", seats: "the seat count" };
    const wasSet: Record<string, boolean> = { year: !!p.yearMin, km: !!p.kmMax, fuel: p.fuels.length > 0, body: p.bodies.length > 0, seats: !!p.minSeats };
    const loosened = relaxed.dropped.filter((d) => wasSet[d]).map((d) => map[d]);
    if (loosened.length) what.push(`loosened ${loosened.join(", ")}`);
    line = `Nothing ticked every box, so I ${what.join(" and ")}. ${line}`;
  }
  return line;
}

function chipsFor(p: Prefs, cars: CarWithImages[]): string[] {
  const c: string[] = [];
  if (cars.length) c.push("Show cheaper options");
  if (cars.length >= 2) c.push("Compare these");
  if (cars.length) c.push(`Book a test drive of the ${cars[0].model}`);
  c.push("Show me more");
  if (!p.fuels.length && !p.tags.includes("eco")) c.push("Only electric or hybrid");
  if (!p.minSeats && !p.bodies.includes("Coupe")) c.push("I need 7 seats");
  return c.slice(0, 4);
}

// ---------- replies ----------

function base(state: EngineState, extra: Partial<ConciergeReply>): ConciergeReply {
  void state;
  return { text: "", cars: [], chips: [], understood: [], actions: [], source: "local", ...extra };
}

function recommend(state: EngineState, opts: { more?: boolean; note?: string } = {}): { reply: ConciergeReply; state: EngineState } {
  const exclude = opts.more ? state.shown : [];
  const { list, relaxed } = rank(state.prefs, exclude);
  const top = list.slice(0, PAGE).map((r) => r.car);
  if (!top.length) {
    const reply = base(state, {
      understood: describePrefs(state.prefs),
      text: opts.more
        ? "That's everything on the floor that fits. New stock lands most weeks; leave your number and we'll call when something matching arrives."
        : [
            "Nothing in stock fits that yet.",
            state.prefs.budgetMax && state.prefs.budgetMax < cheapest.price ? `Our most affordable car right now is the ${cheapest.year} ${carName(cheapest)} at ${priceShort(cheapest.price)}.` : "",
            opts.note ?? "",
            "Widen the budget, drop a filter below, or ask the team to source one for you.",
          ]
            .filter(Boolean)
            .join(" "),
      chips: ["Start over", "Ask the team to source one", "Show cheaper options"],
      actions: [{ type: "callback", intent: "callback" }],
    });
    return { reply, state };
  }
  const recs: Recommendation[] = top.map((car) => ({ id: car.id, reasons: reasonsFor(car, state.prefs) }));
  const p = state.prefs;
  const notes: string[] = [];
  if (p.colors.length && !top.some((c) => p.colors.includes(colorFamily(c.exterior)))) notes.push(`None in ${p.colors.join(" or ")} right now; these are the closest.`);
  const text = [headline(top.length, p, relaxed, !!opts.more), standouts(top, p), ...notes, opts.note].filter(Boolean).join(" ");
  const next: EngineState = { ...state, shown: [...new Set([...(opts.more ? state.shown : []), ...top.map((c) => c.id)])], last: top.map((c) => c.id), focus: undefined };
  return { reply: base(next, { text, cars: recs, chips: chipsFor(state.prefs, top), understood: describePrefs(state.prefs) }), state: next };
}

function detail(state: EngineState, id: string) {
  const car = byId.get(id)!;
  const similar = rank({ ...emptyPrefs(), similarTo: id }, [id]).list.slice(0, 2).map((r) => r.car);
  const status =
    car.status === "booked"
      ? "It's booked right now, but bookings do fall through. I can put you first in line."
      : car.status === "new-arrival"
        ? "It only just arrived, so it's worth seeing this week."
        : "";
  const text = `${car.blurb} It's a ${car.year} with ${km(car.km)} on the clock, ${ownerLabel(car.owners)}, ${car.fuel.toLowerCase()} and ${car.drive}. ${car.powerHp} hp and 0–100 km/h in ${car.zeroTo100}s. Asking ${priceShort(car.price)}, or about ₹${Math.round(emiFrom(car.price)).toLocaleString("en-IN")} a month on finance. ${status}`.trim();
  const next: EngineState = { ...state, last: [id, ...similar.map((c) => c.id)], focus: id };
  return {
    reply: base(next, {
      text,
      cars: [
        { id, reasons: car.highlights.slice(0, 3) },
        ...similar.map((c) => ({ id: c.id, reasons: [`Alternative to the ${car.model}`, `${priceShort(c.price)} · ${c.year} · ${km(c.km)}`] })),
      ],
      chips: [`EMI for the ${car.model}`, `Book a test drive of the ${car.model}`, similar[0] ? `Compare ${car.model} vs ${similar[0].model}` : "Show similar cars", "Something cheaper"],
      actions: [{ type: "link", to: `/cars/${id}`, label: `Open the ${car.model}` }],
    }),
    state: next,
  };
}

function compareReply(state: EngineState, ids: string[]) {
  const cars = ids.map((id) => byId.get(id)!).slice(0, 3);
  const [a, b] = cars;
  const lines: string[] = [];
  const quick = [...cars].sort((x, y) => x.zeroTo100 - y.zeroTo100)[0];
  const cheap = [...cars].sort((x, y) => x.price - y.price)[0];
  const roomy = [...cars].sort((x, y) => y.seats - x.seats)[0];
  lines.push(`The ${quick.model} is quickest at ${quick.zeroTo100}s to 100.`);
  if (cheap.id !== quick.id) lines.push(`The ${cheap.model} costs least, ${priceShort(cheap.price)}.`);
  else lines.push(`It's also the cheapest of the ${NUM_WORD[cars.length]}.`);
  if (roomy.seats > Math.min(...cars.map((c) => c.seats))) lines.push(`The ${roomy.model} seats ${roomy.seats}.`);
  if (a && b && a.year !== b.year) {
    const newer = a.year > b.year ? a : b;
    lines.push(`The ${newer.model} is the newer car (${newer.year}).`);
  }
  const next: EngineState = { ...state, last: cars.map((c) => c.id), focus: undefined };
  return {
    reply: base(next, {
      text: lines.join(" "),
      compare: cars.map((c) => c.id),
      chips: [`Book a test drive of the ${cars[0].model}`, `EMI for the ${cheap.model}`, "Show me more like these"],
      actions: [{ type: "compare", ids: cars.map((c) => c.id) }],
    }),
    state: next,
  };
}

function emiReply(state: EngineState, id: string, parsed: Parsed) {
  const car = byId.get(id)!;
  const downPct = parsed.emi.downPct ?? LOAN_DEFAULTS.downPct;
  const rate = parsed.emi.rate ?? LOAN_DEFAULTS.rate;
  const principal = car.price * (1 - downPct / 100);
  const tenures = parsed.emi.months ? [parsed.emi.months] : [36, 48, 60];
  const rows = tenures.map((months) => ({ months, emi: emiCalc(principal, rate, months) }));
  const main = rows[rows.length - 1];
  const text = `For the ${car.year} ${carName(car)} at ${priceShort(car.price)}: with ${downPct}% down (${priceShort(car.price * (downPct / 100))}) at ${rate}% a year, the EMI is about ₹${Math.round(main.emi).toLocaleString("en-IN")} over ${main.months / 12} years. Rates depend on your profile; our finance desk works with several banks and will confirm.`;
  const next: EngineState = { ...state, last: [id], focus: id };
  return {
    reply: base(next, {
      text,
      emi: { carId: id, downPct, rate, rows },
      cars: [{ id, reasons: [`${priceShort(car.price)} · ${car.year} · ${km(car.km)}`] }],
      chips: [`What if I put ${downPct >= 30 ? downPct + 10 : 30}% down?`, `Book a test drive of the ${car.model}`, "Talk to the finance desk"],
      actions: [{ type: "link", to: `/cars/${id}#emi`, label: "Open the EMI calculator" }],
    }),
    state: next,
  };
}

export const WELCOME: ConciergeReply = {
  text: `I'm your VIP Co-Driver. Tell me how you'll use the car, roughly what you'd like to spend, and anything you love or can't stand. I'll match it against the ${inventory.filter((c) => c.status !== "booked").length} cars on our floor right now.`,
  cars: [],
  chips: [
    "7-seater SUV for the family under ₹1 Cr",
    "A weekend sports car, budget no bar",
    "Chauffeur-driven sedan for business",
    "Electric luxury car with long range",
  ],
  understood: [],
  actions: [],
  source: "local",
};

/** One turn of conversation. Pure: returns the reply and the next state. */
export function respond(message: string, state: EngineState): { reply: ConciergeReply; state: EngineState } {
  const parsed = parseMessage(message);
  const focus = parsed.models[0] ?? state.focus ?? state.last[0];

  switch (parsed.intent) {
    case "reset": {
      const s = initialState();
      return { reply: { ...WELCOME, text: "Fresh start. What are you looking for?" }, state: s };
    }
    case "greeting":
      return { reply: WELCOME, state };
    case "help":
      return {
        reply: base(state, {
          text: "Describe the car in your own words. I understand budgets (\"under 80 lakh\", \"1.5 cr\"), body styles, brands you like or don't, fuel, seats, and how you'll use it: family, chauffeur, weekends, off-road, city traffic. I can also compare cars, work out EMIs and book a test drive.",
          chips: WELCOME.chips,
        }),
        state,
      };
    case "visit":
      return {
        reply: base(state, {
          text: `We're on ${site.address.line1}, ${site.address.line2}. ${site.hours}. Walk in any time, or book a slot and we'll have your shortlist out front, washed and ready.`,
          chips: ["Book a showroom visit", "What's new this week?"],
          actions: [
            { type: "link", to: "/contact", label: "Directions and contact" },
            { type: "callback", intent: "test-drive" },
          ],
        }),
        state,
      };
    case "callback":
      return {
        reply: base(state, {
          text: `Of course. Leave your number and someone from the floor will call you back, usually within the hour during showroom hours. You can also WhatsApp us or email ${site.email}.`,
          actions: [{ type: "callback", carId: focus, intent: "callback" }],
        }),
        state,
      };
    case "test-drive": {
      const car = focus ? byId.get(focus) : undefined;
      return {
        reply: base(state, {
          text: car
            ? `Good choice. Pick a time and we'll have the ${car.year} ${car.model} ready, at the showroom or at your door anywhere in Bengaluru.`
            : "Happy to. Which car would you like to drive? Book a slot below and tell us, or ask me for a recommendation first.",
          actions: [{ type: "callback", carId: car?.id, intent: "test-drive" }],
          cars: car ? [{ id: car.id, reasons: [`${priceShort(car.price)} · ${car.year} · ${km(car.km)}`] }] : [],
        }),
        state,
      };
    }
    case "sell":
      return {
        reply: base(state, {
          text: "We buy luxury cars outright and take them in exchange. Share the basics and we'll inspect it at your home or office, then make an offer. Payment is settled at handover, and we handle the RC transfer.",
          actions: [{ type: "link", to: "/sell", label: "Get an offer for your car" }],
          chips: ["How is the price decided?", "Can I exchange for a car in stock?"],
        }),
        state,
      };
    case "emi":
      if (focus) return emiReply(state, focus, parsed);
      return {
        reply: base(state, {
          text: `Our finance desk arranges loans through partner banks. As a guide, a ${priceShort(5000000)} car with 20% down at ${LOAN_DEFAULTS.rate}% over five years is about ₹${Math.round(emiCalc(4000000)).toLocaleString("en-IN")} a month. Pick a car and I'll work out its EMI.`,
          chips: ["EMI for the BMW X5", "Cars with EMI under ₹1 lakh a month"],
        }),
        state,
      };
    case "compare": {
      const recent = state.last.length >= 2 ? state.last : [...new Set([...state.last, ...state.shown.slice(-3)])];
      let ids = parsed.models.length >= 2 ? parsed.models : recent;
      if (parsed.models.length === 1) ids = [parsed.models[0], ...recent.filter((x) => x !== parsed.models[0])];
      if (ids.length >= 2) return compareReply(state, ids.slice(0, 3));
      return {
        reply: base(state, {
          text: "I need at least two cars to compare. Name them, like \"compare the X5 and the Q7\", or ask for a few options first.",
          chips: ["Compare X5 vs Q7", "Compare GLS vs X7", "Show me SUVs under ₹1 Cr"],
        }),
        state,
      };
    }
    case "detail":
      return detail(state, parsed.models[0]);
    case "similar": {
      const ref = byId.get(parsed.models[0])!;
      const merged = mergePrefs({ ...emptyPrefs(), similarTo: ref.id }, parsed);
      merged.similarTo = ref.id;
      if (/cheaper|less|lower|under/.test(parsed.text) && !merged.budgetMax) merged.hardMax = ref.price - 1;
      return recommend({ ...state, prefs: merged }, { note: "" });
    }
    case "cheaper": {
      if (state.focus) {
        const ref = byId.get(state.focus)!;
        const prefs: Prefs = { ...emptyPrefs(), similarTo: ref.id, hardMax: ref.price - 1 };
        return recommend({ ...state, prefs });
      }
      const shownPrices = state.last.map((id) => byId.get(id)!.price);
      const ceiling = shownPrices.length ? Math.min(...shownPrices) - 1 : state.prefs.budgetMax ? state.prefs.budgetMax * 0.8 : 5000000;
      const prefs: Prefs = { ...mergePrefs(state.prefs, parsed), budgetMax: undefined, budgetTarget: undefined, budgetMin: undefined, noBudget: false, hardMax: ceiling };
      return recommend({ ...state, prefs });
    }
    case "pricier": {
      const shownPrices = state.last.map((id) => byId.get(id)!.price);
      const floor = shownPrices.length ? Math.max(...shownPrices) : 10000000;
      const prefs = { ...mergePrefs(state.prefs, parsed), budgetMin: floor * 1.02, budgetMax: undefined, budgetTarget: undefined };
      return recommend({ ...state, prefs });
    }
    case "more":
      return recommend({ ...state, prefs: mergePrefs(state.prefs, parsed) }, { more: true });
  }

  if (parsed.intent === "recommend" || parsed.touched.size) {
    const prefs = mergePrefs(state.prefs, parsed);
    const note = [parsed.wantsManual ? "Everything we stock is automatic." : "", parsed.wantsHatchback ? "We don't stock hatchbacks." : ""].filter(Boolean).join(" ") || undefined;
    return recommend({ ...state, prefs }, { note });
  }

  return {
    reply: base(state, {
      text: "I didn't quite catch that. Try something like \"an SUV under 80 lakh for weekend trips to Coorg\" or \"something like the GLE but cheaper\".",
      chips: WELCOME.chips,
    }),
    state,
  };
}

/** A question about one specific car, e.g. from its detail page. */
export function respondAbout(carId: string, state: EngineState) {
  return detail(state, carId);
}

/** Re-runs the current search after a preference chip is removed. */
export function respondToRemoval(key: string, state: EngineState) {
  const prefs = removePref(state.prefs, key);
  return recommend({ ...state, prefs }, { note: "" });
}

export function prefsFromFuelBody(fuel?: Fuel, body?: Body): Prefs {
  return { ...emptyPrefs(), fuels: fuel ? [fuel] : [], bodies: body ? [body] : [] };
}
