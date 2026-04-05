# SavageAI Copilot Instructions

You are an AI assistant helping develop **SavageAI**, a multi-agent AI chat platform with "toxic" character personalities. This document describes the architecture, best practices, and code conventions for this project.

---

## Project Overview

**SavageAI** is a real-time streaming chat application where users interact with AI characters that have distinctive personalities:

1. **Angry Grandpa** (Ядосаният Дядо) — grumpy, old-school, sends you to dig potatoes
2. **Balkan Dad** (Балканският Татко) — thinks you're a lazy bum, compares you to the neighbor's kid

**Tech Stack:**

- Next.js 16.2+ (App Router, Turbopack, proxy.ts)
- TailwindCSS + shadcn/ui (dark theme)
- Supabase Auth + PostgreSQL (+ pgvector for future RAG)
- OpenRouter API (multi-model streaming)
- TanStack Query (React Query) — data fetching, caching, synchronization
- Zod — schema validation
- Vercel deployment
- npm package manager

**MVP Scope:** Chat + 2 characters + OpenRouter. RAG/TTS/Images post-MVP.

---

## Architecture

### High-Level Flow

```
User (Browser)
    ↓
Next.js App Router
    ├── Static Site
    ├── Landing Page (/page.tsx)
    └── App Routes
        ├── Auth Routes (/auth) → proxy.ts → Supabase
        │   ├── /login, /signup
        │   └── Server Actions (loginAction, signupAction, logoutAction)
        │
        ├── Authenticated Routes (/chat)
        │   ├── /chat → Chat page (character selection)
        │   ├── /chat/[id] → Existing conversation
        │   ├── Components (ChatContainer, ChatInput, ChatMessage, Sidebar)
        │   └── Hooks (use-chat for streaming)
        │
        └── API Routes (/api/chat) → OpenRouter Streaming
            ├── POST /api/chat
            │   ├── Verify session (DAL)
            │   ├── Validate Zod schema
            │   ├── Call OpenRouter API (streaming)
            │   ├── Return ReadableStream
            │   └── Save to DB via after()
            └── RAG/TTS/Images (Future phases)

Database (Supabase PostgreSQL)
    ├── auth.users (Supabase built-in)
    ├── profiles (user metadata, preferences)
    ├── conversations (chat sessions)
    └── messages (history, streaming safe)
```

### Key Architectural Patterns

#### 1. **Authentication Pattern (Next.js 16 + Supabase)**

- **`proxy.ts`** — New Next.js 16 file convention (replaces middleware.ts)
  - Optimistic auth check: read session from cookie ONLY (no DB calls)
  - Redirect unauthenticated users from `/chat/*` to `/login`
  - Redirect authenticated users from `/login`, `/signup` to `/chat`
  - Matcher: exclude `api`, `_next`, static files

