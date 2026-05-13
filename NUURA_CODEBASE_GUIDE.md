# Nuura Codebase Guide (Beginner Friendly)

Last updated: 2026-04-15

This document is a guided tour of the codebase in this workspace. It explains:

1. File structure (what’s where)
2. Which part is doing what (features → files)
3. What libraries are used, how, and why
4. Basic code concepts (Next.js + React + TypeScript) using examples from this repo

---

## 0) What you’re looking at (high-level)

Nuura is a **Next.js App Router** project:

- **Pages/UI** live in `src/app/**` (e.g. shop, checkout, admin)
- **API endpoints** live in `src/app/api/**` (server-only code)
- **Reusable UI components** live in `src/components/**`
- **Data layer** uses **MongoDB + Mongoose** (`src/lib/mongodb.ts`, `src/models/**`)
- **Cart state** is managed on the client using **Zustand** (`src/store/cartStore.ts`)
- **Animations** use **Framer Motion** and **GSAP** (used in some home components)
- **Smooth scrolling** uses **Lenis** (desktop-only) via `src/providers/SmoothScrollProvider.tsx`
- A floating **chatbot** (“Noor”) is mounted on shop pages via `src/components/chat/NuuraChatbot.tsx` and talks to `src/app/api/chat/route.ts`

If you’re new: the “mental model” is **UI (React) + API routes + DB models**.

---

## 1) Quick start (run it locally)

From the `nuura/` folder:

```bash
npm install
npm run dev
```

Then open http://localhost:3000

Common scripts (from `package.json`):

- `npm run dev` → development server
- `npm run build` → production build
- `npm run start` → start the built app
- `npm run lint` → run ESLint

---

## 2) File structure (what’s where)

### Workspace root

At the workspace root you’ll see some project assets/docs (images, notes) and the actual Next.js app inside the `nuura/` folder.

Important note: there is a `mongo.txt` in the workspace root that contains a MongoDB connection string.

- Treat it as **sensitive** (credentials).
- Prefer putting secrets in `.env.local` and never committing them.

### App folder (`nuura/`)

These files are the “project scaffolding” (build config, lint config, etc.):

- `package.json` (dependencies + scripts)
- `next.config.ts` (Next.js config)
- `tsconfig.json` (TypeScript config)
- `eslint.config.mjs` (lint rules)
- `postcss.config.mjs` (PostCSS/Tailwind pipeline)
- `components.json` (shadcn-style component tooling/config)
- `public/` (static assets)
- `src/` (application code)

### App structure (inside `nuura/src`)

This is the high-level directory tree of `src/`:

```text
src
+---app
|   +---(auth)
|   |   +---login
|   |   \---register
|   +---(shop)
|   |   +---checkout
|   |   +---order-confirmation
|   |   +---product
|   |   |   \---[slug]
|   |   \---shop
|   +---admin
|   |   +---customers
|   |   +---login
|   |   +---orders
|   |   +---products
|   |   \---settings
|   \---api
|       +---admin
|       |   +---login
|       |   +---orders
|       |   |   \---[id]
|       |   \---stats
|       +---ai-chat
|       +---chat
|       +---custom-chat
|       +---health
|       +---orders
|       \---products
|           \---[slug]
+---components
|   +---chat
|   +---home
|   +---layout
|   +---product
|   +---shared
|   +---shop
|   \---ui
+---hooks
+---lib
+---models
+---providers
+---scripts
+---store
\---types
```

### How to read this tree (App Router basics)

- A folder inside `src/app` becomes part of the URL.
  - `src/app/(shop)/shop/page.tsx` → `/shop`
  - `src/app/(shop)/checkout/page.tsx` → `/checkout`
  - `src/app/(shop)/product/[slug]/page.tsx` → `/product/<slug>`

- `page.tsx` defines what renders at a route.
- `layout.tsx` wraps routes under it.
- Route groups like `(shop)` and `(auth)` **do not appear in the URL**. They’re just for organizing code.
- `src/app/api/**/route.ts` defines server endpoints:
  - `GET`, `POST`, `PATCH`, `DELETE` functions map to HTTP methods.

