# SavageAI Implementation Plan

## TL;DR

SavageAI е multi-agent AI чат приложение с "токсични" характери. MVP: Next.js 16.2 + Supabase Auth + OpenRouter API + 2 характера + streaming chat. RAG, TTS, images — по-късно.

## Tech Stack (Confirmed)

- Next.js 16.2+ (App Router, Turbopack, proxy.ts)
- TailwindCSS + shadcn/ui
- Supabase (Auth + PostgreSQL + pgvector за бъдещ RAG)
- OpenRouter API (multi-model routing)
- Vercel deployment
- npm package manager

---

## Phase 0: Copilot Configuration & Rules

- [x] **Step 0.1: Create `.github/copilot-instructions.md`** ✅ DONE
      Rules covering:
  - **Next.js 16.2 conventions**: App Router, `proxy.ts` (NOT middleware.ts), async `params`/`searchParams` (Promise-based), `PageProps`/`LayoutProps` helpers, `use cache` directive, Turbopack default bundler
  - **React 19+ patterns**: `useActionState` for forms, `useFormStatus`, Server Actions with `'use server'`, Server Components default
  - **Security**: proxy.ts for optimistic auth checks only (no DB calls in proxy), DAL pattern for data access, `server-only` imports, validate in Server Actions, never expose API keys, httpOnly cookies, Zod validation on all inputs
  - **Code style**: Arrow functions for all components (`const X = () => {}`), no `type any`, modular file structure, `@/` path aliases, explicit return types on exported functions
  - **Imports**: `'use client'` only when needed, prefer Server Components, `import 'server-only'` for server-only modules
  - **File conventions**: `proxy.ts` for auth redirects, `forbidden.ts`/`unauthorized.ts` for auth errors, `loading.tsx` for Suspense, `error.tsx` for error boundaries

- [x] **Step 0.2: Create `AGENTS.md` (root)** ✅ DONE
      Project overview, architecture decisions, file structure map, key patterns for AI agents.

- [x] **Step 0.3: Create `.vscode/settings.json`** ✅ DONE
      TypeScript workspace version, format on save, Tailwind intellisense.

- [x] **Step 0.4: Create `.coderabbit.yaml` (CodeRabbit config)** ✅ DONE
      CodeRabbit PR review config with path-specific instructions based on project rules:
  - ✅ TypeScript style: arrow functions, no `any`, explicit return types, `@/` imports
  - ✅ Security: `server-only` enforcement, RLS checks, no API key leaks, Zod validation everywhere
  - ✅ Architecture: feature-based isolation, Server Components default, DAL ownership checks
  - ✅ Auth: proxy.ts cookie-only checks, Server Actions validation, Supabase publishable key format
  - ✅ Chat: streaming patterns, optimistic UI, markdown XSS prevention, `after()` for DB writes
  - ✅ Database: RLS policies required, indexes on foreign keys, SQL migration rules

---

## Phase 1: Project Scaffolding

- [x] **Step 1.1: Initialize Next.js project** ✅ DONE

  ```
  npx create-next-app@latest savageai --yes
  ```

  With: TypeScript, Tailwind CSS, ESLint, App Router, Turbopack, `src/` directory, AGENTS.md, `@/*` import alias.

- [x] **Step 1.2: Install core dependencies** ✅ DONE
  - `@supabase/supabase-js`, `@supabase/ssr` ✅ INSTALLED
  - `@tanstack/react-query`, `@tanstack/react-query-devtools` ✅ INSTALLED
  - `shadcn` (init + core components: button, input, card, dialog, avatar, scroll-area, dropdown-menu, sheet, skeleton, badge) ✅ INSTALLED
  - `zod` (validation) ✅ INSTALLED
  - `lucide-react` (icons) ✅ INSTALLED
  - `sonner` (toast notifications) ✅ INSTALLED

- [x] **Step 1.3: Configure environment variables** ✅ DONE
      Create `.env.local` with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new format: `sb_publishable_...`, not legacy anon key)
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only, keep secret)
  - `OPENROUTER_API_KEY`

  Create `.env.example` with placeholders for documentation. ✅ DONE

