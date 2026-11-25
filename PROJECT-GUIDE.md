# OM SPACE - Project Guide, Demo Script & Viva Notes

This document explains the OM SPACE website exactly as it exists in this folder.
Every technology, file and feature listed below is present in the source code. Nothing is assumed.

---

## 1. What OM SPACE is

OM SPACE is a **real-estate portal for Vijayawada** where people can browse properties (buy, rent, PG),
save favourites, compare homes side by side, and contact the agency that owns a listing. Agencies
publish and manage their own listings, and an administrator supervises the whole platform.

It is a **single Next.js application** with three portals inside it:

| Portal | Who uses it | Entry route |
|---|---|---|
| Customer | Buyers / renters | `/login` → `/dashboard` |
| Agency | Real-estate agencies / agents | `/agency-login` → `/agency-dashboard` |
| Admin | Platform owner | `/admin-login` → `/admin` |

Brand: **OM SPACE** (forest green, cream, champagne gold).

---

## 2. What problem it solves

Before a platform like this:

- Buyers chase brokers by phone and never get a clean side-by-side comparison.
- Agencies re-post the same listing on many sites and lose track of enquiries.
- There is no central place to see which listings are genuine, new, or sold.

OM SPACE solves this by giving **one searchable catalogue**, **one enquiry inbox per agency**,
**saved lists and comparison** for customers, and **platform-wide oversight** for the admin.

---

## 3. Why it is useful

1. **Search is locality-first** — Vijayawada users think in localities (Tadepalli, Benz Circle,
   Moghalrajpuram, Patamata…), so search matches `locality`, `title`, `description` and `property_name`.
2. **Three portals, one login system** — the same account system routes each role to the right workspace.
3. **Agency inbox** — enquiries arrive in the agency portal with a reply thread and a status
   (pending → contacted → resolved), instead of being lost in WhatsApp.
4. **Comparison and shortlist** — customers can put up to 4 homes side by side on price, area and BHK.
5. **AI assistant** — a Gemini-powered chat answers “2 BHK in Tadepalli” style questions (optional key).

---

## 4. How the app works (high level)

```
Browser (React components)
        │  fetch() / form submit
        ▼
Next.js App Router
  ├── Server-rendered pages (app/*/page.js)
  └── Route Handlers (app/api/**/route.js)   ← the "backend"
        │  Mongoose
        ▼
MongoDB (database "own_space")
```

- The **frontend** is React running inside Next.js. Pages are mostly client components
  (`"use client"`) because they use hooks, session, state, and browser APIs.
- The **backend** is the same Next.js server. Every `app/api/.../route.js` file is an HTTP endpoint.
  There is no separate Express server.
- Authentication is **NextAuth (Credentials provider)** with a **JWT session**. Passwords are hashed
  with **bcryptjs**.
- The database is **MongoDB**, accessed with **Mongoose models**.
- Server code protects the data: each sensitive endpoint calls `getServerSession(authOptions)` and then
  checks the role and ownership rules in `lib/access.js`.

---

## 5. The three portals and their purpose

### Customer portal — `/dashboard`
Tabs: **Overview, Saved properties, Comparisons, Recent searches, My enquiries, AI assistant, Profile.**
- Overview shows four counters (saved, in comparison, enquiries sent, recent searches).
- Saved properties come from `GET /api/saved-properties`.
- Comparisons use the in-memory `CompareContext` (max 4 properties, login required).
- Enquiries come from `GET /api/inquiries` (server filters to the logged-in customer).
- Profile shows/updates account details.