- **Supabase Keys (Updated Model)**:
  - **Publishable Key** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`): New format `sb_publishable_...`, safer than legacy anon key
  - Legacy anon keys still work but publishable keys are recommended
  - Both can be rotated independently for better security
  - Use publishable key for browser clients only
  - Service role key ONLY on server (marked `server-only`)

- **DAL (Data Access Layer)** — `src/lib/dal.ts`
  - Secure functions: `verifySession()`, `getUser()`, `getConversations()`, `getMessages()`
  - Always verify ownership (prevent unauthorized access)
  - Use `'use cache'` for session caching

#### 2. **Server Actions Pattern**

- Auth actions in `src/app/actions/auth.ts`:
  - `loginAction(state, formData)` → validate → Supabase signInWithPassword
  - `signupAction(state, formData)` → validate → Supabase signUp
  - `logoutAction()` → Supabase signOut → redirect
- Validation: **Zod schemas** for all inputs
- Return: structured errors for `useActionState` on client

#### 3. **Chat Streaming Pattern**

- **Client-side**: `use-chat.ts` hook
  - Manages messages state
  - Fetch POST to `/api/chat`
  - Read streaming response with ReadableStream
  - Optimistic UI: show user message immediately
  - Char-by-char rendering of assistant response

- **Server-side**: `/api/chat` route
  - POST handler with proper error handling
  - Verify session via DAL
  - Validate request Zod schema (messages, characterId, conversationId)
  - Prepend character system prompt
  - Call OpenRouter with streaming
  - Return Response with proper headers (`Content-Type: text/event-stream`)
  - Save messages to DB **after()** stream completes (post-response operation)

#### 4. **TanStack Query (React Query) Pattern**

- **Data fetching & caching**:
  - `useQuery` for GET requests (conversations list, messages history)
  - `useMutation` for POST/PUT/DELETE (send message, delete conversation)
  - Background refetching for real-time updates
  - Automatic cache invalidation on mutations

- **Setup**:
  - Query client configured in root layout
  - QueryClientProvider wraps app
  - All queries namespaced: `['conversations']`, `['messages', conversationId]`
  - Stale time: 5 minutes for stable data, 0 for real-time

- **Example**:

  ```typescript
  const { data: conversations } = useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => fetch('/api/conversations').then((r) => r.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { mutate: sendMessage } = useMutation({
    mutationFn: (message) => fetch('/api/chat', { method: 'POST', body: JSON.stringify(message) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
  ```

#### 5. **Database & RLS (Row Level Security)**

- **Tables:**
  - `profiles` — extends auth.users, stores preferences
  - `conversations` — belongs to user, has character_id
  - `messages` — belongs to conversation, has role (user/assistant/system)

- **RLS Policies:**
  - Users can only view/modify their own data
  - Conversations filtered by user_id
  - Messages filtered through conversation ownership

---

## Code Style & Best Practices

### 1. **Component Style**

```typescript
// ✅ GOOD: Arrow function, explicit return type
const ChatMessage = ({ role, content, avatar }: ChatMessageProps): JSX.Element => {
  return (
    <div className={cn(
      "flex gap-2 p-3",
      role === "user" ? "justify-end" : "justify-start"
    )}>
      {/* content */}
    </div>
  );
};

// ❌ BAD: Function declaration, no return type
function ChatMessage(props) {
  return <div>{/* ... */}</div>;
}

// ❌ BAD: `any` type
const handleMessage = (msg: any) => { /* ... */ };
```

### 2. **Server vs. Client Components**

```typescript
// ✅ GOOD: Server Component by default
// src/app/chat/[id]/page.tsx
import { getMessages } from '@/lib/dal';

const ChatPage = async ({ params }: PageProps<'/chat/[id]'>): Promise<JSX.Element> => {
  const messages = await getMessages(params.id);
  return <ChatContainer initialMessages={messages} />;
};

// ✅ GOOD: Client Component ONLY when needed
'use client';
import { use-chat } from '@/hooks/use-chat';

const ChatInput = (): JSX.Element => {
  const { sendMessage } = useChat();
  return <input onKeyDown={...} />;
};
```

### 3. **Server-Only Imports & Modules**

```typescript
// ✅ GOOD: Mark server-only functions
// src/lib/openrouter/client.ts
import 'server-only';
import { OPENROUTER_API_KEY } from '@/lib/config';

export const streamChat = async (...): Promise<ReadableStream> => {
  // Never called from browser
};

// ✅ GOOD: Separate server and client clients
// src/lib/supabase/server.ts — marked 'server-only'
// src/lib/supabase/client.ts — browser only
```

### 4. **Modular File Structure**

```
✅ Each file has ONE responsibility:
  - Components render UI
  - Hooks manage state
  - Server Actions handle form submissions
  - DAL functions do secure data access
  - Utils contain pure functions
  - Types are centralized

✅ Naming conventions:
  - Components: PascalCase (ChatMessage.tsx)
  - Hooks: camelCase with 'use' prefix (use-chat.ts)
  - Utilities: camelCase (formatDate.ts)
  - Types: PascalCase (ChatMessage.types.ts)
```

### 5. **Validation with Zod**

```typescript
// ✅ GOOD: Validate everywhere
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short'),
});

const loginAction = async (state, formData) => {
  const result = loginSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: result.error.flatten() };
  // Proceed with auth
};

const chatRequestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })),
  characterId: z.string().uuid(),
  conversationId: z.string().uuid(),
});

