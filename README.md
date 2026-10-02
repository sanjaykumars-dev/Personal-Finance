# Personal Finance Dashboard

A personal finance app for tracking income and expenses, organising them with your own categories, setting monthly budgets, saving toward goals, and seeing where your money goes.

It works in two ways:

- **Local-only (default):** no backend and no sign-up. Data is stored in the browser with `localStorage`.
- **With accounts (optional):** connect a free [Supabase](https://supabase.com) project to add sign-in and a database. Data then syncs across devices, and a guest mode still lets visitors try the app without an account.

Built with React, TypeScript, Vite, Tailwind CSS, Zustand, React Hook Form, Zod, Recharts and (optionally) Supabase.

## Screenshots

> Screenshots are not committed yet. To add them, run the app (`npm run dev`), capture the pages below in light and dark mode at desktop (1440px) and mobile (375px) widths, save them to `docs/screenshots/`, and link them here.

| Page | What to capture |
| --- | --- |
| Dashboard | Summary cards, income vs expenses chart, category donut |
| Transactions | Filters and table (desktop), card list (mobile) |
| Budgets | Cards in the on-track, near-limit and over-budget states |
| Goals | Goal cards with progress |
| Analytics | Charts, top categories and insights |
| Settings | Category manager |

## Features

**Dashboard**
- Total balance, monthly income, expenses and savings, all calculated from your transactions
- Income vs expenses for the last 6 months, and spending by category for the current month
- Recent transactions, budget usage and savings goal progress

**Transactions**
- Add, edit and delete, with validation (React Hook Form + Zod)
- Search by description, notes or category; filter by type, category and date range (presets or custom); sort by date or amount
- A table on desktop that becomes a card list on small screens
- A global **+ Add Transaction** button, available from every page

**Categories** (Settings → Categories)
- Create, rename and delete categories; choose an icon and a type (income or expense)
- Transactions and budgets store a `categoryId`, so renaming a category never breaks anything
- Deleting a category that is in use requires moving its transactions (and budgets) to another category of the same type first. Nothing is silently orphaned.
- 10 expense and 5 income categories are created on first launch

**Budgets**
- Monthly limits per expense category, with spending calculated from your transactions
- A warning state from 80% and an exceeded state past 100%
- Browse other months, and copy last month's budgets in one click

**Goals**
- Target amount, current amount and target date
- Contributions, with quick amounts and "remaining" shortcuts
- Monthly saving needed to reach each goal on time

**Analytics**
- Monthly spending (line), income vs expenses (bar) and category breakdown (donut) over 3, 6 or 12 months
- Top spending categories
- Financial insights generated from your actual data, for example a month-to-date spending comparison, savings rate, highest variable expense, budgets at risk, progress toward your income target and the next goal deadline. An insight is shown only when the data supports it.

**Accounts & sync** (optional, see [Accounts & cloud sync](#accounts--cloud-sync-optional))
- Email/password sign-up and sign-in, password reset by email, and optional Google/GitHub sign-in
- **Guest mode:** "Continue without an account" uses browser storage with sample data
- On first sign-in, choose to copy this browser's data, start with sample data, or start fresh
- Changes save automatically in the background, with a live "Saving… / All changes saved" indicator
- Offline-tolerant: failed saves retry with backoff, and you're warned before signing out or closing the tab with unsaved changes

**Settings**
- Profile: name, currency (INR by default, with lakh grouping such as ₹1,24,580) and monthly income target
- Appearance: light, dark or system
- Data management: CSV export/import of transactions, JSON backup/restore of everything, reset, and restore sample data. Destructive actions always ask for confirmation, and imports show a preview first.

## Tech stack

| Concern | Choice |
| --- | --- |
| UI | React 19, TypeScript (strict) |
| Build | Vite |
| Styling | Tailwind CSS v4 with semantic design tokens (CSS variables) for light and dark themes |
| State | Zustand, with one store per domain and `persist` middleware |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router (lazy-loaded routes) |
| Persistence | `localStorage` (guest / local-only) |
| Accounts & database | Supabase Auth + Postgres with Row Level Security (optional) |

## Architecture

```
src/
├── components/
│   ├── common/        Button, Card, Modal, ConfirmDialog, form controls, ProgressBar,
│   │                  EmptyState, StatCard, CategoryIcon, CategorySelect, Toaster
│   ├── auth/          AccountGate, account setup, sync indicator, account card
│   ├── layout/        AppLayout, Sidebar, Topbar, MobileNav
│   ├── dashboard/     SummaryCards (other dashboard widgets are shared with the pages below)
│   ├── transactions/  TransactionFormModal, filters bar, list item
│   ├── budgets/       BudgetCard, BudgetFormModal, progress rows
│   ├── goals/         GoalCard, GoalFormModal, ContributionModal
│   ├── analytics/     Recharts wrappers and a shared tooltip
│   └── settings/      Profile, Appearance, CategoryManager, DataManagement
├── pages/             One file per route
├── store/             transactionStore, categoryStore, budgetStore, goalStore,
│   │                  settingsStore, uiStore (modals/toasts) and cross-store actions
│   └── cloud/         session (auth state), sync engine, remote loading, row mappers
├── lib/               Supabase client (only created when configured)
├── hooks/             useCategories, useMoney, useTheme
├── utils/             finance maths, insights, filters, CSV, backup, dates, formatting
├── types/             Domain models
└── data/              Sample data and default categories
supabase/
└── schema.sql         Tables + Row Level Security policies
```

Key decisions:

- **IDs for relationships.** Transactions and budgets reference categories by `categoryId`. Category names are looked up when displayed (`useCategories`), so a rename updates every screen, chart and filter at once.
- **Cross-store invariants live in one place.** `store/actions.ts` owns operations that touch several stores, such as deleting a category (moving its transactions and budgets first), importing a backup and resetting. The UI cannot delete an in-use category without choosing where its records go.
- **Validated persistence.** Every store's persisted state is checked with Zod when it hydrates. A corrupted or hand-edited `localStorage` entry falls back to defaults instead of crashing the app. JSON backups are validated for both shape and relationships before they replace anything.
- **Pure calculation layer.** Totals, budget usage, goal projections and insights are plain functions in `utils/`, separate from React. Pages derive these values with `useMemo` instead of storing them.
- **Sync without touching the UI.** Pages and forms only talk to the Zustand stores. When signed in, a sync engine (`store/cloud/sync.ts`) watches the stores. After a short pause it compares the current state with what the server last confirmed and sends only the differences (upserts, then deletes) to Supabase. Account data is never written to the guest's `localStorage` keys, so the two data sets can't mix.
- **Security by the database, not the client.** The Supabase anon key ships to the browser by design. Row Level Security policies in `supabase/schema.sql` ensure every query only reaches the signed-in user's own rows.
- **Sample data relative to "today".** On first launch, six months of realistic data (32 transactions, 4 budgets, 3 goals) are generated around the current date and saved once, so a new install always looks lived-in.

## Local setup

Requires Node.js 20+.

```bash
git clone <repository>
cd personal-finance-dashboard
npm install
npm run dev
```

Then open http://localhost:5173.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run typecheck` | Run TypeScript checking (`tsc --noEmit`) |
| `npm run build` | Typecheck, then build the production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |

No environment variables are needed for local-only mode. To develop with accounts, copy `.env.example` to `.env.local` and fill it in (see below).

## Accounts & cloud sync (optional)

Without configuration the app is local-only. To add sign-in and a database:

### 1. Create a Supabase project (free)

1. Sign up at [supabase.com](https://supabase.com) and create a **New project**. Pick any name, a database password, and a region close to your users.
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This creates the tables and the security policies.
3. Open **Project Settings → API** (labelled **Data API** in some dashboards) and copy:
   - the **Project URL**
   - the **anon / publishable** key (never use the `service_role` or secret key in the frontend)

### 2. Configure authentication URLs

In **Authentication → URL Configuration**:

- **Site URL:** your production URL, e.g. `https://your-app.vercel.app`
- **Redirect URLs:** add
  - `https://your-app.vercel.app/**`
  - `http://localhost:5173/**` (for local development)

These make confirmation emails, password-reset links and OAuth sign-in return to your app.

By default, Supabase requires new users to confirm their email. You can turn this off under **Authentication → Providers → Email → Confirm email**. Note that Supabase's built-in email sender is heavily rate-limited (only a few emails per hour). That's fine for a demo; for real use, configure custom SMTP under **Authentication → Emails**.

### 3. Add environment variables

**Locally:** create `.env.local` (it's git-ignored):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

**On Vercel:** go to Project → **Settings → Environment Variables**, add the same two variables, then **Redeploy**. Vite bakes these values in at build time, so a redeploy is required.

### 4. Optional: Google / GitHub sign-in

1. Enable the provider in Supabase under **Authentication → Providers** and follow its instructions to create an OAuth app with Google or GitHub.
2. Add `VITE_AUTH_PROVIDERS=google,github` (or just one of them) to your environment variables and redeploy.

### How it behaves

- **Signed out:** the app opens on the login page, which also offers **Continue without an account** (guest mode, using browser storage).
- **First sign-in:** choose to copy this browser's data, start with sample data, or start fresh.
- **Signed in:** edits save automatically. The sidebar (and the cloud icon on mobile) shows the sync status. If saving fails or you go offline, it retries automatically, and you're warned before signing out or closing the tab with unsaved changes.
- **Signing out** removes the account data from the screen and restores this browser's guest data.

> **Free-tier notes:** Vercel's Hobby plan is for personal, non-commercial projects. Free Supabase projects **pause after about a week of inactivity**. Resume yours from the Supabase dashboard if the app reports it can't load data.

## Data and privacy

- **Guest / local-only:** data stays in your browser's `localStorage` (keys starting with `pfd:`). It's per browser and per device, and clearing site data erases it.
- **Signed in:** data is stored in your Supabase database and protected by Row Level Security, so each user can only read or write their own rows.
- To move data between browsers without an account, use **Settings → Data management → Export JSON**, then **Import JSON** on the other device.

### CSV format

```csv
date,type,description,amount,category,notes
2026-10-02,expense,Grocery Shopping,2450,Food,Weekly groceries
2026-10-01,income,Salary,67693,Salary,
```

- `date` accepts `YYYY-MM-DD` or `DD/MM/YYYY`.
- `type` is `income` or `expense`.
- Categories are matched by name and type, ignoring case. Unknown categories are created automatically.
- Invalid rows are skipped and listed before you confirm the import.

## Deploying to Vercel

The app is a static single-page app with no backend, so deployment is just a build.

1. Push the repository to GitHub, GitLab or Bitbucket.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Use these settings (they are also in `vercel.json`):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**. No environment variables are needed for local-only mode. For accounts, add the Supabase variables described above, then redeploy.

`vercel.json` includes an SPA rewrite so that loading a URL such as `/transactions`, `/budgets`, `/goals`, `/analytics` or `/settings` directly (or refreshing on it) serves `index.html` and lets React Router handle the route:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Static files in `dist/` (JavaScript, CSS, favicon) are still served directly, because Vercel only applies rewrites when no file matches the path.

You can also deploy from the command line:

```bash
npm i -g vercel
vercel --prod
```
