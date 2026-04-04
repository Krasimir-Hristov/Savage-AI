# SavageAI — Project Guide for AI Agents

> **TL;DR:** SavageAI е multi-agent AI чат приложение със "токсични" български характери. MVP: Next.js 16.2 + Supabase Auth + OpenRouter API + streaming chat. За детайли, вж. `/implementationPlan.md`.

---

## Project Overview

**SavageAI** — платформа на която потребителите имат токсични разговори с AI "персоналности":

1. **Angry Grandpa** (Ядосаният Дядо) — ядосан, старомоден, праща те да копаеш картофи
2. **Balkan Dad** (Балканският Татко) — мисли че си мързелив, сравнява те със съседския син

Системата е **streaming реално време** — докато助 助手思 помощник отговаря, текстът се появява символ по символ.

---

## Tech Stack

```
Frontend:        Next.js 16.2 (App Router, Turbopack, proxy.ts)
Styling:         TailwindCSS v4 + shadcn/ui (dark theme)
Auth:            Supabase Auth + PostgreSQL RLS
Backend:         API Routes (streaming, server-only)
AI Router:       OpenRouter API (Claude, GPT, Llama, etc.)
Validation:      Zod (forms, API, Server Actions)
Data Fetching:   TanStack Query (useQuery, useMutation)
Deployment:      Vercel
Package Manager: npm
```

---

## Architecture Decisions

### 1. **Next.js 16.2 Over Alternatives**

- ✅ App Router (stable, mature)
- ✅ `proxy.ts` for optimistic auth checks (replaces deprecated middleware.ts)
- ✅ `after()` for post-response DB operations (save chat after streaming)
- ✅ Async `params`/`searchParams` (Promises, proper typing)
- ✅ Server Actions for forms (no API bloat)

### 2. **Supabase Auth Over Firebase/Auth0**

- ✅ Self-hosted option (GDPR-friendly)
- ✅ Built-in PostgreSQL (no separate DB)
- ✅ Row Level Security (database-level access control)
- ✅ Publishable keys (modern `sb_publishable_...` format, not legacy anon keys)

### 3. **OpenRouter Over Direct LLM APIs**

- ✅ Multi-model routing (can switch Claude ↔ GPT ↔ Llama seamlessly)
- ✅ Single API key for all models
- ✅ Cost optimization (credits routing)

### 4. **Streaming Chat Over REST**

- ✅ Real-time token-by-token rendering (feels snappier)
- ✅ User sees response appearing (not "thinking..." delay)
- ✅ Server-side save after stream completes (reliable persistence)

### 5. **TanStack Query Over Manual Fetch**

- ✅ Automatic caching + background refetch
- ✅ Optimistic updates (UI responds immediately)
- ✅ Auto cache invalidation on mutations

---

## File Structure Map