---

## 3) Which part is doing what (feature map)

### Key file links (recommended)

If you prefer clicking around instead of searching, start here:

- Root layout: [src/app/layout.tsx](src/app/layout.tsx)
- Storefront layout: [src/app/(shop)/layout.tsx](src/app/%28shop%29/layout.tsx)
- Global styles/theme tokens: [src/app/globals.css](src/app/globals.css)
- Cart store (Zustand): [src/store/cartStore.ts](src/store/cartStore.ts)
- Chat UI (Noor): [src/components/chat/NuuraChatbot.tsx](src/components/chat/NuuraChatbot.tsx)
- Chat API (brain): [src/app/api/chat/route.ts](src/app/api/chat/route.ts)
- Mongo connection helper: [src/lib/mongodb.ts](src/lib/mongodb.ts)
- Product model: [src/models/Product.ts](src/models/Product.ts)
- Orders API: [src/app/api/orders/route.ts](src/app/api/orders/route.ts)

### Global entry points

- `src/app/layout.tsx`
  - The root layout applied to all pages.
  - Mounts providers:
    - `SmoothScrollProvider` (Lenis)
    - `QueryProvider` (TanStack Query)
  - Also mounts global UI:
    - `LoadingScreen`
    - `CustomCursor`

- `src/app/globals.css`
  - Tailwind v4 import: `@import "tailwindcss";`
  - Defines theme tokens via `@theme { ... }`
  - Global styles like scrollbars, cursor disable (so custom cursor works)

### The “Shop” area (public storefront)

- `src/app/(shop)/layout.tsx`
  - Wraps storefront pages with:
    - Navbar
    - Cart drawer
    - Chatbot
    - Page transition wrapper
    - Footer

- Home page: `src/app/(shop)/page.tsx`
  - A heavily animated marketing/hero page.
  - Uses mock products as fallback UI content.

- Shop catalog page: `src/app/(shop)/shop/page.tsx`
  - Server component (no `'use client'`)
  - Tries to load products from MongoDB (`connectDB` + `ProductModel.find(...)`)
  - Falls back to `MOCK_PRODUCTS` if DB fails
  - Passes the results into the client component `ShopClient`

- Product detail page: `src/app/(shop)/product/[slug]/page.tsx`
  - Dynamic route: `[slug]`
  - Fetch strategy:
    1) Tries the API route `/api/products/[slug]`
    2) Falls back to inline mock products
  - Renders:
    - `ProductImages`
    - `ProductInfo`

### Cart (client-side state)

- Store: `src/store/cartStore.ts`
  - Zustand store with:
    - `items` array
    - open/close state for the drawer
    - helpers: `addItem`, `removeItem`, `updateQuantity`, totals
  - Persistence:
    - `persist(...)` saves cart items to local storage under the key `nuura-cart`
  - Uses `immer` middleware to mutate state safely

- Hook wrapper: `src/hooks/useCart.ts`
  - Convenience hook that reads from Zustand and returns precomputed totals

- UI: `src/components/shop/CartDrawer.tsx`
  - The sliding cart UI (Framer Motion animations)
  - Reads store state and calls store actions

### Checkout + orders

- Checkout UI: `src/app/(shop)/checkout/page.tsx`
  - Client component using:
    - React Hook Form
    - Zod validation
  - Computes shipping fee using `src/lib/constants.ts`
  - Submits the order to `/api/orders`

- Order confirmation UI: `src/app/(shop)/order-confirmation/page.tsx`
  - Reads query params (`order`, `method`)
  - If payment is manual transfer, shows a WhatsApp confirmation link

- Orders API: `src/app/api/orders/route.ts`
  - `POST` creates an order in MongoDB
  - `GET` returns recent orders (used by admin pages)
  - Sends order confirmation email via Resend (non-blocking)

- Order model: `src/models/Order.ts`

- Email helper: `src/lib/email.ts`
  - Uses Resend if `RESEND_API_KEY` exists