- [x] **Step 1.4: Set up project folder structure** ✅ DONE

  ```
  src/
  ├── app/                          # Next.js routes ONLY (no business logic)
  │   ├── (auth)/
  │   │   ├── login/page.tsx
  │   │   ├── signup/page.tsx
  │   │   └── layout.tsx
  │   ├── (main)/
  │   │   ├── chat/page.tsx         # /chat → new chat / conversation list
  │   │   ├── chat/[id]/page.tsx    # /chat/:id → specific conversation
  │   │   ├── characters/page.tsx
  │   │   └── layout.tsx
  │   ├── api/
  │   │   └── chat/route.ts         # POST /api/chat (OpenRouter streaming)
  │   ├── layout.tsx                # Root layout
  │   ├── page.tsx                  # / → landing page
  │   ├── proxy.ts                  # Auth routing (Next.js 16)
  │   ├── error.tsx
  │   ├── not-found.tsx
  │   └── loading.tsx
  │
  ├── features/                     # Feature-based business logic
  │   ├── auth/
  │   │   ├── components/           # login-form, signup-form
  │   │   ├── actions/              # loginAction, signupAction, logoutAction
  │   │   └── schemas/              # Zod validation schemas
  │   ├── chat/
  │   │   ├── components/           # chat-message, chat-input, chat-container, chat-sidebar
  │   │   ├── hooks/                # use-chat.ts (streaming, state)
  │   │   └── api/                  # OpenRouter client + types
  │   ├── characters/
  │   │   ├── components/           # character-card, character-selector
  │   │   ├── hooks/                # use-characters.ts
  │   │   └── data/                 # characters.ts, system prompts
  │   ├── rag/                      # Phase 6 - RAG / Personalized context
  │   ├── tts/                      # Phase 7 - Text to Speech
  │   └── image-gen/                # Phase 8 - Image Generation
  │
  ├── components/
  │   ├── ui/                       # shadcn (auto-generated, stays here)
  │   └── layout/                   # header.tsx, sidebar.tsx, theme-provider.tsx
  │
  ├── lib/
  │   ├── supabase/                 # client.ts, server.ts, admin.ts
  │   ├── openrouter/               # client.ts, types.ts (server-only)
  │   ├── dal.ts                    # Data Access Layer
  │   └── utils.ts                  # cn(), formatDate(), etc.
  │
  ├── types/                        # Global TypeScript types
  │   ├── database.ts               # Supabase generated types
  │   ├── chat.ts                   # Message, Conversation types
  │   └── character.ts              # Character interface
  │
  └── hooks/                        # Shared hooks (across features)
  ```

- [x] **Step 1.5: Configure `next.config.ts`** ✅ DONE
  - ✅ `reactCompiler: true` (already enabled by create-next-app)
  - ✅ `poweredByHeader: false` (security — hides X-Powered-By header)
  - ✅ `images: { remotePatterns: [] }` placeholder for future character avatars

- [x] **Step 1.6: Set up Tailwind theme** ✅ DONE
      Dark theme as default (savage aesthetic). Custom colors for characters.
  - ✅ Fonts: `Inter` (body `--font-sans`), `Space Grotesk` (headlines `--font-heading`), `Geist Mono` (code)
  - ✅ `dark` class on `<html>` — dark-only app, no light mode
  - ✅ Background: `#0A0A0A` near-black, cards `#141414`, elevated `#1E1E1E`
  - ✅ Primary: `#DC2626` Crimson Red (CTAs, focus rings, Angry Grandpa accent)
  - ✅ Character colors: `--character-grandpa` (crimson `#DC2626`), `--character-dad` (orange `#EA580C`)
  - ✅ Amber accent `#FBBF24` for highlights/badges
  - ✅ Tailwind utility classes: `text-character-grandpa`, `bg-character-dad`, `text-amber`, etc.

---

## Phase 2: Supabase & Authentication

- [x] **Step 2.1: Create Supabase project**
      Via Supabase dashboard or MCP. Create project "savageai".

- [x] **Step 2.2: Database schema (SQL migration)** ✅ DONE

  ```sql
  -- Users profile (extends Supabase auth.users)
  CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    preferred_character TEXT DEFAULT 'angry-grandpa',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Conversations
  CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    character_id TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Messages
  CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model TEXT,              -- which AI model answered
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Row Level Security
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

  -- Policies
  CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
  CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE USING (auth.uid() = user_id);
  CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
  );
  CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
  );

  -- Indexes
  CREATE INDEX idx_conversations_user_id ON conversations(user_id);
  CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
  CREATE INDEX idx_messages_created_at ON messages(created_at);

  -- Auto-create profile on signup
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO profiles (id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  ```

- [x] **Step 2.3: Create Supabase client utilities** ✅ DONE
  - `src/lib/supabase/client.ts` — browser client (`createBrowserClient`)
  - `src/lib/supabase/server.ts` — server client using `@supabase/ssr` with cookies
  - `src/lib/supabase/admin.ts` — service role client (server-only, for admin operations)

- [x] **Step 2.4: Create Data Access Layer (DAL)** ✅ DONE
      `src/lib/dal.ts`:
  - `verifySession()` — cached function, decrypts session, redirects if not auth
  - `getUser()` — fetches user profile via DAL
  - `getConversations()` — user's conversations
  - `getMessages(conversationId)` — messages for a conversation

