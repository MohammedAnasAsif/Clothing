# Style Heaven

Full-stack storefront for **Style Heaven** ([@style_.heaven_](https://www.instagram.com/style_.heaven_/)) — satin scrunchies, eye masks, pillow covers, bows, combos and pajamas.

- **Frontend:** React 19 + Vite, React Router, Motion (animations), lucide icons. Plain CSS design system in `client/src/styles/global.css` (Bodoni Moda + Instrument Sans, with a signature script for the logo; ink on white with powder blue).
- **Backend:** Express 5 + SQLite (Node's built-in `node:sqlite`, no native builds), Zod validation, Helmet, rate limiting.
- **Shared:** `shared/` holds the types, the seed catalogue (33 products in 6 categories) and brand details and query logic used by both sides.

## Run it

Requires **Node 22.13 or newer**.

```bash
npm install
cp .env.example .env        # optional: set ADMIN_TOKEN to enable /admin
npm run dev                 # API on :4000, storefront on http://localhost:5173
```

The database is created and seeded automatically on first start (`server/data/style-heaven.db`).
Reset it with `npm run seed:reset -w server`.

### Production

```bash
npm run build               # builds client/dist
npm start                   # Express serves the API and the built site on :4000
```

### Tests

```bash
npm test                    # API tests: catalogue, filters, reviews, orders, stock, forms, admin auth
npm run typecheck
```

## GitHub Actions

- **CI** (`.github/workflows/ci.yml`) — on every push and pull request to `main`: clean install, type-check, API tests, production build (kept as a downloadable artifact for 7 days).
- **Preview** (`.github/workflows/pages.yml`) — on every push to `main`: builds the single-file static preview and publishes it to GitHub Pages at `https://mohammedanasasif.github.io/clothing/`.
  One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**, then re-run the workflow.

The Pages preview runs entirely in the browser (orders and reviews are stored locally). The full store with the database needs a Node host — see *Production* above.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Hero, marquee, tabbed product rails, Women/Men split, scroll-lit statement, slice-in editorial banner, numbered collection stories |
| `/shop`, `/category/:slug` | Sidebar filters (category, department, style, size, price, sale), sort, grid/list view, load more; filters live in the URL |
| `/product/:slug` | Gallery with click-to-zoom, colour/size/qty, size guide, description and reviews tabs (reviews post to the API), related products |
| `/cart`, `/wishlist` | Both persist in the browser between visits; cart drawer opens from anywhere |
| `/checkout` → `/order/:number` | Validated Indian address form, COD / UPI on delivery; server re-prices every line and decrements stock in a transaction |
| `/track` | Order lookup by number + email |
| `/about`, `/contact`, `/terms`, `/privacy`, 404 | Contact form stores messages; newsletter in the footer stores subscribers |
| `/admin` | Orders (change status), low stock, messages, subscribers. Needs `ADMIN_TOKEN` |

## API

```
GET  /api/categories
GET  /api/products?category=&gender=&type=&size=&q=&sale=1&min=&max=&sort=&page=&limit=
GET  /api/products/:slug                 → { product, reviews, related }
POST /api/products/:slug/reviews         { name, rating, title, body }
POST /api/orders                         { customer, payment: 'cod'|'upi', items: [{ slug, size, color, qty }] }
GET  /api/orders/:number?email=
POST /api/newsletter                     { email }
POST /api/contact                        { name, email, subject, message }
GET  /api/admin/summary                  Authorization: Bearer <ADMIN_TOKEN>
PATCH /api/admin/orders/:number          { status }
```

## Before launch

- **Photos:** product and editorial images are Unsplash placeholders (satin scrunchies, masks, bedding and swatches) — the pillow covers and colour combos in particular should be swapped for Style Heaven's own photos. They are referenced by id in `shared/catalog.ts`. Swap in your own product photography (any URL works if you change `img()` in `client/src/lib/format.ts`, and add the host to the CSP in `server/src/app.ts`).
- **Prices, stock, sizes and shipping:** placeholders. Edit prices/stock in `shared/catalog.ts`, the free-shipping threshold (₹999) and fee (₹60) in `shared/types.ts`, and the size charts in `client/src/pages/Product.tsx`.
- **Reviews:** the store starts with no reviews; customer reviews appear as they are posted.
- **Legal copy:** the Terms and Privacy pages are placeholders, including the returns policy.
- **Payments:** checkout supports cash/UPI on delivery. To take online payments, add a Razorpay or Stripe order step in `server/src/routes/orders.ts` before the order is stored.
- **Database:** SQLite is fine for a single server. For multiple instances, move the queries in `server/src` to Postgres.

## Static preview

`npm run build:preview` produces `client/dist-preview/index.html`, a single file that runs without the API (catalogue bundled in, orders and reviews kept in the browser). Useful for sharing a quick look.
