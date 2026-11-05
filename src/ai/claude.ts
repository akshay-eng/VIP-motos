// Optional Claude-backed Co-Driver. Used only when an API key is present
// (VITE_ANTHROPIC_API_KEY, or one pasted into the Co-Driver settings).
// Calling the API from the browser exposes the key to anyone using the page,
// so this path is for local demos; production needs a server proxy.
import Anthropic from "@anthropic-ai/sdk";
import { inventory, carTitle } from "@/data/inventory";
import { site } from "@/data/site";
import { km, ownerLabel, priceShort, LOAN_DEFAULTS } from "@/lib/format";
import type { ChatMessage, ConciergeReply, ReplyAction } from "./types";

export { ConciergeUnavailable } from "./key";
import { ConciergeUnavailable } from "./key";

const MODEL = "claude-opus-5-5";

const stockLines = inventory
  .map((c) =>
    [
      c.id,
      carTitle(c),
      priceShort(c.price),
      km(c.km),
      c.fuel,
      c.body,
      `${c.seats} seats`,
      c.drive,
      `${c.powerHp} hp`,
      `0-100 ${c.zeroTo100}s`,
      c.rangeKm ? `${c.rangeKm} km range` : null,
      c.regState,
      ownerLabel(c.owners),
      c.exterior,
      c.status === "booked" ? "BOOKED (not available)" : c.status === "new-arrival" ? "just arrived" : "available",
      `tags: ${c.tags.join(", ")}`,
      `highlights: ${c.highlights.join("; ")}`,
    ]
      .filter(Boolean)
      .join(" | "),
  )
  .join("\n");

// Kept byte-identical across requests so the prompt cache can reuse it.
const SYSTEM = `You are the Co-Driver for ${site.name}, a pre-owned luxury car showroom at ${site.address.line1}, ${site.address.line2}. You help visitors on the website find the right car from the showroom's current stock and answer questions about it.

How to answer:
- Recommend only cars from the stock list below, by their exact id. Never invent cars, prices or specs. If nothing fits, say so and suggest the nearest options or ask the team to source one.
- Booked cars are not available; mention one only if the visitor asks about it by name.
- Default to three recommendations, best fit first. Use one for a question about a specific car, two or three for a comparison.
- Give each recommendation two or three short reasons tied to what the visitor said: their budget, seats, how they will use it.
- Keep the reply to two to four sentences, warm and specific, in Indian English. Prices in Lakh and Crore, e.g. "₹96 Lakh", "₹1.45 Cr".
- For EMIs assume ${LOAN_DEFAULTS.downPct}% down, ${LOAN_DEFAULTS.rate}% a year, ${LOAN_DEFAULTS.months} months unless told otherwise, and say the bank confirms the final rate.
- Offer two to four short follow-up suggestions the visitor might tap next, written in their voice.
- Set intent to the action the visitor wants: recommend, detail, compare, emi, test_drive, callback, sell, visit, or chat.
- Showroom contact: ${site.phone}, ${site.email}. Hours: ${site.hours}. Services: ${site.services.join(", ")}.

Current stock (id | title | price | km | fuel | body | seats | drive | power | 0-100 | range | registration | owners | colour | status | tags | highlights):
${stockLines}`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "recommendations", "follow_ups", "intent"],
  properties: {
    reply: { type: "string" },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["car_id", "reasons"],
        properties: {
          car_id: { type: "string", enum: inventory.map((c) => c.id) },
          reasons: { type: "array", items: { type: "string" } },
        },
      },
    },
    follow_ups: { type: "array", items: { type: "string" } },
    intent: {
      type: "string",
      enum: ["recommend", "detail", "compare", "emi", "test_drive", "callback", "sell", "visit", "chat"],
    },
  },
} as const;

interface ClaudeAnswer {
  reply: string;
  recommendations: { car_id: string; reasons: string[] }[];
  follow_ups: string[];
  intent: string;
}


function toParams(history: ChatMessage[]): Anthropic.Beta.BetaMessageParam[] {
  return history.slice(-12).map((m) => ({
    role: m.role,
    content:
      m.role === "assistant" && m.reply?.cars.length
        ? `${m.text}\n[Shown to the visitor: ${m.reply.cars.map((c) => c.id).join(", ")}]`
        : m.text,
  }));
}

export async function askClaude(history: ChatMessage[], apiKey: string): Promise<ConciergeReply> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      messages: toParams(history),
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new ConciergeUnavailable("That API key was rejected.");
    if (err instanceof Anthropic.RateLimitError) throw new ConciergeUnavailable("Claude is rate-limited right now.");
    if (err instanceof Anthropic.APIConnectionError) throw new ConciergeUnavailable("Couldn't reach Claude.");
    if (err instanceof Anthropic.APIError) throw new ConciergeUnavailable(`Claude returned an error (${err.status}).`);
    throw err;
  }

  if (response.stop_reason === "refusal") throw new ConciergeUnavailable("Claude declined that request.");
  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text;
  if (!text) throw new ConciergeUnavailable("Claude sent an empty answer.");

  let answer: ClaudeAnswer;
  try {
    answer = JSON.parse(text) as ClaudeAnswer;
  } catch {
    throw new ConciergeUnavailable("Claude's answer was cut short.");
  }

  const valid = new Set(inventory.map((c) => c.id));
  const cars = answer.recommendations.filter((r) => valid.has(r.car_id)).slice(0, 4).map((r) => ({ id: r.car_id, reasons: r.reasons.slice(0, 3) }));
  const ids = cars.map((c) => c.id);
  const actions: ReplyAction[] = [];
  if (answer.intent === "test_drive") actions.push({ type: "callback", carId: ids[0], intent: "test-drive" });
  if (answer.intent === "callback") actions.push({ type: "callback", carId: ids[0], intent: "callback" });
  if (answer.intent === "sell") actions.push({ type: "link", to: "/sell", label: "Get an offer for your car" });
  if (answer.intent === "visit") actions.push({ type: "link", to: "/contact", label: "Directions and contact" });
  if (answer.intent === "compare" && ids.length >= 2) actions.push({ type: "compare", ids: ids.slice(0, 3) });

  return {
    text: answer.reply,
    cars,
    chips: answer.follow_ups.slice(0, 4),
    understood: [],
    actions,
    compare: answer.intent === "compare" && ids.length >= 2 ? ids.slice(0, 3) : undefined,
    source: "claude",
  };
}
