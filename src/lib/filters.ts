// The stock filters shared by the home page and /cars. State lives in the
// URL, so filtered views can be linked and the back button works.
import { brandOf, type CarWithImages } from "@/data/inventory";
import type { Fuel, Tag } from "@/data/types";

export type Category = "Sedan" | "SUV" | "Coupe" | "Convertible" | "MPV" | "Sports";

export const CATEGORIES: Category[] = ["Sports", "SUV", "Sedan", "Coupe", "Convertible", "MPV"];

/** Sports covers anything properly quick, whatever its body. */
export function isSports(c: CarWithImages) {
  return c.zeroTo100 < 4.6 || ((c.body === "Coupe" || c.body === "Convertible") && c.tags.includes("performance"));
}

export function inCategory(c: CarWithImages, cat: Category) {
  return cat === "Sports" ? isSports(c) : c.body === cat;
}

export const PRICES = [
  { key: "30000000-", label: "₹3 Cr and above", short: "₹3 Cr+", min: 3e7, max: Infinity, tier: 5 },
  { key: "15000000-30000000", label: "₹1.5 Cr to ₹3 Cr", short: "₹1.5–3 Cr", min: 1.5e7, max: 3e7, tier: 4 },
  { key: "10000000-15000000", label: "₹1 Cr to ₹1.5 Cr", short: "₹1–1.5 Cr", min: 1e7, max: 1.5e7, tier: 3 },
  { key: "5000000-10000000", label: "₹50 Lakh to ₹1 Cr", short: "₹50L–1 Cr", min: 5e6, max: 1e7, tier: 2 },
  { key: "0-5000000", label: "Under ₹50 Lakh", short: "Under ₹50L", min: 0, max: 5e6, tier: 1 },
];

export const YEARS = [
  { key: "2024-", label: "2024 and newer", min: 2024, max: 9999 },
  { key: "2022-2023", label: "2022 to 2023", min: 2022, max: 2023 },
  { key: "2019-2021", label: "2019 to 2021", min: 2019, max: 2021 },
  { key: "-2018", label: "2018 and older", min: 0, max: 2018 },
];

export const KMS = [
  { key: "0-10000", label: "Under 10,000 km", min: 0, max: 10000, level: 1 },
  { key: "10000-25000", label: "10,000 to 25,000 km", min: 10000, max: 25000, level: 2 },
  { key: "25000-50000", label: "25,000 to 50,000 km", min: 25000, max: 50000, level: 3 },
  { key: "50000-", label: "Over 50,000 km", min: 50000, max: Infinity, level: 4 },
];

export const FUELS: Fuel[] = ["Petrol", "Diesel", "Hybrid", "Electric"];

export interface Filters {
  q: string;
  brands: string[];
  categories: Category[];
  fuels: Fuel[];
  price: string | null;
  year: string | null;
  km: string | null;
  use: Tag | null;
  status: string | null;
}

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

/** Older links used price=min-max ranges; snap them to the nearest bucket. */
function priceKey(v: string | null) {
  if (!v) return null;
  if (PRICES.some((p) => p.key === v)) return v;
  const [min] = v.split("-").map(Number);
  return PRICES.find((p) => min >= p.min && min < p.max)?.key ?? null;
}

export function readFilters(p: URLSearchParams): Filters {
  return {
    q: p.get("q") ?? "",
    brands: list(p.get("brand")),
    categories: list(p.get("body")) as Category[],
    fuels: list(p.get("fuel")) as Fuel[],
    price: priceKey(p.get("price")),
    year: p.get("year"),
    km: p.get("km"),
    use: (p.get("use") as Tag | null) ?? null,
    status: p.get("status"),
  };
}

export type FilterKey = "brands" | "categories" | "fuels" | "price" | "year" | "km" | "use" | "status";

/** Whether a car passes every filter except, optionally, one (for facet counts). */
export function matches(c: CarWithImages, f: Filters, skip?: FilterKey) {
  if (skip !== "brands" && f.brands.length && !f.brands.includes(brandOf(c))) return false;
  if (skip !== "categories" && f.categories.length && !f.categories.some((cat) => inCategory(c, cat))) return false;
  if (skip !== "fuels" && f.fuels.length && !f.fuels.includes(c.fuel)) return false;
  if (skip !== "price" && f.price) {
    const b = PRICES.find((x) => x.key === f.price);
    if (b && (c.price < b.min || c.price >= b.max)) return false;
  }
  if (skip !== "year" && f.year) {
    const b = YEARS.find((x) => x.key === f.year);
    if (b && (c.year < b.min || c.year > b.max)) return false;
  }
  if (skip !== "km" && f.km) {
    const b = KMS.find((x) => x.key === f.km);
    if (b && (c.km < b.min || c.km >= b.max)) return false;
  }
  if (skip !== "use" && f.use && !c.tags.includes(f.use)) return false;
  if (skip !== "status" && f.status && c.status !== f.status) return false;
  return true;
}

export const byPriceDesc = (a: CarWithImages, b: CarWithImages) => b.price - a.price;

export function activeCount(f: Filters) {
  return f.brands.length + f.categories.length + f.fuels.length + [f.price, f.year, f.km, f.use, f.status].filter(Boolean).length;
}
