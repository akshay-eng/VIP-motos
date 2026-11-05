// Turns a free-text message into structured preferences. Deliberately
// rule-based: it runs instantly in the browser, needs no key, and its
// understanding is shown back to the user as chips they can remove.
import type { Body, Fuel, Tag } from "@/data/types";
import { inventory, brandOf } from "@/data/inventory";
import { emptyPrefs, type Prefs, type SortKey } from "./types";

export interface Parsed {
  /** The normalised message text. */
  text: string;
  prefs: Prefs;
  /** Which preference groups this message actually mentioned. */
  touched: Set<keyof Prefs>;
  /** Car ids named in the message ("the X5", "g wagon"). */
  models: string[];
  /** The message names a kind of car, so it reads as a new search. */
  namesCar: boolean;
  /** The message opens like a tweak to the last search ("only petrol"). */
  refines: boolean;
  intent: Intent;
  emi: { downPct?: number; months?: number; rate?: number };
  wantsManual: boolean;
  wantsHatchback: boolean;
}

export type Intent =
  | "greeting"
  | "help"
  | "reset"
  | "visit"
  | "callback"
  | "test-drive"
  | "sell"
  | "emi"
  | "compare"
  | "detail"
  | "similar"
  | "cheaper"
  | "pricier"
  | "more"
  | "recommend"
  | "unknown";