### Products (catalog)

- Product model: `src/models/Product.ts`

- Products API:
  - `src/app/api/products/route.ts`
    - `GET` lists products (filter/sort via query params)
    - `POST` creates a product (admin usage)
  - `src/app/api/products/[slug]/route.ts`
    - `GET` returns single product
    - `PATCH` updates product
    - `DELETE` deletes product

### Chatbot (“Noor”)

This is the most important chatbot path currently used by the storefront.

- Chat UI: `src/components/chat/NuuraChatbot.tsx`
  - Mounted inside `src/app/(shop)/layout.tsx`
  - Stores chat history in `sessionStorage` (key: `nuura-noor-chat-v1`)
  - Has its own scroll container and uses `data-lenis-prevent` + event stopPropagation so Lenis doesn’t break chat scrolling
  - Calls `/api/chat` and can render:
    - plain text
    - product cards with clickable links
    - order tracking timeline
    - cart actions (open cart, go to checkout, add/remove)

- Chat API “brain”: `src/app/api/chat/route.ts`
  - Handles different intents **before** calling an LLM:
    - greetings
    - shipping/returns/payment FAQs
    - browse/search products
    - order tracking (reads orders from DB)
    - cart actions (returns an `action` object to the UI)
  - Uses the DB if available; falls back to `MOCK_PRODUCTS` if not
  - For freeform questions it calls OpenRouter (if `OPENROUTER_API_KEY` is set)
  - Adds “live catalog summary” into the system prompt so AI responses can link to real products

There are also older/experimental chat components that are currently not wired into layouts:

- `src/components/shared/NuuraChat.tsx` (talks to `/api/chat` but with a different payload)
- `src/components/shared/CustomChat.tsx` (talks to `/api/custom-chat`)
- `src/components/shared/IntelligentChat.tsx` (does local search + can show product cards)

### Admin portal

- Layout + sidebar: `src/app/admin/layout.tsx`
- Login page: `src/app/admin/login/page.tsx`
- Dashboard: `src/app/admin/page.tsx` (fetches `/api/admin/stats`)
- Orders page: `src/app/admin/orders/page.tsx`

Admin API routes:

- Login: `src/app/api/admin/login/route.ts`
  - Validates email/password against env-driven defaults
  - Returns a token (stored in `nuura-admin-token` cookie)

- Stats: `src/app/api/admin/stats/route.ts`
- Order update: `src/app/api/admin/orders/[id]/route.ts`

⚠️ Important: there is a file `src/proxy.ts` that looks like it’s meant to be middleware for protecting `/admin/*`, but Next.js only runs middleware if you have `middleware.ts` at the project root (or under `src/`). As-is, this helper is not automatically active.

---

## 4) “What things are used” (libraries) — how and why

Below are the major libraries you’ll see and the reason they exist.

### Core framework

- **Next.js** (`next`)
  - Routing + server rendering + API routes
  - App Router uses `src/app/**`

- **React** (`react`, `react-dom`)
  - Components, hooks, rendering UI

- **TypeScript**
  - Type safety, autocomplete, safer refactors
  - Path alias `@/*` points to `src/*` (configured in `tsconfig.json`)

### Styling

- **Tailwind CSS v4**
  - Utility classes for layout/spacing/typography
  - Theme tokens live in `src/app/globals.css` under `@theme { ... }`

- **Base UI** (`@base-ui/react`)
  - Headless UI primitives
  - Used for the button primitive wrapper in `src/components/ui/button.tsx`

- **clsx** + **tailwind-merge**
  - Helps build conditional className strings without duplicates
  - Used by `cn(...)` in `src/lib/utils.ts`

- **class-variance-authority (CVA)**
  - Defines reusable variant sets for components
  - Example: `src/components/ui/button.tsx`

### Animation + motion

- **Framer Motion**
  - Used across pages for animations and transitions
  - Examples: `CartDrawer`, `LoadingScreen`, home page, chatbot

