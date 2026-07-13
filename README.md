# Outbreak Whitelist — Robinhood Chain

A single-page WL application site: link X → complete follow / like / RT /
quote-with-"zero" (tagging 2 friends in that same quote post) → submit
wallet. Each task's checkbox stays locked until the applicant clicks
through to the real X intent link and a few seconds pass — so it's a
genuine one-click action, not just a free checkbox. Stack matches Chill
Bugs: Next.js 14 (App Router) + NextAuth (X OAuth 2.0) + Supabase +
Vercel.

## 1. Set up Supabase

1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor.
3. Grab your Project URL, anon key, and service role key from Settings → API.

## 2. Set up X (Twitter) OAuth app

1. developer.x.com → your app → **User authentication settings** → enable
   OAuth 2.0, type "Web App".
2. Callback URL: `https://YOUR_DOMAIN/api/auth/callback/twitter`
   (and `http://localhost:3000/api/auth/callback/twitter` for local dev).
3. Copy Client ID / Client Secret into `.env.local`.

## 3. Configure env vars

```bash
cp .env.example .env.local
```

Fill in every value — branding vars (`NEXT_PUBLIC_PROJECT_NAME`,
`NEXT_PUBLIC_X_USERNAME`, `NEXT_PUBLIC_TWEET_ID`, `NEXT_PUBLIC_TWEET_URL`)
control the copy and the intent links, so update those to your actual
project handle and pinned post before launch. `NEXT_PUBLIC_TWEET_ID` is the
numeric ID at the end of the tweet's URL.

Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.
Pick any long random string for `ADMIN_SECRET` — that's the password for
`/admin`.

## 4. Run locally

```bash
npm install
npm run dev
```

## 5. Deploy

Push to GitHub, import into Vercel, paste the same env vars into the
Vercel project settings, redeploy. Update the X app's callback URL to your
production domain.

## Notes

- One application per X account and per wallet (both are unique-constrained
  in Supabase; a duplicate wallet returns a 409).
- `/admin` is a lightweight password-gated dashboard (not tied to X OAuth)
  to view and CSV-export applications — same pattern as the Chill Bugs
  admin panel.
- Verification is self-report by design (per your call) — the intent links
  make each step a real one-tap action, but nothing here calls the X API to
  confirm it happened. If you want actual API-verified follows/likes/RTs
  later, that needs a paid X API tier and I can wire it in as a v2.
- Swap `public/hero-zombie.jpeg` for your final character art whenever
  it's ready — it's just referenced by filename in `app/page.tsx`.