export const POST = async (req: Request) => {
  const body = await req.json();
  const result = chatRequestSchema.safeParse(body);
  if (!result.success)
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
    });
  // Process chat
};
```

### 6. **Async Patterns in Next.js 16**

```typescript
// ✅ GOOD: async params in layouts/pages
export const layout = async ({ params }: LayoutProps<'/chat/[id]'>): Promise<JSX.Element> => {
  const id = await params.id; // Next.js 16: params can be async Promises
  return <div>{id}</div>;
};

// ✅ GOOD: use cache for expensive operations
import { unstable_cache } from 'next/cache';

const getCachedUser = unstable_cache(
  async (userId: string) => await db.query.users.findUnique({ where: { id: userId } }),
  ['user'],
  { revalidate: 3600 }
);

// ✅ GOOD: after() for post-response operations
import { after } from 'next/server';

export const POST = async (req) => {
  const response = new Response('...');
  after(async () => {
    await saveToDatabase(...);
  });
  return response;
};
```

### 7. **Async/Await & Error Handling Pattern**

```typescript
// ✅ GOOD: Always async/await + try/catch for ALL fetch and async I/O
const fetchConversations = async (): Promise<Conversation[]> => {
  try {
    const res = await fetch('/api/conversations');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    throw new Error(
      `fetchConversations failed: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }
};

// ✅ GOOD: In hooks — update error state, never silent catch
const sendMessage = async (content: string): Promise<void> => {
  setError(null);
  try {
    const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ content }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // handle stream...
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Something went wrong');
  }
};

// ✅ GOOD: In Server Actions — return structured error
const loginAction = async (state: ActionState, formData: FormData): Promise<ActionState> => {
  try {
    const result = loginSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) return { error: result.error.flatten() };
    const { error } = await supabase.auth.signInWithPassword(result.data);
    if (error) return { error: { message: error.message } };
    redirect('/chat');
  } catch (error) {
    return { error: { message: 'Login failed. Please try again.' } };
  }
};

// ❌ BAD: .then()/.catch() chains
fetch('/api/conversations')
  .then((r) => r.json())
  .then((data) => setData(data))
  .catch((err) => console.log(err)); // silent, no user feedback

// ❌ BAD: Empty catch block
try {
  await doSomething();
} catch (e) {} // Never do this
```

### 8. **Rate Limiting (API Security) — MANDATORY FOR ALL API ROUTES**

All API routes MUST implement rate limiting using **Upstash Ratelimit** (serverless-safe, Vercel-compatible). Rate limiting utilities are in `src/lib/ratelimit.ts`.

```typescript
// ✅ GOOD: Always rate limit FIRST in every API handler
import { chatRateLimit, handleRateLimit, getClientIP } from '@/lib/ratelimit';
import { verifySession } from '@/lib/dal';

export const POST = async (req: Request): Promise<Response> => {
  // 1️⃣ RATE LIMIT FIRST (before any auth, DB, or processing)
  const ip = getClientIP(req);
  const rateLimitResult = await handleRateLimit(chatRateLimit, ip);

  if (!rateLimitResult.success) {
    return rateLimitResult.response!; // Returns 429 with Retry-After
  }

  // 2️⃣ Then verify session
  const session = await verifySession();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 3️⃣ Validate with Zod
  const body = await req.json();
  const result = mySchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }

  // 4️⃣ Process request
  const responseData = await processRequest(result.data);

  // 5️⃣ Return response with rate limit headers
  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...rateLimitResult.headers, // ← Include rate limit headers!
    },
  });
};
```

**Rate Limits per endpoint (defined in `src/lib/ratelimit.ts`):**

- `/api/chat` — 20 requests / 10 seconds per IP
- `/api/auth/*` — 5 requests / 60 seconds per IP
- `/api/conversations` — 60 requests / 60 seconds per IP

**❌ NEVER:**

- ❌ Skip rate limiting on ANY API route
- ❌ Call `handleRateLimit()` after auth/DB calls (do it FIRST!)
- ❌ Hardcode IP extraction (always use `getClientIP()`)
- ❌ Forget to include `...rateLimitResult.headers` in response

**Required env vars** (add to `.env.example` + `.env.local`):

```
UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### 9. **HTTP Error Handling**

```typescript
// ✅ GOOD: Use Next.js 16 error utilities
import { forbidden, unauthorized } from 'next/dist/api-utils-server';

export const GET = async (req) => {
  const session = await verifySession();
  if (!session) return unauthorized(); // Returns proper Next.js 401
  if (!hasAccess) return forbidden();   // Returns proper Next.js 403
};

// ✅ GOOD: error.tsx boundaries
// src/app/(main)/error.tsx
'use client';

const Error = ({ error }: { error: Error }): JSX.Element => {
  return <div>Something went wrong: {error.message}</div>;
};

// ✅ GOOD: loading.tsx for Suspense
// src/app/(main)/loading.tsx
const Loading = (): JSX.Element => <Skeleton />;
```

### 8. **Path Aliases & Imports**

```typescript
// ✅ GOOD: Always use @/ alias (configured in next.config.ts)
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/use-chat';
import { getCachedUser } from '@/lib/dal';
import { ChatMessage } from '@/types/chat';

// ❌ BAD: Relative imports
import { Button } from '../../../components/ui/button';
```

### 9. **UI Component Library (shadcn/ui)**

```typescript
// ✅ GOOD: Use shadcn components with Tailwind
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const ChatMessage = ({ message }: Props): JSX.Element => (
  <Card className="p-3">
    <p className="text-sm text-foreground">{message.content}</p>
  </Card>
);

// Use cn() utility for conditional classes
import { cn } from '@/lib/utils';

const Message = ({ role }: Props): JSX.Element => (
  <div className={cn(
    "flex gap-2",
    role === "user" && "justify-end",
    role === "assistant" && "justify-start"
  )} />
);
```

### 10. **TanStack Query (React Query) Pattern**

```typescript
// ✅ GOOD: Use useQuery for data fetching
import { useQuery } from '@tanstack/react-query';

const ConversationsList = (): JSX.Element => {
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch('/api/conversations');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) return <Skeleton />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {conversations?.map(conv => (
        <li key={conv.id}>{conv.title}</li>
      ))}
    </ul>
  );
};

// ✅ GOOD: Use useMutation for mutations + auto-invalidate
import { useMutation, useQueryClient } from '@tanstack/react-query';

const DeleteConversation = ({ id }: { id: string }): JSX.Element => {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      // Auto-refresh conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return (
    <Button onClick={() => mutate()} disabled={isPending}>
      {isPending ? 'Deleting...' : 'Delete'}
    </Button>
  );
};