const NEG = /(?:\bno\b|\bnot\b|\bnon[- ]?|\bexcept\b|\bavoid\b|\bwithout\b|\bother than\b|\banything but\b|\bdon'?t want\b|\bdo not want\b|\bhate\b|\bexclude\b|\bexcluding\b|\bskip\b)\s*(?:an?\s+|the\s+)?$/;

/** True when the words just before `index` negate what follows. */
function negatedAt(text: string, index: number) {
  return NEG.test(text.slice(Math.max(0, index - 28), index));
}

function findAll(text: string, re: RegExp) {
  const out: { match: string; index: number }[] = [];
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m: RegExpExecArray | null;
  while ((m = g.exec(text))) out.push({ match: m[0], index: m.index });
  return out;
}

// ---------- budget ----------

const UNIT = String.raw`(cr|crs|crore|crores|l|lakh|lakhs|lac|lacs|lk|k)`;

function toRupees(n: number, unit?: string) {
  if (!unit) return n;
  if (/^cr/.test(unit)) return n * 1e7;
  if (/^(l|lakh|lakhs|lac|lacs|lk)$/.test(unit)) return n * 1e5;
  if (unit === "k") return n * 1e3;
  return n;
}

function parseBudget(t: string, prefs: Prefs, touched: Set<keyof Prefs>) {
  if (/\b(budget no bar|no budget|money (is )?no (object|bar|issue)|sky('?s| is) the limit|any budget|price no bar|budget is not an issue|whatever it costs|no limit)\b/.test(t)) {
    prefs.noBudget = true;
    touched.add("budgetMax");
    return;
  }
  if (/\bhalf (a )?crore\b/.test(t)) t = t.replace(/\bhalf (a )?crore\b/, "50 lakh");

  const range = new RegExp(String.raw`(?:between\s+)?(\d+(?:\.\d+)?)\s*${UNIT}?\s*(?:-|–|to|and)\s*(\d+(?:\.\d+)?)\s*${UNIT}\b`).exec(t);
  if (range) {
    const unit2 = range[4];
    const lo = toRupees(parseFloat(range[1]), range[2] ?? unit2);
    const hi = toRupees(parseFloat(range[3]), unit2);
    if (hi > lo && hi >= 1e5) {
      prefs.budgetMin = lo;
      prefs.budgetMax = hi;
      prefs.budgetTarget = undefined;
      touched.add("budgetMax");
      return;
    }
  }

  const amounts = [
    ...findAll(t, new RegExp(String.raw`(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*${UNIT}\b`)).map((m) => {
      const parts = new RegExp(String.raw`(\d+(?:\.\d+)?)\s*${UNIT}`).exec(m.match)!;
      return { value: toRupees(parseFloat(parts[1]), parts[2]), index: m.index };
    }),
    // Plain rupee figures: "₹80,00,000" or "8000000", never followed by km.
    ...findAll(t, /(?:₹|rs\.?|inr)?\s*\b\d{6,9}\b(?!\s*(?:km|kms|kilomet))/).map((m) => ({
      value: parseInt(m.match.replace(/\D/g, ""), 10),
      index: m.index,
    })),
  ].filter((a) => a.value >= 5e5 && a.value <= 1e9);

  if (!amounts.length) return;
  const { value, index } = amounts[0];
  const before = t.slice(Math.max(0, index - 30), index);
  touched.add("budgetMax");
  prefs.budgetTarget = undefined;
  if (/(above|over|more than|at least|minimum|min\.?|starting( from| at)?|upwards of|north of)\s*$/.test(before)) {
    prefs.budgetMin = value;
    prefs.budgetMax = undefined;
  } else if (/(around|about|approx\.?|approximately|roughly|~|near|close to|ballpark)\s*$/.test(before)) {
    prefs.budgetTarget = value;
    prefs.budgetMin = value * 0.8;
    prefs.budgetMax = value * 1.15;
  } else {
    // "under 80L", "within 1 cr", or a bare figure, which people mean as a ceiling.
    prefs.budgetMax = value;
    prefs.budgetMin = undefined;
  }
}

// ---------- vocabulary ----------

const BODY_WORDS: [Body, RegExp][] = [
  ["SUV", /\b(suvs?|crossovers?|suv's)\b/],
  ["Sedan", /\b(sedans?|saloons?|limousines?|limos?)\b/],
  ["Coupe", /\b(coupes?|coupés?|two[- ]door|2[- ]door)\b/],
  ["Convertible", /\b(convertibles?|cabrio(let)?s?|roadsters?|open[- ]top|soft[- ]?top|drop[- ]?top|top down|roof down)\b/],
  ["MPV", /\b(mpvs?|minivans?|vans?|people[- ]carrier|people[- ]mover)\b/],
];

const FUEL_WORDS: [Fuel, RegExp][] = [
  ["Petrol", /\b(petrol|gasoline|gas engine)\b/],
  ["Diesel", /\b(diesels?)\b/],
  ["Electric", /\b(electric|evs?|battery[- ]powered|zero[- ]emissions?|e[- ]car)\b/],
  ["Hybrid", /\b(hybrids?)\b/],
];

const TAG_WORDS: [Tag, RegExp][] = [
  ["family", /\b(family|families|kids|children|child seat|school run|toddlers?|baby|parents and kids|wife and kids)\b/],
  ["chauffeur", /\b(chauffeur(ed)?|driver[- ]driven|back ?seat|rear seat|boss|ceo|md|executive|business|corporate|clients?|driven around)\b/],
  ["performance", /\b(fast|faster|fastest|quick|quicker|quickest|powerful|power|sporty|sportier|sports|thrill(ing)?|adrenaline|track( days?)?|speed|acceleration|0-100|zero to (hundred|100)|horsepower|bhp|hp|v8|v10|v12|loud|fun to drive|drivers? car|enthusiast|supercar|super car)\b/],
  ["offroad", /\b(off[- ]?road(ing)?|trails?|4x4|four[- ]wheel drive|coorg|chikmagalur|chikkamagaluru|ladakh|spiti|mountains?|rough roads?|adventure|camping|wading|ground clearance|rugged)\b/],
  ["city", /\b(city|traffic|parking|park easily|commut(e|ing)|daily driver|daily use|office|compact|small|nimble|everyday|indiranagar|koramangala|whitefield)\b/],
  ["highway", /\b(highways?|road ?trips?|long drives?|touring|tourer|mysore|mysuru|ooty|goa|chennai|hyderabad|cruis(e|ing)|expressway|outstation)\b/],
  ["eco", /\b(eco|green|efficient|good mileage|fuel economy|running costs?|cheap to run|sustainable|environment(al)?|emissions|save fuel)\b/],
  ["statement", /\b(statement|head[- ]?turner|turn heads|flex|show off|status|exclusive|rare|attention|wow|prestige|presence|iconic|wedding|celebrity|dream car)\b/],
  ["weekend", /\b(weekends?|sundays?|joy ?rides?|second car|toy|nandi hills|fun car)\b/],
  ["first-luxury", /\b(first luxury|first (proper |real )?luxury car|entry[- ]level|starter|step up from|upgrad(e|ing) from)\b/],
  ["reliable", /\b(reliab(le|ility)|low maintenance|trouble[- ]free|dependable|resale|holds? (its )?value|long[- ]term|bulletproof|lasts? forever|run forever)\b/],
  ["comfort", /\b(comfort(able)?|smooth|soft ride|plush|quiet|refined|air suspension|massage|relaxing|elderly|old parents|bad roads|potholes)\b/],
  ["tech", /\b(tech|technology|gadgets?|screens?|futuristic|latest features|adas|digital|connected)\b/],
  ["value", /\b(value( for money)?|affordable|cheap|budget[- ]friendly|deal|bargain|best price|economical|vfm|sensible)\b/],
  ["open-top", /\b(open[- ]top|top down|roof down|wind in (my|your) hair)\b/],
];

const COLOR_WORDS = ["black", "white", "grey", "silver", "blue", "red", "green", "yellow", "brown", "beige"];

const BRAND_ALIASES: [string, RegExp][] = [
  ["Mercedes-Benz", /\b(mercedes(-benz)?|merc|benz|amg|maybach)\b/],
  ["BMW", /\b(bmw|beemer|bimmer)\b/],
  ["Audi", /\baudi\b/],
  ["Porsche", /\bporsche\b/],
  ["Lamborghini", /\b(lamborghini|lambo)\b/],
  ["Ferrari", /\bferrari\b/],
  ["Rolls-Royce", /\b(rolls[- ]?royce|rolls)\b/],
  ["Bentley", /\bbentley\b/],
  ["Land Rover", /\b(land ?rover|range ?rover|jlr)\b/],
  ["Jaguar", /\b(jaguar|jag)\b/],
  ["Volvo", /\bvolvo\b/],
  ["Lexus", /\blexus\b/],
  ["Toyota", /\btoyota\b/],
  ["MINI", /\bmini\b(?!\s*van)/],
  ["Ford", /\bford\b/],
  ["Mahindra", /\bmahindra\b/],
];

const ORIGINS: [RegExp, string[]][] = [
  [/\bgerman\b/, ["Mercedes-Benz", "BMW", "Audi", "Porsche"]],
  [/\b(british|english)\b/, ["Land Rover", "Jaguar", "Rolls-Royce", "Bentley", "MINI"]],
  [/\bitalian\b/, ["Ferrari", "Lamborghini"]],
  [/\bjapanese\b/, ["Toyota", "Lexus"]],
  [/\b(swedish|scandinavian)\b/, ["Volvo"]],
  [/\bindian\b/, ["Mahindra"]],
  [/\bamerican\b/, ["Ford"]],
];

// Names that cover several cars in stock.
const FAMILIES: [RegExp, string, (model: string, make: string) => boolean][] = [
  [/\brange ?rovers?\b(?! velar)/, "Range Rover", (m) => m.startsWith("Range Rover")],
  [/\bs[- ]?class\b/, "S-Class", (m) => m === "S-Class"],
];

// Model words that should not count as naming a specific car on their own.
const GENERIC_MODEL_WORDS = new Set(["s-class", "range rover", "rr", "jag", "mini", "ferrari", "bentley", "rolls", "rolls royce", "lambo"]);

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Car ids named in the text, in the order they appear. */
export function findModels(t: string): string[] {
  const hits: { id: string; index: number; len: number }[] = [];
  for (const car of inventory) {
    const names = new Set([car.model.toLowerCase(), ...(car.aliases ?? [])]);
    for (const name of names) {
      if (GENERIC_MODEL_WORDS.has(name)) continue;
      const re = new RegExp(String.raw`(^|[^a-z0-9])${escape(name).replace(/[- ]/g, "[- ]?")}(?![a-z0-9])`);
      const m = re.exec(t);
      if (m) hits.push({ id: car.id, index: m.index, len: name.length });
    }
  }
  // Longest match wins where names overlap ("range rover velar" over "range rover").
  hits.sort((a, b) => a.index - b.index || b.len - a.len);
  const out: string[] = [];
  for (const h of hits) if (!out.includes(h.id)) out.push(h.id);
  return out;
}

// ---------- main ----------

export function parseMessage(raw: string): Parsed {
  const t = raw
    .toLowerCase()
    .replace(/(\d),(?=\d)/g, "$1")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  const prefs = emptyPrefs();
  const touched = new Set<keyof Prefs>();

  parseBudget(t, prefs, touched);

  for (const [body, re] of BODY_WORDS) {
    for (const hit of findAll(t, re)) {
      touched.add("bodies");
      if (!negatedAt(t, hit.index) && !prefs.bodies.includes(body)) prefs.bodies.push(body);
    }
  }
  if (/\b(sports? cars?|sportscars?|supercars?|super cars?)\b/.test(t) && !prefs.bodies.length) {
    prefs.softBodies = ["Coupe", "Convertible"];
    touched.add("softBodies");
  }

  for (const [fuel, re] of FUEL_WORDS) {
    for (const hit of findAll(t, re)) {
      if (negatedAt(t, hit.index)) {
        touched.add("excludeFuels");
        if (!prefs.excludeFuels.includes(fuel)) prefs.excludeFuels.push(fuel);
      } else {
        touched.add("fuels");
        if (!prefs.fuels.includes(fuel)) prefs.fuels.push(fuel);
      }
    }
  }

  for (const [brand, re] of BRAND_ALIASES) {
    for (const hit of findAll(t, re)) {
      if (negatedAt(t, hit.index)) {
        touched.add("excludeBrands");
        if (!prefs.excludeBrands.includes(brand)) prefs.excludeBrands.push(brand);
      } else {
        touched.add("brands");
        if (!prefs.brands.includes(brand)) prefs.brands.push(brand);
      }
    }
  }

  for (const [re, group] of ORIGINS) {
    for (const hit of findAll(t, re)) {
      if (negatedAt(t, hit.index)) {
        touched.add("excludeBrands");
        prefs.excludeBrands.push(...group.filter((b) => !prefs.excludeBrands.includes(b)));
      } else {
        touched.add("brands");
        prefs.brands.push(...group.filter((b) => !prefs.brands.includes(b)));
      }
    }
  }

  for (const [re, label, test] of FAMILIES) {
    if (re.test(t) && !/\b(velar|autobiography|defender|maybach|s ?350|s ?580|911|cayenne|taycan)\b/.test(t)) {
      const ids = inventory.filter((c) => test(c.model, c.make)).map((c) => c.id);
      prefs.family = { label, ids };
      touched.add("family");
      // "Range Rover" already implies Land Rover; don't show it twice.
      const implied = new Set(ids.map((id) => brandOf(inventory.find((c) => c.id === id)!)));
      prefs.brands = prefs.brands.filter((b) => !implied.has(b));
      if (!prefs.brands.length) touched.delete("brands");
    }
  }

  for (const [tag, re] of TAG_WORDS) {
    if (re.test(t)) {
      prefs.tags.push(tag);
      touched.add("tags");
    }
  }
  // "mileage" alone means fuel economy in India; "low mileage" means low kilometres.
  if (/\b(mileage|km\/?l|kmpl)\b/.test(t) && !/\blow (mileage|km)/.test(t) && !prefs.tags.includes("eco")) {
    prefs.tags.push("eco");
    touched.add("tags");
  }

  const seats = /(\d)\s*[- ]?(?:seater|seats?|seat)\b/.exec(t) ?? /\b(\d)\s+(?:people|persons|passengers|adults)\b/.exec(t);
  const familyOf = /\bfamily of (\d+)\b/.exec(t);
  const n = familyOf ? parseInt(familyOf[1], 10) : seats ? parseInt(seats[1], 10) : undefined;
  if (n && n >= 4 && n <= 9) {
    prefs.minSeats = n;
    touched.add("minSeats");
  } else if (/\b(big|large|joint|extended) family\b|\bthird row\b|\b3rd row\b/.test(t)) {
    prefs.minSeats = 6;
    touched.add("minSeats");
  }

  const yr = /\b(20[12]\d)\s*(?:or|and)?\s*(?:newer|later|above|onwards|\+|or after|model or newer)/.exec(t) ?? /\b(?:after|newer than|from|since)\s*(20[12]\d)\b/.exec(t);
  if (yr) {
    const y = parseInt(yr[1], 10);
    prefs.yearMin = /after|newer than/.test(yr[0]) ? y + 1 : y;
    touched.add("yearMin");
  } else if (/\b(latest|newest|nearly new|almost new|like new|brand new|recent model)\b/.test(t)) {
    prefs.yearMin = 2023;
    touched.add("yearMin");
  }

  const kmLimit = /(?:under|below|less than|within|max|upto|up to)\s*(\d+(?:\.\d+)?)\s*(k|000)?\s*(?:km|kms|kilometres|kilometers)/.exec(t);
  if (kmLimit) {
    let v = parseFloat(kmLimit[1]);
    if (kmLimit[2] === "k" || (v < 1000 && /k\s*(km|kms)/.test(kmLimit[0]))) v *= 1000;
    prefs.kmMax = v;
    touched.add("kmMax");
  } else if (/\b(low (km|kms|mileage|kilometres|kilometers)|less driven|barely driven|lightly used|hardly driven)\b/.test(t)) {
    prefs.kmMax = 20000;
    touched.add("kmMax");
  }

  for (const c of COLOR_WORDS) {
    const re = c === "grey" ? /\b(grey|gray)\b/ : new RegExp(String.raw`\b${c}\b`);
    for (const hit of findAll(t, re)) {
      if (negatedAt(t, hit.index)) {
        touched.add("excludeColors");
        if (!prefs.excludeColors.includes(c)) prefs.excludeColors.push(c);
      } else {
        touched.add("colors");
        if (!prefs.colors.includes(c)) prefs.colors.push(c);
      }
    }
  }

  let sort: SortKey | undefined;
  if (/\b(cheapest|lowest price|most affordable|least expensive|lowest budget)\b/.test(t)) sort = "price-asc";
  else if (/\b(most expensive|priciest|top[- ]end|flagship|best you('ve| have)|most luxurious)\b/.test(t)) sort = "price-desc";
  else if (/\b(fastest|quickest|most powerful|most power)\b/.test(t)) sort = "power";
  else if (/\b(newest|latest)\b/.test(t)) sort = "newest";
  else if (/\b(lowest (km|kms|mileage)|least driven)\b/.test(t)) sort = "km";
  else if (/\b(long(est)? range|most range|range anxiety|more range)\b/.test(t)) sort = "range";
  if (sort) {
    prefs.sort = sort;
    touched.add("sort");
  }

  const models = findModels(t);

  const emi = {
    downPct: (() => {
      const m = /(\d{1,2})\s*%\s*(?:down|downpayment|down payment|upfront)/.exec(t);
      return m ? parseInt(m[1], 10) : undefined;
    })(),
    months: (() => {
      const y = /(\d)\s*(?:years?|yrs?)\b/.exec(t);
      const mo = /(\d{2})\s*months?\b/.exec(t);
      return mo ? parseInt(mo[1], 10) : y ? parseInt(y[1], 10) * 12 : undefined;
    })(),
    rate: (() => {
      const m = /(\d{1,2}(?:\.\d+)?)\s*%\s*(?:interest|rate|roi|p\.?a)/.exec(t) ?? /(?:at|@)\s*(\d{1,2}(?:\.\d+)?)\s*%/.exec(t);
      return m ? parseFloat(m[1]) : undefined;
    })(),
  };

  // A brand implied by the model named ("maybach" is a Mercedes) isn't a
  // separate preference.
  const hasPrefs = [...touched].some((k) => !(k === "brands" && models.length));
  const intent = detectIntent(t, models, hasPrefs);

  return {
    text: t,
    prefs,
    touched,
    models,
    namesCar: /\b(cars?|suvs?|sedans?|saloons?|coup(e|é)s?|convertibles?|cabriolets?|roadsters?|mpvs?|minivans?|vans?|hatchbacks?|limousines?|supercars?|evs?|4x4s?)\b/.test(t),
    refines: /^(only|and|but|also|make it|what about|how about|with|without|no|not|prefer|in|maybe|actually|same|now|instead|rather|except)\b/.test(t) || /\b(instead|rather|as well|too)\b/.test(t),
    intent,
    emi,
    wantsManual: /\bmanual\b/.test(t),
    wantsHatchback: /\bhatch(back)?s?\b/.test(t),
  };
}

function detectIntent(t: string, models: string[], hasPrefs: boolean): Intent {
  if (/^(start over|reset|clear|new search|forget (it|that|everything)|begin again)\b/.test(t)) return "reset";
  if (/\b(sell|selling) (my|our)\b|\b(exchange|trade[- ]?in|part[- ]exchange|valuation|value my car|buy my car)\b/.test(t)) return "sell";
  if (/\btest[- ]?drive\b|\b(see|view|check) (it|the car|them) in person\b/.test(t)) return "test-drive";
  if (/\b(call me|call ?back|talk to (someone|a person|sales)|speak (to|with)|contact (you|sales)|reach you|phone number|whatsapp)\b/.test(t)) return "callback";
  if (/\b(emi|loan|financ(e|ing)|monthly (payment|instal?lment)|instal?lments?|down ?payment)\b/.test(t)) return "emi";
  if (/\b(compare|comparison|vs\.?|versus|difference between|which is better|better than)\b/.test(t)) return "compare";
  if (/\b(similar to|like the|like my|alternatives? to|instead of|something like|cheaper than the|rival to)\b/.test(t) && models.length) return "similar";
  if (models.length >= 2 && /\bor\b|\?|\band\b/.test(t)) return "compare";
  if (/\b(cheaper|less expensive|lower (budget|price)|too (expensive|pricey|much)|over (my )?budget|more affordable)\b/.test(t)) return "cheaper";
  if (/\b(more expensive|higher end|step up|bigger budget|more premium|fancier|something better)\b/.test(t)) return "pricier";
  if (/^(show( me)? (some )?more|see more|more|others?|other options|anything else|next|what else|any more|more options|keep going)\b/.test(t) && !/\bmore (expensive|premium|power|seats|range)\b/.test(t)) return "more";
  if (!hasPrefs && /\b(where|address|location|directions|timings?|hours|open|visit|showroom|located)\b/.test(t)) return "visit";
  if (models.length === 1 && (!hasPrefs || /\b(tell me|about|details?|specs?|how (is|good)|is the|what about|info|review|price of|interested in)\b/.test(t))) return "detail";
  if (!hasPrefs && /^(hi|hello|hey|hii+|namaste|namaskara|good (morning|afternoon|evening)|yo)\b/.test(t)) return "greeting";
  if (!hasPrefs && /\b(help|what can you do|how does this work|who are you)\b/.test(t)) return "help";
  if (hasPrefs || /\b(recommend|suggest|looking for|want|need|show me|find me|best|options)\b/.test(t)) return "recommend";
  return "unknown";
}

export function colorFamily(exterior: string) {
  // The plain colour word wins ("Mineral Grey" is grey), then evocative names.
  const e = exterior.toLowerCase().split(/ over |,/)[0];
  for (const c of ["black", "white", "grey", "silver", "blue", "red", "green", "yellow", "beige"]) if (e.includes(c)) return c;
  if (e.includes("gray")) return "grey";
  if (/obsidian|sapphire|santorini|carbon|midnight|onyx|nero/.test(e)) return "black";
  if (/polar|fuji|carrara|glacier|arctic|pearl|alpine|bianco|chalk/.test(e)) return "white";
  if (/grigio|titanium|graphite|selenite|samurai|oxide|kemora/.test(e)) return "grey";
  if (/laguna|denim|gentian|portimao|phytonic|frozen|loire|firmament/.test(e)) return "blue";
  if (/firenze|dragon|salsa|rosso/.test(e)) return "red";
  if (/giallo/.test(e)) return "yellow";
  if (/stone|sand|kalahari/.test(e)) return "beige";
  return "other";
}

export { brandOf };
