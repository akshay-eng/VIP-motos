# VIP Motors: demo website

A front-end demo for VIP Motors (est. 2010), a pre-owned luxury car showroom on Magadi Main Road, Rajajinagar, Bengaluru. Its feature set follows bigboytoyz.com (the inventory, filters, car pages and sell flow) and adds an AI Co-Driver, Spotlight-style search, a honeycomb view, swipe-to-match and dark and light themes.

React 19, Vite 8, Tailwind CSS 4, Motion, Radix primitives, React Router. No backend.

## Run it

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check and production build into dist/
```

## Live site

https://vipdemo1.pulplabs.ai

The old address, https://akshay-eng.github.io/VIP-motos/, redirects there.

Every push to `main` rebuilds and republishes it (`.github/workflows/deploy.yml`). The workflow runs `npm run build:pages`, which:

- builds for the domain root;
- copies `index.html` to `404.html`, so deep links survive a refresh;
- force-pushes `dist/` to the `gh-pages` branch that Pages serves.

`public/CNAME` holds the custom domain. The DNS record is a proxied CNAME in Cloudflare (`vipdemo1` → `akshay-eng.github.io`), and HTTPS comes from Cloudflare's edge.

## What's in it

| Page | Route | Notes |
|---|---|---|
| Home | `/` | Intro reveal, parallax hero with a big search bar, then **the whole collection**, most expensive first, in a staggered gallery with the Explore By filters; then VIP Match, sell banner and the storefront |
| VIP Match | `/match` | Tinder for cars. Swipe right to keep (saved to the shortlist), left to pass, ★ to save and book a test drive. Tap the sides of a card for more photos, the middle (or ⓘ, or ↑) for its profile: a first-person bio, interests, the basics, performance and highlights. Budget and body filters, undo, then compare or ask the Co-Driver to choose |
| Stock | `/cars` | The same full-width collection. Explore By panels for Price, Brand (logo grid), Category (body illustrations), Fuel, Year and KM Driven, each with live counts. Always sorted most expensive first; filters are kept in the URL so links can be shared |
| Car page | `/cars/:id` | Gallery with swipe, thumbnails and lightbox; specs; inspection checklist; EMI calculator; test drive, live video walkaround (WhatsApp), call back; similar cars |
| Sell | `/sell` | Three-step form with inline validation |
| Services | `/services` | Loans, insurance, warranty, exchange, doorstep test drives, detailing |
| Compare | `/compare?ids=a,b,c` | Up to three cars side by side, with the better figure in each row marked |
| Shortlist | `/shortlist` | Saved cars, kept in the browser |
| About, Contact, Credits | `/about`, `/contact`, `/credits` | Contact page embeds Google Maps and carries the FAQ |

**Search** opens from the header, the hero, ⌘K / Ctrl+K or `/` on any page, in the manner of macOS Spotlight: a frosted bar over the page with inline completion (Tab accepts it), and results only once you type, as rows with photos, filterable by Co-Driver, Cars, Brands and Body styles. A router (`src/lib/route.ts`) decides who answers. Lookups such as "urus" or "suv under 1 cr" go to the deterministic index (`src/lib/search.ts`). Questions and briefs such as "best car for Coorg trips with kids" go to the Co-Driver, whose answer and picks appear inline (Claude refines it when a key is set). A question about a named car ("is the X5 good for my family?") gets both.

The **Buy a car** menu is split by category: Brands, Budget, Body style, Fuel and Collections, each with its own pane.

On phones there is a bottom tab bar (Buy, Match, Co-Driver, Sell, Saved) and a sticky price and test-drive bar on car pages.

## The Co-Driver

The AI assistant (formerly "concierge") opens as a large modal: the conversation on the left, the cars it finds shown big on the right, with comparison and EMI tables there too. On phones it's a single full-screen column. The name is one constant, `ASSISTANT` in `src/components/concierge/ConciergePanel.tsx`, plus the copy around the site.

`src/ai/` holds the recommender. It runs in the browser with no API key:

- `parse.ts` reads a message for budget ("under 80 lakh", "1.5 cr", "around 70L", "budget no bar"), body style, brands and origins ("no German cars"), fuel, seats, colours, year, kilometres and use cases (family, chauffeur, weekend, Coorg trips, city traffic and so on). It handles negations such as "no diesel" and "not white".
- `engine.ts` merges that into the conversation so far, ranks the available stock, relaxes filters step by step when nothing fits (and says so), and writes a reply with reasons for each car. It also handles follow-ups: "cheaper", "show me more", "compare these", "something like the X5 but cheaper", "EMI for it with 30% down over 4 years", "book a test drive", showroom directions and selling a car.
- Everything it understood appears as chips the visitor can remove with one tap.

Try it from the terminal:

```sh
node scripts/try-concierge.mjs                        # built-in sample conversation
node scripts/try-concierge.mjs "suv under 80 lakh" "only petrol" "cheaper"
```

Link straight into it from anywhere, such as an Instagram bio: `https://<site>/?ask=7 seater SUV under 1 crore`.

