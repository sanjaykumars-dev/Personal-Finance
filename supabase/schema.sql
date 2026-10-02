-- Personal Finance Dashboard: Supabase schema
-- Run this once in Supabase → SQL Editor → New query → Run.
-- Safe to re-run: every statement is idempotent.
--
-- Every table is keyed by (user_id, id). IDs are generated in the browser,
-- and Row Level Security guarantees each user can only see and change their
-- own rows. Category integrity (no orphaned transactions/budgets) is enforced
-- by the app, which always moves records before deleting a category, so the
-- tables deliberately have no cross-table foreign keys. This lets the client
-- sync tables independently without ordering constraints.

create table if not exists public.categories (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  name       text not null check (char_length(name) between 1 and 40),
  type       text not null check (type in ('income', 'expense')),
  icon       text not null,
  -- Keeps the user's category order (and therefore chart colours) stable.
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- For databases created before `position` existed.
alter table public.categories add column if not exists position integer not null default 0;

create table if not exists public.transactions (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id          text not null,
  type        text not null check (type in ('income', 'expense')),
  description text not null check (char_length(description) between 1 and 80),
  amount      numeric(14, 2) not null check (amount > 0),
  category_id text not null,
  date        date not null,
  notes       text check (notes is null or char_length(notes) <= 200),
  created_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);

create table if not exists public.budgets (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id          text not null,
  category_id text not null,
  amount_limit numeric(14, 2) not null check (amount_limit > 0),
  month       text not null check (month ~ '^\d{4}-\d{2}$'),
  created_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.goals (
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id             text not null,
  name           text not null check (char_length(name) between 1 and 60),
  target_amount  numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null check (current_amount >= 0),
  target_date    date not null,
  created_at     timestamptz not null default now(),
  primary key (user_id, id)
);

-- One row per user. Its presence also marks the account as set up.
create table if not exists public.settings (
  user_id               uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  name                  text not null default '' check (char_length(name) <= 40),
  currency              text not null default 'INR',
  monthly_income_target numeric(14, 2) not null default 0 check (monthly_income_target >= 0),
  theme                 text not null default 'system' check (theme in ('light', 'dark', 'system')),
  updated_at            timestamptz not null default now()
);

-- Row Level Security: users can only touch their own rows.
do $$
declare
  t text;
begin
  foreach t in array array['categories', 'transactions', 'budgets', 'goals', 'settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Users manage their own rows" on public.%I', t);
    execute format(
      'create policy "Users manage their own rows" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)',
      t
    );
  end loop;
end
$$;