- [x] **Step 2.5: Create `proxy.ts` (auth routing)** ✅ DONE
      Uses new Next.js 16 `proxy.ts` file convention (`src/proxy.ts`):
  - Read session from cookie (optimistic check, no DB)
  - Redirect unauthenticated users from `/chat/*` to `/login`
  - Redirect authenticated users from `/login`, `/signup` to `/chat`
  - Matcher: exclude `api`, `_next`, static files

- [x] **Step 2.6: Auth UI — Login page** ✅ DONE
  - `src/app/(auth)/login/page.tsx` — Server Component wrapper
  - `src/app/(auth)/layout.tsx` — Centered auth layout
  - `src/features/auth/components/login-form.tsx` — Client Component with `useActionState`
  - `src/features/auth/actions/auth.actions.ts` → `loginAction(prevState, formData)`
  - `src/features/auth/schemas/auth.schema.ts` — Zod schema for email + password
  - Supabase `signInWithPassword` + structured error state

- [x] **Step 2.7: Auth UI — Signup page** ✅ DONE
  - `src/app/(auth)/signup/page.tsx`
  - `src/features/auth/components/signup-form.tsx`
  - Server Action: `src/features/auth/actions/auth.actions.ts` → `signupAction(state, formData)`
  - Zod validation for name + email + password
  - Supabase `signUp` with metadata (`display_name`)

- [ ] **Step 2.8: Auth UI — Logout**
  - Server Action: `logoutAction()` — `supabase.auth.signOut()` + redirect

- [ ] **Step 2.9: Test authentication flow**
  - Sign up → profile created → redirected to /chat
  - Login → session cookie set → access /chat
  - Logout → session cleared → redirected to /login
  - Unauthenticated → proxy redirects to /login

---

## Phase 3: Core Chat (The Brain)

- [ ] **Step 3.1: Define character types & data**
      `src/lib/characters.ts`:

  ```
  Character type: { id, name, nameEn, personality, systemPrompt, avatar, modelPreference }
  ```

  MVP characters:
  1. **Angry Grandpa** (Ядосаният Дядо) — grumpy, old-school, sends you to dig potatoes
  2. **Balkan Dad** (Балканският Татко) — thinks you're a lazy bum, compares you to the neighbor's kid

  Each character has a detailed system prompt that:
  - Defines personality and speech patterns
  - Instructs to answer in the user's language
  - Instructs to actually solve the problem while being savage
  - Includes formatting rules (markdown, code blocks)

- [ ] **Step 3.2: OpenRouter API client**
      `src/lib/openrouter/client.ts` (server-only):
  - `streamChat(messages, model, character)` — returns ReadableStream
  - Handles authentication with OpenRouter API key
  - Model selection logic (per character or default)
  - Error handling with typed errors
  - Rate limiting headers handling

  `src/lib/openrouter/types.ts`:
  - `OpenRouterMessage`, `OpenRouterRequest`, `OpenRouterResponse`
  - `StreamChunk` type

- [ ] **Step 3.3: Chat API route handler**
      `src/app/api/chat/route.ts`:
  - POST handler
  - Verify session (via DAL)
  - Validate request body with Zod (messages, characterId, conversationId)
  - Prepend character system prompt to messages
  - Call OpenRouter streaming API
  - Return streaming Response with proper headers
  - Save message to database after stream completes (using `after()`)

- [ ] **Step 3.4: Chat hook (client-side)**
      `src/hooks/use-chat.ts`:
  - Manages messages state
  - Handles streaming (fetch + ReadableStream reader)
  - Optimistic UI (show user message immediately)
  - Error handling
  - Loading state
  - `sendMessage(content)` function
  - `clearMessages()` function

- [ ] **Step 3.5: Chat UI — Message component**
      `src/components/chat/chat-message.tsx`:
  - User message bubble (right aligned)
  - Assistant message bubble (left aligned, character avatar)
  - Markdown rendering (code blocks, bold, lists)
  - Streaming animation (typing indicator)
  - Copy button for code blocks
  - Timestamp