### Agency portal — `/agency-dashboard`
Tabs: **Overview, My listings, Add listing, Enquiries, Profile.**
- Overview: total listings, active listings, enquiries, performance.
- My listings: only listings this agency owns (`agentId` = session id or `agent` = session email).
- Add listing: form → `POST /api/properties` (agency/admin only).
- Enquiries: inbox from `GET /api/inquiries` (server matches the agency's own properties).
  Each enquiry can be **replied to** (`POST /api/inquiries/[id]/reply`) and **marked resolved** (`PATCH`).
- Edit listing: `PUT /api/properties/[id]` — ownership checked again on the server.

### Admin portal — `/admin`
Tabs: **Overview, Properties, Users, Agencies.**
- Totals: users, listings, enquiries (`GET /api/admin/stats`).
- Property management: view/delete any listing.
- User and agency management: `GET /api/admin/users`, `PATCH/DELETE /api/admin/users/[email]`.
- Agency cards show how many listings each agency owns.

---

## 6. How the portals communicate

They never talk to each other directly. They share **data**:

1. Customer sends an enquiry → row in the `inquiries` collection with `userId`, `propertyId`, `status`.
2. Agency opens its inbox → the API finds properties owned by that agency, then returns enquiries whose
   `propertyId` is in that set. The agency replies → `replies` are appended to the same document and the
   status moves to `contacted`.
3. Admin reads the same collections with no ownership filter and can moderate anything.

So the “communication” is a shared MongoDB record plus role-based filters. That is also why the same
enquiry looks different in each portal — same data, different query.

---

## 7. Frontend / backend architecture

| Layer | Files | Responsibility |
|---|---|---|
| Layout | `app/layout.js` | `SessionProvider` (NextAuth), `CompareProvider`, page transitions, chatbot, compare bar, fonts & metadata |
| Pages | `app/**/page.js` | Screens for home, listings, detail, compare, dashboards, auth, help, advertise, 404 |
| Components | `components/*.js` | Navbar, Footer, PropertyCard, forms, map, chat, counters, reveal animations |
| API (backend) | `app/api/**/route.js` | Auth, properties CRUD, saved properties, inquiries + replies, admin stats/users, registration, AI chat |
| Logic helpers | `lib/*.js` | DB connection, role normalisation, ownership/access rules, compare state, formatting constants |
| Models | `models/*.js` | `User`, `Property`, `Inquiry`, `SavedProperty` |
| Styling | `app/globals.css` | CSS variables + `.os-*` design system; responsive breakpoints; keyframes |

There is **no Tailwind** and **no animation library** in `package.json`. All animations are CSS
keyframes plus small JS helpers (`components/Reveal.js` uses `IntersectionObserver`;
`components/Counter.js` counts numbers when they scroll into view). They respect
`prefers-reduced-motion`.

---

## 8. Database and storage

**Database:** MongoDB, database name `own_space` (see `MONGODB_URI` in `.env`).
Connection is cached in `lib/mongodb.js` so hot reloads don’t open hundreds of connections.

Collections:

| Model | Key fields | Notes |
|---|---|---|
| `users` | name, email (unique), password (bcrypt hash), role, phone, company | roles: `customer`, `agency`, `admin` (legacy `buyer`/`agent` are normalised by `lib/roles.js`) |
| `properties` | title, type, price/min_price/max_price (strings), bedrooms, bathrooms, area, locality, images[], status, `agentId`, `agent`, `source`, `featured` | holds both scraped listings and manually added ones |
| `inquiries` | message, propertyId (string), userId, status, replies[] | `propertyId` is a string so it works with both ObjectId and legacy `"P89075154"` IDs |
| `savedproperties` | userId, propertyId | unique index `(userId, propertyId)` prevents duplicates |

**Storage of images:** there is **no file-upload server**. Property images are stored as **URLs** in the
`images` array (scraped listings use remote URLs, proxied through `images.weserv.nl`; manual listings can
use any image URL). Design artwork lives in `public/images/`.
**Maps:** `@vis.gl/react-google-maps` with `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (optional).
**AI:** `@google/generative-ai` with `GEMINI_API_KEY` (optional — chat returns 503 if missing).

**Secrets:** all keys live in `.env`, which is git-ignored. Never commit or share it.

---

## 9. User journeys (step by step)

### Journey A — Visitor browses and shortlists
1. Opens `/` → cinematic hero, featured properties, categories, localitites, agencies.
2. Clicks **Browse properties** → `/listings` with filters (what are you looking for, BHK, price, locality, Buy/Rent).
3. Clicks a card → `/property/[id]`: gallery, price, specs, EMI calculator, map, enquiry form.
4. Clicks the heart → redirected to `/login` if signed out; saved if a customer.
5. Clicks **Compare** on cards → compare bar appears (max 4) → `/compare` shows a feature table.
6. Sends an enquiry → row created in `inquiries`; it appears in the customer portal and agency inbox.

### Journey B — Agency publishes a listing
1. Registers at `/register` choosing “Agency” (company + phone required) or signs in at `/agency-login`.
2. `/agency-dashboard` → **Add listing** → fills the form → `POST /api/properties`.
3. Server checks the agency role, stores the listing with `agentId = session.user.id`.
4. The listing immediately appears in `/listings` and can be edited/deleted only by that agency (or admin).

### Journey C — Agency handles an enquiry
1. Opens **Enquiries** tab → sees customer name, message, property.
2. Replies → `POST /api/inquiries/[id]/reply` appends the reply and changes status to `contacted`.
3. Marks it **Resolved** → `PATCH /api/inquiries/[id]` with `{ status: "resolved" }`.
4. The customer sees the reply thread in **My enquiries**.

### Journey D — Admin oversees
1. Signs in at `/admin-login` → `/admin`.
2. Overview counters from `/api/admin/stats`.
3. Properties tab: review/delete listings. Users tab: change role/delete a user.
4. Agencies tab: see each agency and its listing count (computed from `agentId` / `agent` email).

---

## 10. Technologies actually used

From `package.json` and the source:

- **Next.js 15.5.29** (App Router, route handlers, dynamic routes, `next/dynamic`)
- **React 18** (hooks, context)
- **JavaScript** only (no TypeScript files)
- **MongoDB + Mongoose 8** (`models/*.js`, `lib/mongodb.js`)
- **NextAuth 4** credentials login + **bcryptjs** hashing
- **Google Generative AI** (`@google/generative-ai`) for the chatbot
- **@vis.gl/react-google-maps** for the satellite map
- **yet-another-react-lightbox** for the property image gallery
- **dotenv** for the seed script
- **Plain CSS** design system in `app/globals.css` (CSS variables, grid/flex, keyframes)
- **IntersectionObserver** for scroll reveals and animated counters
- **ESLint (eslint-config-next)** — build passes with no lint errors

Not used: Tailwind, Framer Motion, Redux, Express, Prisma, SQL, S3/file uploads.

---

## 11. Features and their purpose

| Feature | Route / API | Purpose |
|---|---|---|
| Home page | `/` | Brand story, featured listings, categories, localities, agencies, testimonials, newsletter |
| Property search | `/listings` + `GET /api/properties` | Filter by type, BHK, listing, price, locality, sort |
| Property detail | `/property/[id]` | Gallery, specs, EMI, street view/satellite map, enquiry form, share, save |
| Save property | `POST/DELETE/GET /api/saved-properties` | Customer shortlist (unique per user) |
| Compare | `/compare`, `lib/CompareContext.js` | Side-by-side table, max 4, price highlighted |
| Enquiries | `POST/GET /api/inquiries` | Customer → agency messaging |
| Reply / resolve | `POST /api/inquiries/[id]/reply`, `PATCH /api/inquiries/[id]` | Threaded conversation + status |
| Listing management | `POST/PUT/DELETE /api/properties` | Agency/admin create, edit, remove |
| Admin oversight | `/api/admin/stats`, `/api/admin/users` | Platform totals, user/agency moderation |
| Registration | `POST /api/register` | Customer or agency self-signup |
| Auth | NextAuth credentials, JWT | Sign-in, session, role routing |
| AI assistant | `POST /api/chat` | Gemini real-estate Q&A (optional) |
| Reviews / newsletter / help / advertise | Static pages & UI | Marketing and support |

---

## 12. Folder structure and important files

```
OM-SPACE/
├─ app/
│  ├─ layout.js                 global providers, fonts, metadata
│  ├─ globals.css               whole design system (.os-* classes, keyframes)
│  ├─ page.js                   homepage (sections A–I)
│  ├─ listings/page.js          search + filters + grid/list + map view
│  ├─ property/[id]/page.js     property detail
│  ├─ property/add/page.js      add listing form
│  ├─ property/[id]/edit/page.js edit listing form
│  ├─ compare/page.js           comparison table
│  ├─ dashboard/page.js         customer portal
│  ├─ agency-dashboard/page.js  agency portal
│  ├─ admin/page.js             admin portal
│  ├─ login, register, agency-login, admin-login, help, advertise,
│  │  contact-requests, not-found   supporting pages
│  ├─ customer-dashboard, agent-dashboard, agent-login   legacy routes (re-export/redirect)
│  └─ api/
│     ├─ auth/[...nextauth]/route.js + auth/authOptions.js
│     ├─ properties/route.js, properties/[id]/route.js
│     ├─ saved-properties/route.js
│     ├─ inquiries/route.js, inquiries/[id]/route.js, inquiries/[id]/reply/route.js
│     ├─ admin/stats/route.js, admin/users/route.js, admin/users/[email]/route.js
│     ├─ register/route.js
│     └─ chat/route.js
├─ components/                  Navbar, Footer, PropertyCard, CompareBar, Chatbot,
│                               Reveal, Counter, AuthShell, forms, map, gallery…
├─ lib/
│  ├─ mongodb.js                cached Mongoose connection
│  ├─ access.js                 ownership + identifier lookup + inquiry access
│  ├─ roles.js                  role normalisation helpers
│  ├─ constants.js              image helpers, priceLabel(), decodeListing()
│  └─ CompareContext.js         client compare state
├─ models/                      User, Property, Inquiry, SavedProperty
├─ scripts/seed-mongo.js        idempotent demo seed (users, sample property, enquiry)
├─ public/images/               local artwork and placeholders
└─ .env                         local secrets (git-ignored)
```

Important files to know for the viva:
`app/api/auth/authOptions.js` (login), `lib/access.js` (who can touch what),
`app/api/inquiries/route.js` (role-filtered inbox), `lib/CompareContext.js` (client-side compare),
`models/Property.js` (the data shape), `components/PropertyCard.js` (reused card everywhere).

---

## 13. What happens during one action (trace)

### Example: customer clicks “Save”
1. `components/PropertyCard.js` → `toggleSave()` stops the card link, checks session.
2. `POST /api/saved-properties` with `{ propertyId }`.
3. `app/api/saved-properties/route.js`: `getServerSession` → role must be `customer` → `connectDB()` →
   verify the property exists (`findPropertyByIdentifier`) → `SavedProperty.create()`.
4. The unique index returns code `11000` if it was already saved → API replies 409 → UI treats it as “saved”.
5. Customer portal later calls `GET /api/saved-properties` and resolves each property by ObjectId or legacy `id`.

### Example: agency sends a reply
1. `/agency-dashboard` → reply box → `POST /api/inquiries/[id]/reply`.
2. The route awaits `params` (Next.js 15 requires `await params`), loads the inquiry, checks the agency owns
   the related property via `canAccessInquiry`, appends the reply text and moves `pending` → `contacted`.
3. The customer’s next inbox load shows the reply in the same thread.

### Example: price shown correctly everywhere
`lib/constants.js` exports `priceLabel(value)`. It returns “Price on request” for empty values, keeps text
that already contains ₹ or ranges like “1.75 - 1.85 Cr”, and formats plain numbers with Indian digit
grouping (`₹95,00,000`). Cards, detail page, portals and the compare table all call this one function.

---

## 14. Real-world applications

- **Local property marketplaces** (like 99acres / MagicBricks, scaled down to one city).
- **Brokerage CRM** — the agency inbox is a lightweight lead manager.
- **Rental and PG discovery** for students and migrating families.
- **Municipal or co-operative housing portals** — the admin role maps to a housing society board.
- **Any multi-role marketplace** — swap “properties” for cars, equipment or services; the role/ownership
  pattern in `lib/access.js` is reusable.

---

## 15. Presentation material

### 15.1 The 60-second pitch

> “OM SPACE is a full-stack real-estate platform for Vijayawada built with Next.js, React, MongoDB and
> Mongoose. Visitors search listings by locality, BHK and budget, open a property to see photos, an EMI
> calculator and a map, then save or compare up to four homes. Customers send enquiries; agencies manage
> their own listings and reply from an inbox; the admin sees platform-wide totals and can moderate users
> and properties. Authentication is NextAuth with JWT sessions and bcrypt-hashed passwords, and every
> API route checks the role and ownership on the server. The UI is a custom forest-green and champagne-gold
> design system with CSS-only animations, fully responsive and reduced-motion friendly.”

### 15.2 Demo script (8–10 minutes)

| Time | Do this | Say this |
|---|---|---|
| 0:00 | Open `/` | “Cinematic hero, brand story, featured listings — all driven by the same API.” |
| 0:45 | Scroll home sections | Point out categories, localities, agencies, testimonials, newsletter. |
| 1:15 | Go to `/listings`, type “Tadepalli”, set 2 BHK | “Search matches locality first — that’s how Vijayawada users think.” |
| 2:00 | Open a property | Gallery, specs, EMI calculator, map, enquiry form. |
| 2:45 | Sign in as customer (`SEED_CUSTOMER_EMAIL`) | Redirect goes to `/dashboard`. |
| 3:00 | Save a property, add two to compare, open `/compare` | “The compare table highlights the cheapest price.” |
| 4:00 | Send an enquiry | “One POST creates a record the agency will see.” |
| 4:45 | Sign out, sign in at `/agency-login` | `/agency-dashboard` shows only this agency’s listings. |
| 5:15 | Open Enquiries → reply → mark resolved | “Status moves pending → contacted → resolved.” |
| 6:15 | Add a listing → it appears in `/listings` | “Server records `agentId`; only this agency can edit it.” |
| 7:00 | Sign in at `/admin-login` | Overview totals, properties, users, agencies with listing counts. |
| 8:00 | Open the AI assistant (if `GEMINI_API_KEY` set) | “Gemini answers property questions only.” |
| 8:45 | Resize to mobile | “Everything is responsive down to phone width.” |

### 15.3 Viva questions & answers

**Q: Why Next.js instead of separate React + Express?**
A: Next.js gives us pages and API route handlers in one codebase. The browser calls `/api/...` and the same
server handles it, so there is one deployment, one `.env`, and no CORS setup.

**Q: How does authentication work?**
A: NextAuth’s Credentials provider looks up the user by email, compares the password with
`bcrypt.compare`, and returns `{ id, name, email, role }`. A JWT session stores `role` and `id`. Server routes
call `getServerSession(authOptions)` on every protected request.

**Q: How do you stop an agency editing another agency’s listing?**
A: `lib/access.js → ownsProperty()` returns true only for admins or when `property.agentId` equals the
session user id, or `property.agent` equals the session email. Every edit/delete path calls it after
`await params`.

**Q: What is the difference between `id` and `_id` in properties?**
A: `_id` is MongoDB’s ObjectId. `id` is the legacy string ID from the scraped dataset (`"P89075154"`).
`findPropertyByIdentifier()` tries ObjectId first, then the string `id`, so both kinds of links work.

**Q: Why is `propertyId` a string in `Inquiry` and `SavedProperty`?**
A: Because a property can be identified by either an ObjectId or a legacy string. The APIs resolve both.

**Q: How does the compare feature work without a database table?**
A: It is client-side state in `CompareContext`, limited to four items and cleared on sign-out. `/compare`
also accepts `?ids=` to rebuild the list from the API, which makes the comparison linkable.

**Q: What protects the API besides the UI?**
A: Every sensitive handler re-checks the session and role server-side: customer-only for saves/inquiries,
agency/admin for listing writes, admin-only for user management, and ownership checks for inquiry access.
The UI hiding a button is not the security boundary.

**Q: What happens if MongoDB is down?**
A: `connectDB()` throws, the route returns a 500 JSON error, and the UI shows an error state. Data views need
the MongoDB service running and the seed script executed at least once.

**Q: Why are prices stored as strings?**
A: The scraped dataset contains ranges like “1.75 - 1.85 Cr”. Keeping strings preserves that, and
`priceLabel()` formats numbers for display. Sorting by price uses an aggregation that converts
`min_price` with `$toDouble`.

**Q: Are environment variables safe?**
A: They live in `.env`, which is git-ignored and never imported into client code except
`NEXT_PUBLIC_GOOGLE_MAPS_KEY`, which is public by design. `MONGODB_URI`, `NEXTAUTH_SECRET`,
`GEMINI_API_KEY` and seed passwords stay server-side.

**Q: What did you change in the redesign without breaking anything?**
A: Presentation only: a `.os-*` CSS design system, new navbar/footer/home/detail/dashboard layouts,
CSS animations and reveal components, plus small correctness fixes (Next.js 15 `await params`, unified price
formatting, admin listing counts, compare context fallback, reply status sync, seed idempotency). Routes,
APIs, models, auth and the three portals were preserved, and `npm run build` passes.

---

## Run commands

```bash
cd "OM-SPACE"

# 1. install
npm install

# 2. create .env (local only, never commit)
#    MONGODB_URI=mongodb://127.0.0.1:27017/own_space
#    NEXTAUTH_URL=http://localhost:3000
#    NEXTAUTH_SECRET=<a long random string>
#    GEMINI_API_KEY=<optional>
#    NEXT_PUBLIC_GOOGLE_MAPS_KEY=<optional>
#    SEED_ADMIN_PASSWORD / SEED_CUSTOMER_PASSWORD / SEED_AGENCY_PASSWORD (>= 12 chars)

# 3. seed demo data (idempotent)
npm run db:seed

# 4. develop
npm run dev          # http://localhost:3000

# 5. production check
npm run build
npm start
```

Requirements: Node.js 18+ (tested on v24), MongoDB running on `127.0.0.1:27017`.
