# Personal Finance Dashboard

A personal finance app that runs entirely in the browser. Track income and expenses, organise them with your own categories, set monthly budgets, save toward goals, and see where your money goes. There is no backend and no sign-up: data is stored locally in your browser with `localStorage`.

Built with React, TypeScript, Vite, Tailwind CSS, Zustand, React Hook Form, Zod and Recharts.

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
| Persistence | `localStorage` |

## Architecture

```
src/
├── components/
│   ├── common/        Button, Card, Modal, ConfirmDialog, form controls, ProgressBar,
│   │                  EmptyState, StatCard, CategoryIcon, CategorySelect, Toaster
│   ├── layout/        AppLayout, Sidebar, Topbar, MobileNav
│   ├── dashboard/     SummaryCards (other dashboard widgets are shared with the pages below)
│   ├── transactions/  TransactionFormModal, filters bar, list item
│   ├── budgets/       BudgetCard, BudgetFormModal, progress rows
│   ├── goals/         GoalCard, GoalFormModal, ContributionModal
│   ├── analytics/     Recharts wrappers and a shared tooltip
│   └── settings/      Profile, Appearance, CategoryManager, DataManagement
├── pages/             One file per route
├── store/             transactionStore, categoryStore, budgetStore, goalStore,
│                      settingsStore, uiStore (modals/toasts) and cross-store actions
├── hooks/             useCategories, useMoney, useTheme
├── utils/             finance maths, insights, filters, CSV, backup, dates, formatting
├── types/             Domain models
└── data/              Sample data and default categories
```

Key decisions:

- **IDs for relationships.** Transactions and budgets reference categories by `categoryId`. Category names are looked up when displayed (`useCategories`), so a rename updates every screen, chart and filter at once.
- **Cross-store invariants live in one place.** `store/actions.ts` owns operations that touch several stores, such as deleting a category (moving its transactions and budgets first), importing a backup and resetting. The UI cannot delete an in-use category without choosing where its records go.
- **Validated persistence.** Every store's persisted state is checked with Zod when it hydrates. A corrupted or hand-edited `localStorage` entry falls back to defaults instead of crashing the app. JSON backups are validated for both shape and relationships before they replace anything.
- **Pure calculation layer.** Totals, budget usage, goal projections and insights are plain functions in `utils/`, separate from React. Pages derive these values with `useMemo` instead of storing them.
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

No environment variables are needed.

## Data and privacy

All data lives in your browser's `localStorage`, under the keys `pfd:transactions`, `pfd:categories`, `pfd:budgets`, `pfd:goals` and `pfd:settings`. Nothing is sent to a server. As a result:

- Data is per browser and per device. Clearing site data erases it.
- To move data between browsers, use **Settings → Data management → Export JSON**, then **Import JSON** on the other device.

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
4. Click **Deploy**. No environment variables are needed.

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
