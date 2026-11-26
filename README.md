# OM SPACE

**Live website:** [Open OM SPACE on Netlify](https://om-space-live.netlify.app) | [Vercel Backup](https://own-space-mu.vercel.app)

OM SPACE is a real-estate discovery and management capstone project focused on Vijayawada. Customers can find and compare listings and contact agencies; agencies manage their listings and enquiries; administrators oversee users and property activity.

## What is included

- Customer, agency, and admin portals with role-aware server routes.
- Property browsing, filtering, details, saved listings, comparisons, and enquiries.
- Agency listing and enquiry workflows, plus admin management screens.
- Optional map integrations and a Gemini-powered property assistant when their API keys are configured.
- The project guide, problem statement, architecture, interview template, limitations, and review slides are kept in this repository.

See [PROJECT-GUIDE.md](./PROJECT-GUIDE.md) for the walkthrough and viva notes, [docs/problem-statement.md](./docs/problem-statement.md) for the problem and proposed solution, and [docs/limitations.md](./docs/limitations.md) for what is not complete.

## Technology

- Next.js 15 App Router and React 18
- JavaScript and CSS
- MongoDB with Mongoose
- NextAuth credentials authentication and bcryptjs password hashing
- Google Generative AI and Google Maps integrations (optional)

## Requirements

- Node.js compatible with Next.js 15
- npm
- A MongoDB instance for database-backed pages and APIs

## Setup and run

From the repository root:

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` locally. Set `MONGODB_URI`, `NEXTAUTH_URL` (for local development, `http://localhost:3000`), and a strong `NEXTAUTH_SECRET`. Set the `SEED_*_EMAIL` and `SEED_*_PASSWORD` variables if you want to create demo accounts. The Google Maps and Gemini keys are optional; map and assistant functionality depends on their respective keys.

Start the development server:

```powershell
npm run dev
```

Open `http://localhost:3000`. To seed sample users and a sample property into the configured database, run:

```powershell
npm run db:seed
```

The seed command requires the relevant `SEED_*_PASSWORD` values. It adds missing sample records and does not clear the database.

Check a production build with:

```powershell
npm run build
```

Never commit `.env`, `.eve`, credentials, or API keys. These local files and generated directories such as `node_modules` and `.next` are excluded by `.gitignore`. `.env.example` contains configuration names and placeholders, not real secrets.

## Repository map

| Path | Contents |
| --- | --- |
| `app/` | Next.js pages, layouts, and API route handlers |
| `components/` | Shared UI, forms, maps, and property components |
| `lib/` | Database connection, role/access helpers, and client comparison state |
| `models/` | Mongoose schemas |
| `scripts/` | Database seed and maintenance scripts |
| `public/images/` | Local site imagery |
| `docs/` | Problem statement, architecture, interview template, and limitations |
| `presentation/` | Capstone review presentation |

The review deck is at [presentation/OM_SPACE_Capstone_Review.pptx](./presentation/OM_SPACE_Capstone_Review.pptx). Interview notes are an evidence template only; add actual notes after conducting interviews.