// ❌ BAD: Manual fetch without caching
const ConversationsList = (): JSX.Element => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => setConversations(data))
      .finally(() => setIsLoading(false));
  }, []); // No cache, manual loading state

  return <ul>{/* ... */}</ul>;
};
```

---

## ⚠️ CRITICAL RULE: NEVER CODE WITHOUT USER APPROVAL

**BEFORE WRITING ANY CODE:**

1. **ALWAYS EXPLAIN** what you plan to do
2. **ALWAYS PROPOSE** multiple approaches/options
3. **ALWAYS ASK** which approach the user prefers
4. **ONLY THEN** write the code after user approves

**NEVER:**

- ❌ Write code immediately without explanation
- ❌ Suggest only one solution
- ❌ Skip asking for user confirmation
- ❌ Assume the user's preference

**ALWAYS:**

- ✅ Say: "I can do this 2-3 ways. Which do you prefer?"
- ✅ Wait for response before writing
- ✅ Explain pros/cons of each approach
- ✅ Confirm with user before implementation

---

## ⚠️ RULE: ALWAYS CHECK CONTEXT7 FOR LATEST DOCS

**BEFORE WRITING CODE (AFTER USER APPROVAL):**

- Use Context7 MCP to fetch the **latest documentation** for libraries used
- Check for breaking changes, new APIs, deprecated patterns
- Example: TailwindCSS v4 has different class syntax than v3 (warnings in terminal if wrong)
- Example: Supabase has newer publishable keys (not legacy anon keys)
- Example: Next.js 16 has `proxy.ts` (not middleware.ts)

**For each major library, always:**

1. Search Context7 for the library (e.g., `/org/project`)
2. Fetch latest docs with relevant topic (e.g., "authentication", "classes", "configuration")
3. Check for version-specific changes
4. Use the updated patterns in code

**This prevents:**

- ❌ Using deprecated APIs
- ❌ Terminal warnings for outdated syntax
- ❌ Breaking changes on deployment
- ❌ Security issues from old patterns

---

## Security Guidelines

### 🔒 **Never Do:**

- ❌ Write code without user approval first (EXPLAIN → PROPOSE → ASK → CODE)
- ❌ Expose OPENROUTER_API_KEY to browser (server-only)
- ❌ Use legacy anon key when publishable key available
- ❌ Connect directly to Supabase from frontend (use server actions)
- ❌ Serve unvalidated user input (always Zod validate)
- ❌ Store sensitive data in browser localStorage (use httpOnly cookies)
- ❌ Trust client-side auth checks (verify in DAL/proxy.ts)
- ❌ Skip RLS policies (always implement Database-level security)

### ✅ **Always Do:**

- ✅ Mark server-only files with `import 'server-only'`
- ✅ Validate ALL inputs (Zod schemas everywhere)
- ✅ Use proxy.ts for optimistic auth redirects
- ✅ Use DAL for secure data access
- ✅ Verify session ownership on every operation
- ✅ Use httpOnly cookies for sessions (Supabase + @supabase/ssr)
- ✅ Log security events (optional: add audit trail)

---

## File Conventions (Next.js 16)

### App Router Structure

```
src/app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout (wrapper)
├── proxy.ts                    # Auth redirects (NEW in Next.js 16)
├── error.tsx                   # Global error boundary
├── not-found.tsx               # 404 page
├── loading.tsx                 # Global Suspense skeleton
│
├── (auth)/                     # Route group: auth pages
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── layout.tsx              # Auth-specific layout
│
├── (main)/                     # Route group: authenticated area
│   ├── chat/page.tsx           # New chat / chat list
│   ├── chat/[id]/page.tsx      # Specific conversation
│   ├── characters/page.tsx     # Character selection
│   ├── layout.tsx              # Main layout (sidebar, header)
│   ├── error.tsx               # Auth-area error boundary
│   └── loading.tsx             # Auth-area loading skeleton
│
└── api/
    └── chat/route.ts           # POST /api/chat (streaming)