**Optional Claude mode.** Set `VITE_ANTHROPIC_API_KEY` in `.env`, or paste a key through the key icon in the Co-Driver header, and replies come from Claude (`claude-opus-5-5`, low effort, structured JSON output, server-side refusal fallback enabled). Claude is constrained to recommend only cars in the stock list. If a call fails, the on-device engine answers instead. The SDK is loaded only when a key is set. A browser-side key is visible to anyone using the page, so before going live put a small server proxy in front of the API.

## Data

- `src/data/inventory.ts` holds 36 cars. The first five (GLE 300d, X7 40i, C 220d, Endeavour, XUV700) mirror VIP Motors' CarWale listing. The rest are representative of a Bengaluru luxury floor. Specs are manufacturer figures; prices, kilometres and registrations are illustrative.
- `src/data/site.ts` holds the business details. Address and email come from the CarWale listing, Instagram from @vipmotors.india, and the phone (97318 61111), GSTIN and founding year from the showroom signboard and logo. **Opening hours are a placeholder, and the WhatsApp number assumes the showroom phone takes WhatsApp**; confirm both.
- Leads (call back, test drive, sell form) show a confirmation but aren't sent anywhere yet. The submit handlers mark where a CRM or email call would go.

## Images

Car photos are from Wikimedia Commons under Creative Commons licences. They show the same model as each listing, not the exact car, and each one is credited on the car page and at `/credits`. Licences such as CC BY-SA require that credit, so keep it if you change the layout.

`scripts/fetch-images.mjs` downloads and resizes them (it uses macOS `sips`). Search terms and exclusions live in `scripts/image-queries.json`, and the cover order per car is set in `CURATE` in `inventory.ts`.

```sh
npm run images                                 # fetch anything missing
node scripts/fetch-images.mjs bmw-x5-40i-2022  # refetch one car
```

Replace these with the showroom's own photography when it's available: put the files in `public/cars/<car-id>/` and update the manifest.

## Brand, themes and motion

- **Logo.** `src/components/Logo.tsx` redraws the shield badge (red coupé, VIP / MOTORS / EST. 2010) as SVG, plus the signboard-style wordmark. Swap in the original artwork when you have a vector file.
- **Type.** Headings use Saira at its widest, the closest free match to the extended italic on the signboard; body text uses Geist.
- **Themes.** Dark and light, following the system until the visitor picks one with the sun/moon button (saved in the browser). Colours are semantic tokens in `src/index.css`; the red accent has a lighter text variant in dark mode so red text keeps 4.5:1 contrast.
- **Brand logos.** `src/components/BrandLogo.tsx`, from Simple Icons. Mercedes-Benz, Land Rover, Lexus and Jaguar have no free icon, so those four are simplified stand-ins; replace them with official artwork for production.
- **Motion.** An "energetic" personality (`src/lib/motion.ts`): expo curves and springs, an intro reveal once per session, masked headline reveals, the honeycomb fly-in and rearrange, a pinned horizontal Spotlight, card tilt, magnetic buttons, and page transitions through the View Transitions API, where a car's photo flies from its card into the car page (`src/components/ViewTransitions.tsx`). The theme switch is a circular reveal from the button. Everything respects reduced-motion settings; browsers without View Transitions get a quick fade.
- **Showroom photo.** `public/showroom/storefront.jpg` is a crop of a Google Maps visitor photo and is low resolution. Replace it with the showroom's own photography, or get the photographer's permission, before going live.
