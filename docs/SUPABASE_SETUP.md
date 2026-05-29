# Supabase setup for Teacher Hub

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Open **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`  
     Use the base URL only, e.g. `https://abcdefgh.supabase.co`  
     **Not** the REST path (`…/rest/v1/`) — the JS client adds that automatically.
   - **Publishable / anon** key → `VITE_SUPABASE_ANON_KEY`  
     Do **not** put the **secret** key in the frontend or Netlify `VITE_*` vars.

## 2. Run the database schema

1. In Supabase, open **SQL Editor → New query**.
2. Paste and run **one file at a time** (wait for “Success” after each):
   - `supabase/schema-1-tables.sql`
   - `supabase/schema-2-trigger.sql`
   - `supabase/schema-3-rls.sql`

   Or run the full `supabase/schema.sql` in one go if it completes without timing out.

This creates profiles, teacher workspaces, join codes, join requests, student profiles, and enrollments with row-level security.

### SQL Editor timeout (`connection timeout` / `upstream connect error`)

That message is a **Supabase/network timeout**, not bad SQL. Try:

1. **Wake the project** — free projects pause when idle. Open the dashboard, click the project, wait until status is **Active** (not Paused).
2. **Use the split scripts** above (smaller queries finish faster).
3. **Retry** after 1–2 minutes, or try another network (mobile hotspot vs Wi‑Fi).
4. Check [status.supabase.com](https://status.supabase.com) for outages.
5. Confirm the project finished provisioning (new projects can take a few minutes).

**Verify tables exist:** **Table Editor** should list `profiles`, `teacher_workspaces`, `join_requests`, etc.

If part 1 succeeded but part 2 failed, only re-run the missing part(s).

## 3. Enable Google sign-in

1. **Authentication → Providers → Google** — enable and add your Google OAuth client ID/secret.
2. **Authentication → URL configuration**:
   - **Site URL**: your Netlify URL (e.g. `https://your-app.netlify.app`)
   - **Redirect URLs**: add the same URL and `http://localhost:5173` for local dev.

## 4. Email auth (optional)

Under **Authentication → Providers → Email**, leave email/password enabled. Disable “Confirm email” during testing if you want instant sign-in.

## 5. Local development

```bash
cp .env.example .env.local
# Edit .env.local with your URL and anon key
npm run dev
```

Without `.env.local`, the app falls back to **localStorage** (same browser only, no real accounts).

## 6. Netlify

In **Site configuration → Environment variables**, add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Important:** env vars are baked in at **build time**. After adding or changing them:

1. **Deploys → Trigger deploy → Deploy site** (or push a commit).

If Supabase is missing on Netlify, the live site runs in **demo mode** (localStorage): you can reach the dashboard, but **no users appear** in Supabase. A yellow banner on the landing page means demo mode is active.

### Verify Netlify is using Supabase

1. Open your Netlify URL — you should **not** see the yellow “Demo mode” banner.
2. Sign up — **Authentication → Users** in Supabase should show your email.

## How data is stored

| Data | Table |
|------|--------|
| Teacher classes, students, attendance, payments, assignments | `teacher_workspaces.workspace` (JSON) |
| Class join codes (for students) | `class_join_codes` |
| Join requests | `join_requests` |
| Student auth profile | `student_profiles` |
| Approved enrollments | `student_enrollments` |

Teachers and students sign in with **email/password** or **Google**. Students join classes with a code; teachers approve requests in the dashboard.