- **Lenis**
  - Smooth scrolling wrapper
  - Implemented in `src/providers/SmoothScrollProvider.tsx`
  - Disabled on touch/coarse pointer/small screens and when user prefers reduced motion

- **GSAP**
  - Used in some home components (example: `src/components/home/FeaturedDrop.tsx`)

### State + data fetching

- **Zustand**
  - Lightweight client state store for cart
  - Persisted cart items via `persist`

- **Immer**
  - Enables “mutating” style updates in Zustand while remaining immutable under the hood

- **TanStack Query (React Query)**
  - Query caching and async state management
  - Set up globally in `src/providers/QueryProvider.tsx`
  - Note: many pages still use `fetch` directly; Query is available for future refactors

### Forms + validation

- **React Hook Form**
  - Handles form state and submission efficiently
  - Used in checkout

- **Zod** + **@hookform/resolvers**
  - Schema validation for forms
  - Checkout page validates input via `checkoutSchema`

### Database + server

- **MongoDB + Mongoose**
  - `connectDB()` in `src/lib/mongodb.ts` caches a connection across hot reloads
  - Models:
    - `src/models/Product.ts`
    - `src/models/Order.ts`
    - `src/models/User.ts`

### Email

- **Resend**
  - Sends the order confirmation email when `RESEND_API_KEY` is set
  - Implemented in `src/lib/email.ts`

### AI

- **OpenRouter** (used via fetch)
  - Chat endpoint calls `https://openrouter.ai/api/v1/chat/completions`
  - Controlled by `OPENROUTER_API_KEY` and optional model env vars

- **Hugging Face Inference Router**
  - Used by `src/app/api/ai-chat/route.ts`
  - This is a separate endpoint from `/api/chat` and is not what the main storefront chatbot calls right now

---

## 5) Basic code concepts (with examples from this repo)

### 5.1 Components are just functions returning JSX

A React component typically looks like:

```tsx
export default function Something() {
  return <div>Hello</div>
}
```

You can see this pattern everywhere, e.g. `src/app/(shop)/order-confirmation/page.tsx`.

### 5.2 “Server component” vs “Client component”

In Next.js App Router:

- **Server components** run on the server by default.
  - They can safely access the database and secrets.
  - Example: `src/app/(shop)/shop/page.tsx` connects to MongoDB.

- **Client components** run in the browser.
  - They can use `useState`, `useEffect`, and browser APIs (localStorage/sessionStorage).
  - They must start with:

```ts
'use client'
```

Examples:

- `src/components/chat/NuuraChatbot.tsx` (needs browser storage + event handlers)
- `src/components/shop/CartDrawer.tsx`

### 5.3 API routes (`route.ts`) are your backend endpoints

In `src/app/api/products/route.ts` you’ll see:

```ts
export async function GET(request: Request) {
  // ...
  return NextResponse.json({ products })
}
```

This creates an endpoint at `/api/products`.

### 5.4 Zustand store: “global state” without prop drilling

The cart store in `src/store/cartStore.ts` exposes functions like `addItem(product)`.

Your UI imports the store and calls actions:

- `CartDrawer` calls `updateQuantity(...)` and `removeItem(...)`
- The chatbot can trigger cart actions too (via `action` returned by `/api/chat`)

### 5.5 Mongoose models: schema + queries

The Product schema in `src/models/Product.ts` defines the shape of product documents.

Then API routes/pages can query:

- `Product.find({ inStock: true })`
- `Product.findOne({ slug })`

### 5.6 Environment variables (secrets)

The server uses environment variables like:

