const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN");

/** ₹96 Lakh, ₹1.25 Cr */
export function priceShort(value: number) {
  if (value >= 1e7) return `₹${trim(value / 1e7)} Cr`;
  return `₹${trim(value / 1e5)} Lakh`;
}

/** ₹96,00,000 */
export function priceFull(value: number) {
  return inr.format(value);
}

export function km(value: number) {
  return `${num.format(value)} km`;
}

export function number(value: number) {
  return num.format(value);
}

function trim(n: number) {
  return n.toFixed(2).replace(/\.?0+$/, "");
}

export const LOAN_DEFAULTS = { downPct: 20, rate: 9.5, months: 60 };

export function emi(principal: number, annualRate = LOAN_DEFAULTS.rate, months = LOAN_DEFAULTS.months) {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

/** Monthly EMI with the default down payment, tenure and rate. */
export function emiFrom(price: number) {
  return emi(price * (1 - LOAN_DEFAULTS.downPct / 100));
}

/** "₹1.61L/mo" or "₹78k/mo": a short monthly figure for cards. */
export function emiShort(price: number) {
  const m = emiFrom(price);
  return m >= 1e5 ? `₹${(m / 1e5).toFixed(2)}L/mo` : `₹${Math.round(m / 1000)}k/mo`;
}

export function ownerLabel(n: number) {
  return n === 1 ? "1st owner" : n === 2 ? "2nd owner" : `${n}th owner`;
}
