// Runs the on-device concierge against sample prompts and prints its replies.
//   node scripts/try-concierge.mjs                  built-in conversation
//   node scripts/try-concierge.mjs "your prompt" …  your own turns, in order
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const { respond, initialState } = await server.ssrLoadModule("/src/ai/engine.ts");
const { byId } = await server.ssrLoadModule("/src/data/inventory.ts");

const turns = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "7 seater suv for my family under 1 crore",
      "only petrol",
      "cheaper",
      "compare these",
      "something for weekend drives to coorg with the kids, under 1.2 cr, no white cars",
      "reset",
      "I want a sports car, budget no bar",
      "show me more",
      "electric luxury car with long range",
      "tell me about the g wagon",
      "emi for it with 30% down over 4 years",
      "chauffeur driven sedan for my dad around 1.5 cr, no diesel",
      "something like the X5 but cheaper",
      "compare x5 vs q7",
      "first luxury car under 50 lakh for bangalore traffic",
      "red convertible",
      "where is your showroom?",
      "I want to sell my audi",
      "manual hatchback under 10 lakh",
      "book a test drive",
    ];

let state = initialState();
for (const t of turns) {
  const { reply, state: next } = respond(t, state);
  state = next;
  console.log(`\n> ${t}`);
  console.log(`  ${reply.text}`);
  if (reply.understood.length) console.log(`  [${reply.understood.map((u) => u.label).join(" · ")}]`);
  for (const c of reply.cars) {
    const car = byId.get(c.id);
    console.log(`   - ${car.year} ${car.make} ${car.model} (${(car.price / 1e5).toFixed(1)}L): ${c.reasons.join(" | ")}`);
  }
  if (reply.compare) console.log(`   compare: ${reply.compare.join(", ")}`);
  if (reply.emi) console.log(`   emi: ${reply.emi.rows.map((r) => `${r.months}m ₹${Math.round(r.emi)}`).join(", ")}`);
  if (reply.actions.length) console.log(`   actions: ${reply.actions.map((a) => a.type + (a.label ? ":" + a.label : a.intent ? ":" + a.intent : "")).join(", ")}`);
  console.log(`   chips: ${reply.chips.join(" / ")}`);
}
await server.close();