- [ ] **Step 3.6: Chat UI — Input component**
      `src/components/chat/chat-input.tsx`:
  - Auto-resizing textarea
  - Send button
  - Keyboard shortcut (Enter to send, Shift+Enter for newline)
  - Disabled state while streaming
  - Character indicator (who you're talking to)

- [ ] **Step 3.7: Chat UI — Container**
      `src/components/chat/chat-container.tsx`:
  - Messages list with scroll management
  - Auto-scroll on new messages
  - Empty state (character greeting)
  - Loading skeleton

- [ ] **Step 3.8: Chat UI — Sidebar**
      `src/components/chat/chat-sidebar.tsx`:
  - List of past conversations
  - New chat button
  - Character selector
  - Conversation delete action

- [ ] **Step 3.9: Chat page**
      `src/app/(main)/chat/page.tsx`:
  - New chat page
  - Character selection if first time
  - Render ChatContainer

  `src/app/(main)/chat/[id]/page.tsx`:
  - Load existing conversation
  - Verify ownership (DAL)
  - Render ChatContainer with loaded messages

- [ ] **Step 3.10: Main layout**
      `src/app/(main)/layout.tsx`:
  - Sidebar + main content layout
  - Header with user info, logout
  - Responsive (mobile: sheet sidebar)

---

## Phase 4: Character Selection & Polish

- [ ] **Step 4.1: Character card component**
      `src/components/characters/character-card.tsx`:
  - Character avatar, name, personality preview
  - Select button
  - Visual indication of selected character

- [ ] **Step 4.2: Character selector**
      `src/components/characters/character-selector.tsx`:
  - Grid of character cards
  - Used in new chat flow
  - Can switch character mid-session (starts new conversation)

- [ ] **Step 4.3: Landing page**
      `src/app/page.tsx`:
  - Hero section with SavageAI branding
  - "Try it" CTA → login/signup
  - Character previews
  - Sample roast examples
  - Dark, edgy design

- [ ] **Step 4.4: Conversation management**
  - Server Actions for: create conversation, delete conversation, update title
  - Auto-generate title from first message (via AI)
  - Conversation list sorted by updated_at

---

## Phase 5: Conversation Persistence

- [ ] **Step 5.1: Save messages to database**
  - After stream completes, save both user and assistant messages
  - Use `after()` function for post-response DB writes
  - Handle reconnection / partial messages

- [ ] **Step 5.2: Load conversation history**
  - Server Component fetches messages via DAL
  - Pass to ChatContainer as initial messages
  - Pagination for long conversations (cursor-based)

- [ ] **Step 5.3: Conversation context**
  - Send last N messages as context to OpenRouter
  - Token counting / truncation strategy
  - System prompt always first

---

## Future Phases (Post-MVP, not detailed yet)

- [ ] **Phase 6: RAG (Personalized Insults)**
  - Enable pgvector on Supabase
  - File upload (PDF, code, CV)
  - Embedding generation (via OpenRouter or OpenAI)
  - Vector search for relevant context
  - Inject context into character prompt

- [ ] **Phase 7: TTS (Savage Voice)**
  - Provider TBD
  - Audio playback component
  - Per-character voice settings

- [ ] **Phase 8: Image Generation**
  - Provider TBD
  - Image generation from chat
  - Gallery view

- [ ] **Phase 9: Gamification**
  - Leaderboard of Shame
  - Best roasts voting
  - User stats

- [ ] **Phase 10: Notifications**
  - Passive-aggressive push notifications
  - "Why are you ignoring me?" reminders

---

## Key Files to Create/Modify

**Config:**

- `.github/copilot-instructions.md` — Copilot rules with Next.js 16.2 best practices
- `AGENTS.md` — AI agent context for the project
- `next.config.ts` — Next.js configuration
- `.env.local` / `.env.example` — Environment variables
- `tailwind.config.ts` — Theme configuration

**Auth:**

- `src/proxy.ts` — Auth routing (Next.js 16 proxy)
- `src/lib/supabase/client.ts`, `server.ts`, `admin.ts` — Supabase clients
- `src/lib/dal.ts` — Data Access Layer
- `src/app/actions/auth.ts` — Auth Server Actions
- `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`
- `src/components/auth/login-form.tsx`, `signup-form.tsx`

**Chat Core:**

- `src/lib/openrouter/client.ts` — OpenRouter streaming client
- `src/lib/characters.ts` — Character definitions
- `src/app/api/chat/route.ts` — Chat streaming API
- `src/hooks/use-chat.ts` — Chat state management hook
- `src/components/chat/*` — Chat UI components

**Layout:**

- `src/app/layout.tsx` — Root layout
- `src/app/(main)/layout.tsx` — Authenticated layout
- `src/components/layout/*` — Layout components

---

## Architecture Decisions

- **Auth**: Supabase Auth (confirmed)
- **Deployment**: Vercel (confirmed)
- **MVP Scope**: Chat + 2 characters + OpenRouter. RAG/TTS/Images later
- **proxy.ts**: Using Next.js 16 proxy instead of deprecated middleware
- **Package manager**: npm
- **src/ directory**: Yes, standard structure
- **State management**: React state + custom hooks (no external state library for MVP)
- **Styling**: Tailwind + shadcn/ui, dark theme default
- **Validation**: Zod everywhere (forms, API routes, Server Actions)