- `MONGODB_URI` → used by `src/lib/mongodb.ts`
- `RESEND_API_KEY` → used by `src/lib/email.ts`
- `OPENROUTER_API_KEY` → used by `src/app/api/chat/route.ts`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SECRET_KEY` → used by admin auth
- `HUGGINGFACE_TOKEN`, `HF_CHAT_MODEL` → used by `/api/ai-chat`

These should be in `.env.local` (and **never committed**).

---

## 6) The main runtime flows (end-to-end)

### 6.1 Browse products

1) User opens `/shop`
2) Server route `src/app/(shop)/shop/page.tsx` loads initial products (DB → fallback)
3) Client component `src/components/shop/ShopClient.tsx` fetches `/api/products` for fresh data
4) UI renders `ProductCard` for each product

### 6.2 Add to cart

1) User clicks “Add to cart” (from product page or chatbot)
2) UI calls `useCartStore.getState().addItem(product)` (via hook or store)
3) Cart is saved to local storage (persist middleware)
4) `CartDrawer` re-renders with updated items

### 6.3 Checkout → order creation

Mermaid flow:

```mermaid
sequenceDiagram
  participant UI as Checkout Page
  participant API as /api/orders
  participant DB as MongoDB (Mongoose)
  participant Email as Resend

  UI->>API: POST order payload
  API->>DB: connectDB()
  API->>DB: Order.create(...)
  API-->>Email: sendOrderConfirmationEmail() (async)
  API-->>UI: { success, orderNumber }
  UI->>UI: clearCart(); redirect to /order-confirmation
```

Relevant files:

- Checkout UI: `src/app/(shop)/checkout/page.tsx`
- Orders API: `src/app/api/orders/route.ts`
- Order model: `src/models/Order.ts`
- Email: `src/lib/email.ts`

### 6.4 Chatbot browsing + actions

1) Chat UI collects message + context (cart + recently viewed)
2) Calls `/api/chat`
3) API either returns:
   - products to render cards
   - an order payload to render tracking
   - an action for cart/navigation
   - or freeform AI response

The scroll area is protected from smooth-scroll interference using `data-lenis-prevent` plus wheel/touch propagation stops.

Relevant files:

- Chat UI: `src/components/chat/NuuraChatbot.tsx`
- Chat API: `src/app/api/chat/route.ts`

### 6.5 Admin login + stats

1) Admin user opens `/admin/login`
2) Login page posts credentials to `/api/admin/login`
3) API returns a token; client stores it in a cookie
4) Admin pages call `/api/admin/stats` and `/api/orders`

Relevant files:

- Admin login UI: `src/app/admin/login/page.tsx`
- Admin login API: `src/app/api/admin/login/route.ts`
- Stats API: `src/app/api/admin/stats/route.ts`

---

## 7) Where to start reading (recommended path)

If you’re new, read in this order:

1) `src/app/layout.tsx` (how the app is composed)
2) `src/app/(shop)/layout.tsx` (storefront wrappers: Navbar/Cart/Chatbot)
3) `src/store/cartStore.ts` (cart state)
4) `src/app/api/products/route.ts` + `src/models/Product.ts` (catalog API + schema)
5) `src/app/api/orders/route.ts` + `src/models/Order.ts` (checkout backend)
6) `src/components/chat/NuuraChatbot.tsx` + `src/app/api/chat/route.ts` (chat system)

---

## 8) Common edits (practical)

### Update shipping rates / WhatsApp number

- Edit `src/lib/constants.ts`:
  - `SHIPPING_RATES`
  - `FREE_SHIPPING_THRESHOLD`
  - `WHATSAPP_NUMBER`

### Update payment account numbers (JazzCash/EasyPaisa/NayaPay)

- Edit `PAYMENT_ACCOUNTS` in `src/lib/constants.ts`

### Add or edit products

Options:

- Via DB directly (recommended for real deployment)
- Via API:
  - `POST /api/products` (see `src/app/api/products/route.ts`)

### Seed the DB with sample products

There is a seeding script:

- `src/scripts/seed.ts`

It loads `.env.local` for `MONGODB_URI`.

---

## 9) Notes / mismatches to be aware of

- The “project memory” doc mentions Next.js 15, but `package.json` currently uses Next.js 16.1.6.
- Auth pages under `(auth)` are placeholders (“Coming Soon”).
- Some packages are installed but not yet used everywhere (e.g. TanStack Query is set up globally, but many pages still call `fetch` directly).

---

If you want, tell me what you want to work on next (shop UI, products/DB, admin, or chatbot) and I can point you to the exact few files to edit first.
