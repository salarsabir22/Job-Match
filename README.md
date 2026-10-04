# JobMatch mobile

Expo app in `mobile/`. It uses the **same Supabase project** as `Job-Match` (auth, Postgres + RLS, realtime). There is no second API.

## Run

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go. Sign in with an existing JobMatch email/password.

Copy `.env.example` to `.env` if needed. Only the public URL and anon key belong here — never the service-role key.

## What’s in this first cut

- Email sign-in / sign-up against the existing users table
- Onboarding gate matching the website (student vs recruiter fields)
- Student Discover: pass / interested on live jobs (`job_swipes`)
- Recruiter Discover: shortlist students who applied (`candidate_swipes`)
- Feed, matches/pipeline, chat inbox + text thread (realtime)
- Recruiter job list (create/edit still on the website)

Google sign-in is not wired yet (needs native OAuth, not the web `/auth/callback`).