```

### Component & Hook Pattern

```
src/components/
├── ui/                         # shadcn auto-generated
├── chat/
│   ├── chat-message.tsx        # Message display
│   ├── chat-input.tsx          # Input + send
│   ├── chat-container.tsx      # Message list + scroll
│   └── chat-sidebar.tsx        # Conversation list
├── characters/
│   ├── character-card.tsx      # Single character preview
│   └── character-selector.tsx  # Character grid
├── auth/
│   ├── login-form.tsx          # Login form (client)
│   └── signup-form.tsx         # Signup form (client)
└── layout/
    ├── header.tsx              # Top navigation
    ├── sidebar.tsx             # Left sidebar
    └── theme-provider.tsx      # Dark theme setup

src/hooks/
├── use-chat.ts                 # Chat streaming hook
└── use-characters.ts           # Character selection hook

src/lib/
├── supabase/
│   ├── client.ts               # Browser Supabase client
│   ├── server.ts               # Server Supabase client
│   └── admin.ts                # Admin/service role client
├── openrouter/
│   ├── client.ts               # OpenRouter streaming
│   └── types.ts                # Request/Response types
├── dal.ts                      # Data Access Layer
├── characters.ts               # Character data + system prompts
├── config.ts                   # Environment variables
└── utils.ts                    # Utility functions (cn, formatDate, etc.)

src/types/
├── database.ts                 # Supabase-generated types
├── chat.ts                     # Chat types (Message, Conversation, etc.)
└── character.ts                # Character types

src/app/
└── actions/
    └── auth.ts                 # Server Actions (login, signup, logout)
```

---

## Character System

### Character Definition

```typescript
interface Character {
  id: string; // 'angry-grandpa', 'balkan-dad'
  name: string; // Display name (Bulgarian)
  nameEn: string; // English name
  personality: string; // Brief personality description
  systemPrompt: string; // Full system prompt for OpenRouter
  avatar: string; // Avatar URL
  modelPreference?: string; // Default OpenRouter model (optional)
}
```

### Character System Prompts

Each character has a custom system prompt that:

1. Defines personality and speech patterns
2. Instructs to answer in user's language
3. Instructs to **solve the problem while being savage**
4. Includes formatting rules (markdown, code blocks, emphasize key points)

**Example (Angry Grandpa):**

```
You are Ядосаният Дядо (Angry Grandpa), a grumpy Bulgarian old-timer who:
- Complains about "the good old days"
- Threatens to send people to dig potatoes
- Speaks in old Bulgarian dialect mixed with modern slang
- Still gives actual helpful advice (grudgingly)
- Responds ONLY in Bulgarian (or English if asked)