```
savageai/
├── .github/
│   ├── copilot-instructions.md          ← ⭐ ALL coding rules here
│   └── workflows/                       (optional: CodeRabbit)
├── .vscode/
│   ├── settings.json                    ← TypeScript, ESLint, format config
│   └── extensions.json                  ← Recommended extensions
├── AGENTS.md                            ← This file
├── implementationPlan.md                ← Checklist for all phases
├── next.config.ts                       ← Next.js config (reactCompiler on)
├── tsconfig.json                        ← TypeScript (strict: true)
├── tailwind.config.ts                   ← Tailwind theme (dark by default)
├── postcss.config.ts                    ← PostCSS plugins
├── .env.local                           ← Secrets (NOT in git)
├── .env.example                         ← Template (IN git)
├── .gitignore                           ← Node/build artifacts
├── package.json                         ← npm dependencies
│
├── src/
│   ├── app/
│   │   ├── proxy.ts                     ← Auth redirects (Next.js 16)
│   │   ├── layout.tsx                   ← Root layout
│   │   ├── page.tsx                     ← Landing page
│   │   ├── error.tsx                    ← Global error boundary
│   │   ├── not-found.tsx
│   │   ├── loading.tsx
│   │   │
│   │   ├── (auth)/                      ← Route group: /login, /signup
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (main)/                      ← Route group: authenticated area
│   │   │   ├── chat/page.tsx            ← New chat / list past chats
│   │   │   ├── chat/[id]/page.tsx       ← Load specific conversation
│   │   │   ├── characters/page.tsx      ← Character selection
│   │   │   ├── layout.tsx               ← Header + Sidebar
│   │   │   ├── error.tsx
│   │   │   └── loading.tsx
│   │   │
│   │   ├── api/
│   │   │   └── chat/route.ts            ← POST /api/chat (streaming)
│   │   │
│   │   └── actions/
│   │       └── auth.ts                  ← Server Actions: loginAction, signupAction, logoutAction
│   │
│   ├── components/
│   │   ├── ui/                          ← shadcn auto-generated (button, input, card, etc.)
│   │   │
│   │   ├── chat/
│   │   │   ├── chat-container.tsx       ← Messages list + scroll
│   │   │   ├── chat-input.tsx           ← Textarea + Send button
│   │   │   ├── chat-message.tsx         ← Message bubble (user/assistant)
│   │   │   └── chat-sidebar.tsx         ← Conversation list
│   │   │
│   │   ├── characters/
│   │   │   ├── character-card.tsx       ← Single character preview
│   │   │   └── character-selector.tsx   ← Grid of characters
│   │   │
│   │   ├── auth/
│   │   │   ├── login-form.tsx           ← Login form (client)
│   │   │   └── signup-form.tsx          ← Signup form (client)
│   │   │
│   │   └── layout/
│   │       ├── header.tsx               ← Top nav (user menu, logout)
│   │       ├── sidebar.tsx              ← Left sidebar (mobile: sheet)
│   │       └── theme-provider.tsx       ← Dark theme setup
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                ← Browser client (createBrowserClient)
│   │   │   ├── server.ts                ← Server client (@supabase/ssr)
│   │   │   └── admin.ts                 ← Service role client (server-only)
│   │   │
│   │   ├── openrouter/
│   │   │   ├── client.ts                ← streamChat(messages, model)
│   │   │   └── types.ts                 ← OpenRouterMessage, OpenRouterRequest
│   │   │
│   │   ├── dal.ts                       ← Data Access Layer (verifySession, getUser, etc.)
│   │   ├── characters.ts                ← Character definitions + system prompts
│   │   └── utils.ts                     ← Shared utils (cn, formatDate, etc.)
│   │
│   ├── types/
│   │   ├── database.ts                  ← Supabase generated types
│   │   ├── chat.ts                      ← Message, Conversation types
│   │   └── character.ts                 ← Character interface
│   │
│   └── hooks/
│       ├── use-chat.ts                  ← Chat state + streaming (sendMessage, messages)
│       └── use-characters.ts            ← Character selection
│
└── public/
    ├── avatars/                         ← Character avatars (PNG/SVG)
    └── ...                              ← Static assets
```

---

## Key Patterns

### 1. **Authentication Pattern**

```typescript
// proxy.ts reads session from cookie ONLY (no DB calls)
// → Redirects /login to /chat if authenticated
// → Redirects /chat/* to /login if not authenticated

// Server Actions (loginAction, signupAction) validate with Zod + call Supabase
// → Return structured errors for useActionState

// DAL (src/lib/dal.ts) verifies session + ownership on every operation
// → getUser(), getConversations(), getMessages() all check auth.uid()
```

### 2. **Streaming Chat Pattern**

```typescript
// Client: fetch POST /api/chat, read ReadableStream
// → Show user message immediately (optimistic)
// → Char-by-char assistant response

// Server: POST /api/chat
// → Verify session + validate Zod schema
// → Call OpenRouter with streaming
// → Return Response with headers
// → After response, save messages to DB (using after())
```

### 3. **TanStack Query Pattern**

```typescript
// useQuery for GET (conversations, messages)
// → Background refetching, staleTime: 5min

// useMutation for mutations
// → onSuccess: queryClient.invalidateQueries()
// → Auto-refresh data after change
```

