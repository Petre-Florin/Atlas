# Atlas

A modular personal operating system. Everything you want to track — goals,
habits, journal, and later career, finance, learning — lives as an
independent **Strand**: same design language, isolated data, no shared
coupling between modules. Personal, single-user, not a product for distribution.

## What's in v1

Three strands:
- **Goals** — a daily checklist that resets each day
- **Habits** — habits you define yourself, with streak counters
- **Journal** — three daily prompts: wins, mistakes, tomorrow

Everything else from the original brief (career tracking, GitHub integration,
finance dashboard, knowledge graph, AI mentor, analytics) is deliberately
**not** built yet. Add those as new strands later, once this version has
survived a few weeks of actual daily use. See "Adding a new strand" below —
the schema and layout are built so this is additive, not a rewrite.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase (Postgres + Auth).
Deploys to Vercel. Matches the stack from your income-experiment project, so
there's nothing new to learn to maintain this.

## Setup

### 1. Create a Supabase project

1. Go to supabase.com -> New project (free tier is fine).
2. Once created, open **SQL Editor** -> New query.
3. Paste the contents of `supabase/schema.sql` and run it. This creates the
   `goals`, `habits`, `habit_logs`, `journal_entries`, and `strands` tables,
   turns on Row Level Security so only you can ever read your own rows, and
   sets up a trigger that seeds your three v1 strands the moment you sign up.
4. Go to **Project Settings -> API**. Copy the **Project URL** and the
   **anon public key**.

### 2. Configure environment variables

    cp .env.local.example .env.local

Paste your Project URL and anon key into `.env.local`.

### 3. Run locally

    npm install
    npm run dev

Open `http://localhost:3000`. You'll be redirected to `/login`. Use
**Create account** with your own email and a password — this is a one-person
app, so whichever account signs up first is the only account you need.

> Note: Supabase sends a confirmation email by default. For a single-user
> personal tool you can turn this off in **Supabase -> Authentication ->
> Providers -> Email -> "Confirm email"** if you'd rather skip that step.

### 4. Deploy to Vercel

1. Push this repo to GitHub.
2. Go to vercel.com -> New Project -> import the repo.
3. Add the same two environment variables from `.env.local` in Vercel's
   project settings.
4. Deploy. You now have a private URL you can open from your phone or laptop.

## Adding a new strand later

Each strand follows the same shape:

1. Add a table in `supabase/schema.sql` (copy the pattern from `goals` —
   `user_id`, RLS policy, done).
2. Add a row to the `strands` seed in the `handle_new_user()` function.
3. Add a server action in `app/actions.ts` for its mutations.
4. Add a component in `components/` that wraps `<StrandCard>`.
5. Render it in `app/page.tsx`.

That's the whole extension pattern — nothing else in the app needs to change
when you add Career, Finance, or Knowledge strands down the line.

## Project structure

    app/
      page.tsx              # dashboard — fetches today's data, renders strands
      actions.ts             # server actions: mutate goals/habits/journal
      login/
        page.tsx             # sign in / create account
        actions.ts
    components/
      StrandCard.tsx          # shared module shell every strand renders inside
      ThreadLine.tsx           # the signature woven-thread visual
      GoalsCard.tsx
      HabitsCard.tsx
      JournalCard.tsx
    lib/supabase/
      client.ts               # browser Supabase client
      server.ts                # server Supabase client (Server Components/Actions)
    middleware.ts               # refreshes auth session, redirects logged-out users
    supabase/schema.sql          # run this once in Supabase's SQL Editor