IMPORTANT: Despite your tone, you MUST:
- Actually solve the user's problem
- Provide working code/solutions
- Format code in markdown blocks
- End with a passive-aggressive comment like "You're welcome, brat."
```

---

## Streaming & Real-Time Chat

### Client-Side Streaming (use-chat.ts)

```typescript
const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    // 1. Optimistic UI: add user message immediately
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setIsLoading(true);

    // 2. Fetch streaming response
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, characterId, conversationId }),
    });

    // 3. Read stream
    const reader = response.body?.getReader();
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantContent += new TextDecoder().decode(value);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, content: assistantContent }];
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    }
    setIsLoading(false);
  };

  return { messages, isLoading, sendMessage };
};
```

### Server-Side Streaming (/api/chat)

```typescript
export const POST = async (req: Request) => {
  // 1. Verify session & validate
  const session = await verifySession();
  const body = chatRequestSchema.parse(await req.json());

  // 2. Get character system prompt
  const character = CHARACTERS[body.characterId];
  const messagesWithSystem = [
    { role: 'system', content: character.systemPrompt },
    ...body.messages,
  ];

  // 3. Stream from OpenRouter
  const stream = await streamChat(messagesWithSystem, character.modelPreference);

  // 4. Return streaming response with proper headers
  const response = new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });

  // 5. Save messages AFTER response completes
  after(async () => {
    await saveMessagesToDatabase(...);
  });

  return response;
};
```

---

## Next.js 16 & Ecosystem Key Features Used

### Next.js 16

1. **`proxy.ts`** — Auth routing (replaces middleware.ts)
2. **Async `params`/`searchParams`** — Use `await params.id`
3. **`PageProps<'/route'>`/`LayoutProps<'/route'>`** — Type-safe route props
4. **`use cache`** — Segment caching directive
5. **`after()`** — Post-response operations (save to DB)
6. **`forbidden()`/`unauthorized()`** — Proper error responses
7. **Turbopack** — Faster local dev builds
8. **React Compiler** — Automatic memoization

### TanStack Query

1. **`useQuery`** — Data fetching with caching
2. **`useMutation`** — Create/update/delete with automatic cache invalidation
3. **`useQueryClient`** — Manual cache invalidation and updates
4. **Query keys** — Hierarchical cache keys for organization
5. **Stale time & garbage collection** — Intelligent cache lifecycle
6. **Background refetching** — Keep data fresh without blocking UI

---

## Development Workflow

### Before Writing Code

- [ ] Check this document for patterns
- [ ] Review the implementation plan
- [ ] Verify Zod schemas exist for inputs

### Before Committing

- [ ] No `any` types
- [ ] No hardcoded secrets
- [ ] All Server Components by default
- [ ] Validation on all inputs
- [ ] Error handling in place
- [ ] Mobile-responsive CSS

### Testing Checklist

- [ ] Auth flow (signup → login → logout → redirect)
- [ ] Chat streaming (message appears, then assistant streams)
- [ ] Character switching (different responses)
- [ ] Database persistence (refresh → messages load)
- [ ] Error states (connection lost, invalid input, etc.)
- [ ] Mobile viewport (responsive sidebar, touch-friendly)

---

## Questions? Refer To:

- **Implementation plan**: `/implementationPlan.md`
- **Next.js docs**: https://nextjs.org/docs
- **Supabase SSR**: https://supabase.com/docs/guides/auth/server-side-rendering
- **OpenRouter API**: https://openrouter.ai/docs/api/introduction
- **shadcn/ui**: https://ui.shadcn.com

---

**Last Updated:** April 4, 2026  
**Project:** SavageAI MVP  
**Tech Stack:** Next.js 16.2 + Supabase + OpenRouter + shadcn/ui