### 4. **Component Hierarchy**

```
layout.tsx (Root)
  ↓
(main)/layout.tsx (Header + Sidebar wrapper)
  ↓
chat/page.tsx or chat/[id]/page.tsx
  ↓
ChatContainer
  ├── ChatMessage[] (streaming)
  └── ChatInput
```

---

## Character System

Each character lives in `src/lib/characters.ts`:

```typescript
interface Character {
  id: string; // 'angry-grandpa', 'balkan-dad'
  name: string; // "Ядосаният Дядо"
  nameEn: string; // "Angry Grandpa"
  personality: string; // "Grumpy, sends you to dig potatoes"
  avatar: string; // URL to character avatar
  systemPrompt: string; // Full prompt for OpenRouter
  modelPreference?: string; // Optional: preferred model
}
```

**System Prompt Structure:**

- Define personality + speech patterns
- Instruct to answer in user's language
- Instruct to **solve the problem** while being savage
- Include markdown formatting rules
- End with character-specific sign-off

---

## Important Notes for AI Agents

### ⚠️ Critical Rules (from `.github/copilot-instructions.md`)

1. **NEVER CODE WITHOUT APPROVAL**
   - EXPLAIN what you plan to do
   - PROPOSE multiple approaches
   - ASK for user preference
   - ONLY THEN write code

2. **ALWAYS CHECK CONTEXT7 BEFORE IMPLEMENTING**
   - Fetch latest docs for libraries (Next.js 16.2, Supabase, TailwindCSS, etc.)
   - Check for breaking changes, version-specific patterns
   - Use updated patterns in code

3. **Security Essentials**
   - Mark server-only files with `import 'server-only'`
   - Validate ALL inputs with Zod
   - Use proxy.ts for optimistic auth (no DB calls)
   - DAL pattern for secure data access
   - Never expose API keys to browser
   - Use httpOnly cookies for sessions

### ✅ Code Style Enforced

- Arrow functions for all components: `const X = (): JSX.Element => {...}`
- No `type any` (use proper types)
- Modular file structure (single responsibility)
- `@/` path aliases for all imports
- Explicit return types on exported functions
- Server Components by default (`'use client'` only when needed)

### 📚 Reference Files

- **Implementation Plan:** `/implementationPlan.md` (5 phases, all steps with checkboxes)
- **Copilot Rules:** `/.github/copilot-instructions.md` (architecture, patterns, security, best practices)
- **This Guide:** `/AGENTS.md` (you are here)

---

## Workflow for Contributors (AI or Human)

1. **Start Work:** Read `/implementationPlan.md` for current phase
2. **Before Coding:**
   - EXPLAIN the step to implement
   - PROPOSE 2-3 approaches (where applicable)
   - ASK for user preference
   - Check Context7 for latest docs
3. **During Coding:**
   - Follow patterns in `/.github/copilot-instructions.md`
   - Use Zod validation everywhere
   - Verify ownership/auth in DAL
   - Test on mobile viewport
4. **After Coding:**
   - Mark step as `[x]` in `/implementationPlan.md`
   - Run verification checklist
   - Commit with clear message

---

## Quick Reference: Common Queries

- **"Where should I put X component?"** → See file structure map in **File Structure Map** section
- **"How do I add a new API route?"** → Create in `src/app/api/`, follow POST handler in `/api/chat/route.ts`
- **"How do I validate user input?"** → Use Zod schemas (see pattern in `/.github/copilot-instructions.md`)
- **"How do I fetch data from Supabase?"** → Use DAL functions (`src/lib/dal.ts`) — they verify auth
- **"How do I stream AI response?"** → See `use-chat.ts` hook + `/api/chat/route.ts`
- **"Can I use external state library?"** → NO. MVP uses React state + custom hooks only
- **"How do I add TailwindCSS classes?"** → Use v4 syntax (check if terminal warns about deprecated class)

---

**Last Updated:** April 4, 2026  
**Project:** SavageAI MVP  
**Status:** Phase 0 Configuration
