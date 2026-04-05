# SavageAI — Route Implementation Guide

> **Status:** Phase 2 complete (Auth). Phase 3 (Chat) in planning.  
> **Last Updated:** April 5, 2026

---

## Table of Contents

1. [Route Overview](#route-overview)
2. [Routing Architecture: proxy.ts](#routing-architecture-proxyts)
3. [Page Routes](#page-routes)
   - [/ — Landing Page](#--landing-page)
   - [/login — Login Page](#login--login-page)
   - [/signup — Signup Page](#signup--signup-page)
4. [Layouts & UI Wrappers](#layouts--ui-wrappers)
   - [Root Layout](#root-layout)
   - [Auth Layout](#auth-layout)
   - [Auth Error Boundary](#auth-error-boundary)
   - [Auth Loading Skeleton](#auth-loading-skeleton)
5. [Server Actions (Form Handlers)](#server-actions-form-handlers)
   - [loginAction](#loginaction)
   - [signupAction](#signupaction)
6. [Client Form Components](#client-form-components)
   - [LoginForm](#loginform)
   - [SignupForm](#signupform)
7. [Data Access Layer (DAL)](#data-access-layer-dal)
8. [Rate Limiting](#rate-limiting)
9. [Supabase Clients](#supabase-clients)
10. [Database Schema](#database-schema)
11. [Validation Schemas (Zod)](#validation-schemas-zod)

---

## Route Overview

| URL              | Type                   | Auth Required            | File                                                                 |
| ---------------- | ---------------------- | ------------------------ | -------------------------------------------------------------------- |
| `/`              | Server Component Page  | No                       | [src/app/page.tsx](src/app/page.tsx)                                 |
| `/login`         | Server Component Page  | No (redirects if authed) | [src/app/(auth)/login/page.tsx](src/app/%28auth%29/login/page.tsx)   |
| `/signup`        | Server Component Page  | No (redirects if authed) | [src/app/(auth)/signup/page.tsx](src/app/%28auth%29/signup/page.tsx) |
| `/chat`          | 🚧 Not yet implemented | Yes                      | Phase 3                                                              |
| `/chat/[id]`     | 🚧 Not yet implemented | Yes                      | Phase 3                                                              |
| `POST /api/chat` | 🚧 Not yet implemented | Yes                      | Phase 3                                                              |

---

## Routing Architecture: proxy.ts

**File:** [src/proxy.ts](src/proxy.ts)

This is the **entry point for every request** in the app. It uses the Next.js 16 `proxy.ts` convention (replaces the deprecated `middleware.ts`).

### What it does

Before any page renders, `proxy.ts` runs and decides:

- Should this request be **redirected** to a different route?
- Is the user **authenticated or not**?

It does this using an **optimistic session check** — it reads the session cookie directly, without making any database calls. This makes it extremely fast.

### Full logic (step by step)

1. Extract the `pathname` from the incoming request URL.
2. Create a Supabase server client configured to read from cookies.
3. Call `supabase.auth.getSession()` — reads the session from the cookie only (no DB round-trip).
4. **If the user is visiting a protected route** (any path starting with `/chat`):
   - If **not authenticated** → redirect to `/login`.
5. **If the user is visiting an auth route** (`/login` or `/signup`):
   - If **already authenticated** → redirect to `/chat`.
6. Otherwise, let the request through normally.

### Matcher config

The proxy runs on all paths **except**:

- `api/*` — API routes handle their own auth
- `_next/static/*` and `_next/image/*` — static assets
- `favicon.ico`, `sitemap.xml`, `robots.txt` — metadata files

### Important notes

- This is an **optimistic check only**. If the cookie is tampered with or the session is expired, this guard can be bypassed. That is why every DAL function also calls `verifySession()` at the page/data level (defense in depth).
- If the session check throws (e.g., Supabase is down), the proxy **fails open** — it lets the request through and logs the error. The DAL layer then acts as the real enforcer.

---

## Page Routes

### `/` — Landing Page

**File:** [src/app/page.tsx](src/app/page.tsx)  
**Type:** Server Component  
**Auth:** Public

Currently a **placeholder** — shows the default Next.js "Create Next App" template with links to Vercel docs. This will be replaced with the SavageAI marketing landing page in a later phase.

---

### `/login` — Login Page

**File:** [src/app/(auth)/login/page.tsx](src/app/%28auth%29/login/page.tsx)  
**Type:** Server Component  
**Auth:** Public (redirects to `/chat` if already authenticated via proxy.ts)

A thin server wrapper that renders the `LoginForm` client component. Contains no logic of its own — all form behavior lives in `LoginForm` and `loginAction`.

**Route group:** Lives inside `(auth)/` which applies its own layout and styles.

---

### `/signup` — Signup Page

**File:** [src/app/(auth)/signup/page.tsx](src/app/%28auth%29/signup/page.tsx)  
**Type:** Server Component  
**Auth:** Public (redirects to `/chat` if already authenticated via proxy.ts)

Same pattern as `/login` — thin server wrapper that renders `SignupForm`. All logic lives in `SignupForm` and `signupAction`.

---

## Layouts & UI Wrappers

### Root Layout

**File:** [src/app/layout.tsx](src/app/layout.tsx)  
**Type:** Server Component (root layout, wraps entire app)

Sets up the global HTML document structure:

- Sets `lang="en"` on `<html>`
- Applies `className="dark"` globally — the entire app is always in dark mode
- Loads three Google Fonts via `next/font`:
  - `Inter` → `--font-sans` (body text)
  - `Space Grotesk` → `--font-heading` (headings)
  - `Geist Mono` → `--font-geist-mono` (code blocks)
- Injects font CSS variables into `<body>`
- Sets page metadata: title `"SavageAI"` with description

---

### Auth Layout

**File:** [src/app/(auth)/layout.tsx](src/app/%28auth%29/layout.tsx)  
**Type:** Server Component (wraps `/login` and `/signup`)

Renders a **two-column cinematic layout**:

- **Left column (desktop only, `hidden lg:flex`):** A decorative sidebar with SavageAI branding and three info cards:
  - "Tone" — describing the aggressive character style
  - "Accent" — describing the Bulgarian cultural flavor
  - "Result" — describing that users get real answers despite the attitude
  - Uses `Badge` from shadcn/ui and complex `oklch()` color gradients
- **Right column:** The actual form content (`{children}`) — full width on mobile, half-width on desktop
- Background: radial gradients + a CSS grid pattern overlay + a bottom fade gradient

This layout applies automatically to both `/login` and `/signup` because they are inside the `(auth)/` route group.

---

### Auth Error Boundary

**File:** [src/app/(auth)/error.tsx](src/app/%28auth%29/error.tsx)  
**Type:** Client Component (`'use client'`)

Catches any runtime error thrown inside the `(auth)/` route group (login or signup pages).

- Displays a styled dark-themed error card with a `"Auth interruption"` badge
- Shows the error message (or a generic fallback)
- Provides a **"Try again"** button that calls `reset()` to re-render the failed component
- Logs the full error to the console for debugging
- Uses shadcn `Card` components and character-grandpa color scheme (crimson accents)

---

### Auth Loading Skeleton

**File:** [src/app/(auth)/loading.tsx](src/app/%28auth%29/loading.tsx)  
**Type:** Server Component (Suspense boundary)

Shown automatically by Next.js while the auth page is loading (before the Server Component resolves). Renders a skeleton UI that mirrors the shape of the auth form using shadcn `Skeleton` components. Prevents a blank flash between navigation and form render.

---

## Server Actions (Form Handlers)

Server Actions are the **server-side handlers for form submissions**. They run entirely on the server — no API route needed. They validate input, call Supabase, and either return structured errors or trigger a redirect.

### `loginAction`

**File:** [src/features/auth/actions/auth.actions.ts](src/features/auth/actions/auth.actions.ts)  
**Directive:** `'use server'`  
**Called by:** `LoginForm` via `useActionState(loginAction, initialState)`

**Step-by-step logic:**

1. Receives `formData` from the form submission.
2. Extracts `email` and `password` from `FormData`.
3. Validates against `loginSchema` (Zod):
   - `email` must be a valid email format
   - `password` must be at least 8 characters
   - If validation fails → return `ActionState` with `fieldErrors` (per-field error messages)
4. Creates a server-side Supabase client (cookie-aware).
5. Calls `supabase.auth.signInWithPassword({ email, password })`.
6. If Supabase returns an error → return `ActionState` with `{ error: { message: "..." } }`.
7. If authentication is successful → call `redirect('/chat')`. This is a Next.js redirect — it throws internally and stops execution.

**Returns:** `ActionState = { error?: { message?: string; fieldErrors?: Record<string, string[]> }; values?: { email?: string } }`

The `values.email` is returned so the form can repopulate the email field if there's an error (UX improvement).

---

### `signupAction`

**File:** [src/features/auth/actions/signup.action.ts](src/features/auth/actions/signup.action.ts)  
**Directive:** `'use server'`  
**Called by:** `SignupForm` via `useActionState(signupAction, initialState)`

**Step-by-step logic:**

1. Extracts `name`, `email`, `password` from `FormData`.
2. Validates against `signupSchema` (Zod):
   - `name`: 2–50 characters, trimmed
   - `email`: valid email format
   - `password`: minimum 8 characters
   - If validation fails → return `ActionState` with `fieldErrors`
3. Creates a server-side Supabase client.
4. Calls `supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })`.
   - The `display_name` is passed in metadata — this triggers the `handle_new_user()` database trigger, which automatically creates a row in the `profiles` table.
5. If Supabase returns an error → return `ActionState` with error message.
6. If successful → `redirect('/chat')`.

**Side effect — database trigger:**  
When `signUp` is called, Supabase fires the `on_auth_user_created` trigger, which runs `handle_new_user()`. This function reads `display_name` from the user's metadata and inserts a new row into `public.profiles`. This means every user always has a profile row immediately after signup, with no extra code needed.

---

## Client Form Components

### LoginForm

**File:** [src/features/auth/components/login-form.tsx](src/features/auth/components/login-form.tsx)  
**Type:** Client Component (`'use client'`)

Renders the login form UI and wires it to `loginAction`.

**Key behavior:**

- Uses `useActionState(loginAction, initialState)` — a React hook that:
  - Calls `loginAction` when the form is submitted
  - Gives back `state` (the last returned `ActionState`) and `isPending` (a boolean that is `true` while the server action is running)
- **Form fields:**
  - Email input with `Mail` icon — shows field-level error if returned in `state.error.fieldErrors.email`
  - Password input with `LockKeyhole` icon — shows field-level error if returned
- **Submit button:** Shows `"Enter SavageAI"` normally, `"Entering..."` while `isPending` is true
- **General error:** If `state.error.message` exists (e.g., wrong password), shown as an alert below the form
- **Accessibility:**
  - `aria-invalid` on inputs with errors
  - `aria-describedby` linking inputs to their error messages
  - `role="alert"` on error messages so screen readers announce them

Components used: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Badge`, `Button`, `Input` from shadcn/ui; `Mail`, `LockKeyhole`, `Sparkles`, `ArrowRight` from Lucide React.

---

### SignupForm

**File:** [src/features/auth/components/signup-form.tsx](src/features/auth/components/signup-form.tsx)  
**Type:** Client Component (`'use client'`)

Same pattern as `LoginForm` but wired to `signupAction`.

**Key behavior:**

- Uses `useActionState(signupAction, initialState)`
- **Form fields:**
  - Display name input with `UserRound` icon
  - Email input with `Mail` icon
  - Password input with `LockKeyhole` icon — shows inline hint "Minimum 8 characters"
  - Confirm password input
- **Submit button:** `"Join the chaos"` / `"Joining..."` while pending
- **Color theme:** Uses character-dad orange accents (vs. character-grandpa crimson for login)

Same accessibility and error-handling patterns as `LoginForm`.

---

## Data Access Layer (DAL)

**File:** [src/lib/dal.ts](src/lib/dal.ts)  
**Directive:** `import 'server-only'` — cannot be imported from client components.

The DAL is the **single source of truth for all data access**. Every function verifies the authenticated user before doing anything. This is the real security layer — the proxy.ts is just a UX optimization.

### `verifySession()`

Verifies the current user is authenticated.

1. Creates a server Supabase client.
2. Calls `supabase.auth.getUser()` — this validates the session token against the Supabase Auth server (not just cookie-based).
3. If no user is found or an error occurs → calls `redirect('/login')`.
4. Re-throws `NEXT_REDIRECT` errors (from `redirect()`) so Next.js can handle them correctly.
5. Returns `{ userId: string; email: string }`.

All other DAL functions start by calling this.

---

### `getUser()`

Fetches the authenticated user's profile from the `profiles` table.

1. Calls `verifySession()` to get `userId`.
2. Queries `profiles` WHERE `id = userId`.
3. Returns the single profile row (`ProfileRow` type).

---

### `getConversations()`

Fetches all conversations for the authenticated user, ordered newest first.

1. Declares `'use cache'` — Next.js will cache the result until the cache tag is invalidated.
2. Calls `verifySession()` to get `userId`.
3. Sets a cache tag `conversations-{userId}` so the cache can be invalidated per-user.
4. Queries `conversations` WHERE `user_id = userId` ORDER BY `updated_at DESC`.
5. Returns the array of conversations.

The cache tag is used when a new conversation is created — calling `revalidateTag('conversations-{userId}')` will bust the cache and trigger a fresh fetch.

---

### `getMessages(conversationId)`

Fetches all messages for a specific conversation, with strict ownership verification.

1. Calls `verifySession()` to get `userId`.
2. Queries `conversations` WHERE `id = conversationId`.
3. **Ownership check:** Verifies `conversation.user_id === userId`. If the conversation belongs to a different user, throws an "Unauthorized" error. This prevents User A from accessing User B's messages even if they know the conversation ID.
4. Queries `messages` WHERE `conversation_id = conversationId` ORDER BY `created_at ASC`.
5. Returns messages in chronological order.

---

## Rate Limiting

**File:** [src/lib/ratelimit.ts](src/lib/ratelimit.ts)  
**Directive:** `import 'server-only'`  
**Backend:** Upstash Redis (serverless-safe, works on Vercel Edge)

Rate limiting is applied at the **API route level** and must always be the **first check** in any API handler — before auth, before database calls, before anything.

### Configured limiters

| Limiter                  | Limit       | Window     | Applies to               |
| ------------------------ | ----------- | ---------- | ------------------------ |
| `chatRateLimit`          | 20 requests | 10 seconds | `POST /api/chat`         |
| `authRateLimit`          | 5 requests  | 60 seconds | Auth endpoints           |
| `conversationsRateLimit` | 60 requests | 60 seconds | `GET /api/conversations` |

All limits are **per IP address**.

### `getClientIP(request)`

Extracts the real client IP from the request headers, handling proxies:

1. Checks `x-forwarded-for` header (Vercel, AWS CloudFront, other proxies)
2. Checks `x-real-ip` header (Nginx, Netlify)
3. If multiple IPs in `x-forwarded-for`, takes the first (the original client)
4. Falls back to `127.0.0.1` for local development

### `handleRateLimit(limiter, identifier)`

Checks the rate limit for a given identifier (IP address).

- If **within limit** → returns `{ success: true, headers: { "X-RateLimit-Remaining": "...", "X-RateLimit-Reset": "..." } }`
- If **exceeded** → returns `{ success: false, response: Response(429) }` with headers `Retry-After`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset`

**Usage pattern in API routes:**

```typescript
export const POST = async (req: Request): Promise<Response> => {
  // 1. Rate limit FIRST
  const ip = getClientIP(req);
  const rateLimit = await handleRateLimit(chatRateLimit, ip);
  if (!rateLimit.success) return rateLimit.response!;

  // 2. Then auth
  const session = await verifySession();

  // 3. Then validate
  const body = chatRequestSchema.safeParse(await req.json());

  // 4. Process and return with rate limit headers
  return new Response(data, { headers: { ...rateLimit.headers } });
};
```

---

## Supabase Clients

Three separate Supabase clients exist for different contexts:

### Browser Client — [src/lib/supabase/client.ts](src/lib/supabase/client.ts)

Created with `createBrowserClient<Database>(url, publishableKey)`.  
Uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the new `sb_publishable_...` format — safer than the legacy anon key).  
Used in Client Components that need direct Supabase access (e.g., future TanStack Query hooks).

### Server Client — [src/lib/supabase/server.ts](src/lib/supabase/server.ts)

Marked `server-only`. Created with `createServerClient<Database>(url, key, { cookies })`.  
Reads and writes session cookies automatically:

- `cookies.getAll()` — reads cookies from the incoming Next.js request
- `cookies.setAll()` — writes cookies to the response (gracefully skips if in a read-only Server Component context)

Used by: Server Actions, DAL functions, API routes.

### Admin Client — [src/lib/supabase/admin.ts](src/lib/supabase/admin.ts)

Marked `server-only`. Created with `createClient<Database>(url, serviceRoleKey)`.  
Uses `SUPABASE_SERVICE_ROLE_KEY` — this key **bypasses all RLS policies**.  
Auto-refresh and session persistence are disabled (admin doesn't have a user session).  
**Never expose the service role key to the browser.**  
Used for admin operations, migrations, and bulk database operations that need to bypass RLS.

---

## Database Schema

**File:** [supabase/migrations/20260405000000_initial_schema.sql](supabase/migrations/20260405000000_initial_schema.sql)

### `profiles` table

Extends Supabase's built-in `auth.users` with app-specific data.

| Column                | Type        | Notes                                                    |
| --------------------- | ----------- | -------------------------------------------------------- |
| `id`                  | UUID        | Primary key, references `auth.users(id)`, CASCADE delete |
| `display_name`        | TEXT        | User's chosen display name                               |
| `avatar_url`          | TEXT        | Optional avatar image URL                                |
| `preferred_character` | TEXT        | Default: `'angry-grandpa'`                               |
| `created_at`          | TIMESTAMPTZ | Auto-set on insert                                       |
| `updated_at`          | TIMESTAMPTZ | Auto-set on insert                                       |

**RLS:** Users can SELECT and UPDATE only their own row. INSERT is handled by the trigger.

---

### `conversations` table

One row per chat session between a user and a character.

| Column         | Type        | Notes                                         |
| -------------- | ----------- | --------------------------------------------- |
| `id`           | UUID        | Primary key, auto-generated                   |
| `user_id`      | UUID        | References `profiles(id)`, CASCADE delete     |
| `character_id` | TEXT        | e.g. `'angry-grandpa'`, `'balkan-dad'`        |
| `title`        | TEXT        | Auto-generated or user-set conversation title |
| `created_at`   | TIMESTAMPTZ | Auto-set                                      |
| `updated_at`   | TIMESTAMPTZ | Auto-set                                      |

**Indexes:** `idx_conversations_user_id` for fast lookups by user.  
**RLS:** Users can SELECT, INSERT, UPDATE, DELETE only their own conversations.

---

### `messages` table

Individual messages within a conversation.

| Column            | Type        | Notes                                             |
| ----------------- | ----------- | ------------------------------------------------- |
| `id`              | UUID        | Primary key, auto-generated                       |
| `conversation_id` | UUID        | References `conversations(id)`, CASCADE delete    |
| `role`            | TEXT        | `CHECK (role IN ('user', 'assistant', 'system'))` |
| `content`         | TEXT        | The message text                                  |
| `model`           | TEXT        | Which AI model generated this (for analytics)     |
| `created_at`      | TIMESTAMPTZ | Auto-set                                          |

**Indexes:** `idx_messages_conversation_id`, `idx_messages_created_at`.  
**RLS:** Users can SELECT and INSERT messages only for conversations they own. The policy checks:

```sql
conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
```

---

### Database trigger: `on_auth_user_created`

When a new user signs up via Supabase Auth, the `handle_new_user()` trigger fires automatically:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

- Reads `display_name` from the metadata passed by `signupAction`.
- `SECURITY DEFINER` allows the trigger to insert into `profiles` even though no user session exists yet at that moment.
- This is why `getUser()` in the DAL can always expect a profile to exist for a logged-in user.

---

## Validation Schemas (Zod)

**File:** [src/features/auth/schemas/auth.schema.ts](src/features/auth/schemas/auth.schema.ts)

### `loginSchema`

```typescript
{
  email: z.string().email(); // must be valid email format
  password: z.string().min(8); // minimum 8 characters
}
```

Exported type: `LoginInput`

### `signupSchema`

```typescript
{
  name: z.string().min(2).max(50).trim(); // 2–50 chars, whitespace stripped
  email: z.string().email();
  password: z.string().min(8);
}
```

Exported type: `SignupInput`

Both schemas are used in their respective server actions via `.safeParse(data)` — this returns a `Result` object instead of throwing, allowing the action to return structured `fieldErrors` back to the form.
