# SavageAI Test Plan

## TL;DR

Complete testing plan for SavageAI — from unit tests to E2E. Covers all critical paths: auth, chat streaming, RAG, TTS, image generation, API security. Divided into phases for gradual implementation. Includes CI/CD integration with GitHub Actions.

---

## Selected Technology (2026 Stack)

| Tool                                                 | Role                       | Why                                                                                                                               |
| ---------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Vitest 3.x**                                       | Unit + Integration tests   | Fastest test runner for 2026. Native ESM, TypeScript without configuration, compatible with Next.js 16. Completely replaces Jest. |
| **React Testing Library** (`@testing-library/react`) | Component tests            | Standard for React 19 component testing. Tests behavior, not implementation.                                                      |
| **MSW 2.x** (Mock Service Worker)                    | API mocking                | Intercepts HTTP requests at network level. Works in both Node (unit) and browser (E2E). Single mock layer for all tests.          |
| **Playwright**                                       | E2E tests                  | Most modern E2E framework. Built into Next.js ecosystem, supports all browsers.                                                   |
| **@vitejs/plugin-react**                             | JSX transform for Vitest   | Enables rendering React components in Vitest environment.                                                                         |
| **happy-dom**                                        | DOM environment for Vitest | Faster than jsdom, sufficient for component tests.                                                                                |

### Why NOT Jest?

- Vitest is 3-5x faster (native ESM, no transform overhead)
- Zero configuration for TypeScript + path aliases (`@/`)
- Same API as Jest (`describe`, `it`, `expect`) — zero learning curve
- Better integration with Vite ecosystem and Next.js 16

---

## Test File Structure

```
savageai/
├── vitest.config.ts                     # Vitest configuration
├── vitest.config.e2e.ts                 # Separate E2E config (if not using Playwright)
├── playwright.config.ts                 # Playwright E2E configuration
│
├── src/
│   ├── lib/
│   │   ├── __tests__/                   # Unit tests for lib/
│   │   │   ├── dal.test.ts
│   │   │   ├── ratelimit.test.ts
│   │   │   ├── errors.test.ts
│   │   │   ├── utils.test.ts
│   │   │   └── markers.test.ts
│   │   ├── supabase/__tests__/
│   │   │   └── server.test.ts
│   │   ├── openrouter/__tests__/
│   │   │   └── client.test.ts
│   │   └── embeddings/__tests__/
│   │       └── client.test.ts
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── actions/__tests__/
│   │   │   │   ├── auth.actions.test.ts
│   │   │   │   └── signup.action.test.ts
│   │   │   ├── schemas/__tests__/
│   │   │   │   └── auth.schema.test.ts
│   │   │   └── components/__tests__/
│   │   │       ├── LoginForm.test.tsx
│   │   │       └── SignupForm.test.tsx
│   │   │
│   │   ├── chat/
│   │   │   ├── hooks/__tests__/
│   │   │   │   └── use-chat.test.ts
│   │   │   ├── api/__tests__/
│   │   │   │   └── chat.schema.test.ts
│   │   │   └── components/__tests__/
│   │   │       ├── ChatMessage.test.tsx
│   │   │       ├── ChatInput.test.tsx
│   │   │       └── ChatContainer.test.tsx
│   │   │
│   │   ├── characters/
│   │   │   ├── data/__tests__/
│   │   │   │   ├── characters.test.ts
│   │   │   │   └── models.test.ts
│   │   │   └── components/__tests__/
│   │   │       ├── CharacterCard.test.tsx
│   │   │       └── CharacterSelector.test.tsx
│   │   │
│   │   ├── rag/
│   │   │   ├── __tests__/
│   │   │   │   └── dal.test.ts
│   │   │   ├── services/__tests__/
│   │   │   │   ├── embed-entry.test.ts
│   │   │   │   └── search.test.ts
│   │   │   ├── utils/__tests__/
│   │   │   │   ├── chunk-text.test.ts
│   │   │   │   ├── parse-file.test.ts
│   │   │   │   └── supported-types.test.ts
│   │   │   ├── tools/__tests__/
│   │   │   │   └── search-knowledge.test.ts
│   │   │   ├── hooks/__tests__/
│   │   │   │   └── use-knowledge.test.ts
│   │   │   └── api/__tests__/
│   │   │       └── knowledge.schema.test.ts
│   │   │
│   │   ├── image-gen/
│   │   │   └── __tests__/
│   │   │       ├── detect-intent.test.ts
│   │   │       ├── extract-prompt.test.ts
│   │   │       └── generate-image.test.ts
│   │   │
│   │   └── tts/
│   │       ├── api/__tests__/
│   │       │   ├── session.service.test.ts
│   │       │   ├── transcript.service.test.ts
│   │       │   └── tts.schema.test.ts
│   │       └── components/__tests__/
│   │           └── VoiceCallOverlay.test.tsx
│   │
│   └── app/
│       └── api/
│           ├── chat/__tests__/
│           │   └── route.test.ts
│           ├── conversations/__tests__/
│           │   └── route.test.ts
│           ├── knowledge/__tests__/
│           │   ├── route.test.ts
│           │   └── [id].route.test.ts
│           └── tts/__tests__/
│               ├── session.route.test.ts
│               └── transcript.route.test.ts
│
├── e2e/                                 # Playwright E2E tests
│   ├── auth.spec.ts                     # Login → Signup → Logout flow
│   ├── chat.spec.ts                     # New chat → send → streaming → persist
│   ├── characters.spec.ts               # Character selection → chat → switch
│   ├── knowledge.spec.ts                # Upload → list → edit → delete → search
│   ├── conversations.spec.ts            # Create → rename → delete → navigate
│   └── fixtures/
│       ├── auth.fixture.ts              # Authenticated page fixture
│       └── test-files/                  # Sample PDF, DOCX, CSV for upload tests
│           ├── sample.pdf
│           ├── sample.docx
│           ├── sample.csv
│           └── sample.txt
│
└── test/
    ├── setup.ts                         # Global test setup (MSW, happy-dom)
    ├── mocks/
    │   ├── handlers.ts                  # MSW route handlers
    │   ├── supabase.ts                  # Supabase client mock
    │   ├── openrouter.ts                # OpenRouter API mock
    │   └── next.ts                      # Next.js server mocks (cookies, headers, redirect)
    └── fixtures/
        ├── messages.ts                  # Sample message data
        ├── conversations.ts             # Sample conversation data
        ├── characters.ts                # Sample character data
        ├── knowledge.ts                 # Sample knowledge entries + chunks
        └── users.ts                     # Sample user/session data
```

---

## Phase 0: Test Infrastructure Setup

- [ ] **Step 0.1: Install Vitest + dependencies**

  ```bash
  npm install -D vitest @vitejs/plugin-react happy-dom
  npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
  npm install -D msw
  npm install -D playwright @playwright/test
  ```

- [ ] **Step 0.2: Configure `vitest.config.ts`**
  - `environment: 'happy-dom'` for component tests
  - `resolve.alias`: `@/` → `src/` (matching `tsconfig.json`)
  - `setupFiles: ['./test/setup.ts']`
  - `include: ['src/**/*.test.{ts,tsx}']`
  - `coverage` with `v8` provider
  - `server.deps.inline`: inline Supabase/LangChain ESM packages

- [ ] **Step 0.3: Configure `playwright.config.ts`**
  - `baseURL: 'http://localhost:3000'`
  - `webServer`: auto-start `npm run dev` before tests
  - Projects: chromium, firefox, webkit (mobile viewport optional)
  - `testDir: './e2e'`
  - Screenshots on failure

- [ ] **Step 0.4: Global test setup (`test/setup.ts`)**
  - Import `@testing-library/jest-dom/vitest` for matchers (`toBeInTheDocument`, etc.)
  - MSW server `beforeAll/afterAll/afterEach` setup
  - Mock for `import 'server-only'` (noop in test environment)
  - Mock for `next/headers` (`cookies()`)
  - Mock for `next/navigation` (`redirect()`, `useRouter()`)

- [ ] **Step 0.5: MSW mock handlers (`test/mocks/handlers.ts`)**
  - OpenRouter streaming mock (SSE format)
  - Supabase Auth mock endpoints
  - ElevenLabs signed URL mock
  - Standard REST mocks for `/api/*` endpoints

- [ ] **Step 0.6: Test fixtures (`test/fixtures/*.ts`)**
  - Sample users, conversations, messages, characters
  - Knowledge entries + chunks with realistic data
  - Reusable factories: `createMockMessage()`, `createMockConversation()`, etc.

- [ ] **Step 0.7: npm scripts in `package.json`**

  ```json
  {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
  ```

- [ ] **Step 0.8: Update `.github/workflows/ci.yml`**
  - Add `test:run` step after lint + typecheck
  - Coverage upload (optional, Codecov/Coveralls)
  - Separate Playwright job with browser install cache
  - E2E tests optional (only on PR to main, not on every push)

---

## Phase 1: Zod Schema Tests (Quick wins, high value)

> **Why first?** Schemas are pure functions without dependencies. Test easily and prevent regression on API contract changes.

- [ ] **Step 1.1: Auth schemas** (`auth.schema.test.ts`)
  - ✅ `loginSchema` — valid email + password ≥ 8 chars
  - ❌ Invalid email, short password, missing fields
  - ❌ XSS in email field, SQL injection strings

- [ ] **Step 1.2: Chat schema** (`chat.schema.test.ts`)
  - ✅ `chatRequestSchema` — valid messages (1-50), characterId, conversationId (UUID)
  - ❌ Empty messages array, > 50 messages
  - ❌ Invalid conversationId (not UUID)
  - ❌ Unknown characterId

- [ ] **Step 1.3: Knowledge schemas** (`knowledge.schema.test.ts`)
  - ✅ `createKnowledgeSchema` — title (optional), content (1-500K chars)
  - ✅ `fileUploadSchema` — fileName, fileSize ≤ 10MB, mimeType (supported)
  - ✅ `updateKnowledgeSchema` — partial update
  - ✅ `toggleChunkSchema` — is_active boolean
  - ❌ Content > 500K chars
  - ❌ File > 10MB
  - ❌ Unsupported MIME type
  - ❌ Empty content

- [ ] **Step 1.4: TTS schemas** (`tts.schema.test.ts`)
  - ✅ `sessionRequestSchema` — characterId + conversationId (UUID)
  - ✅ `transcriptRequestSchema` — conversationId + messages (1-100)
  - ❌ > 100 transcript messages
  - ❌ Invalid UUID

---

## Phase 2: Pure Utility Tests

> **Why?** Functions without side effects. Easy to test, prevent subtle bugs.

- [ ] **Step 2.1: `lib/utils.ts`** (`utils.test.ts`)
  - `cn()` — merges classes correctly, handles conflicts (Tailwind merge)

- [ ] **Step 2.2: `lib/errors.ts`** (`errors.test.ts`)
  - `NotFoundError` — statusCode 404, correct message
  - `ForbiddenError` — statusCode 403
  - `AppError` — base class, custom statusCode
  - `toHttpResponse(error)` — correct JSON Response for AppError
  - `toHttpResponse(unknownError)` — 500 for unknown errors
  - `toHttpResponse(string)` — handle non-Error objects

- [ ] **Step 2.3: `constants/markers.ts`** (`markers.test.ts`)
  - Check values of `IMAGE_MARKER_PREFIX` and `RAG_SEARCH_MARKER`
  - These markers used by both client and server — change breaks streaming

- [ ] **Step 2.4: `features/characters/data/*`** (`characters.test.ts`)
  - `getCharacter('angry-grandpa')` → returns object with all required fields
  - `getCharacter('nonexistent')` → throws error
  - `getAllCharacters()` → array with ≥ 3 characters (grandpa, dad, shark)
  - Each character has: id, name, personality, systemPrompt, avatar, ui.emoji
  - `DEFAULT_CHARACTER_ID` exists in `CHARACTERS`
  - System prompts are not empty

- [ ] **Step 2.5: `features/characters/data/models.ts`** (`models.test.ts`)
  - `DEFAULT_CHAT_MODEL` is set
  - `DEFAULT_IMAGE_MODEL` is set
  - `MODELS` array is not empty
  - Each model has id and name

- [ ] **Step 2.6: `features/rag/utils/supported-types.ts`** (`supported-types.test.ts`)
  - `isSupported('application/pdf')` → true
  - `isSupported('image/jpeg')` → false
  - `resolveMimeType('file.pdf', 'application/octet-stream')` → `application/pdf` (extension fallback)
  - `resolveMimeType('file.pdf', 'application/pdf')` → `application/pdf` (browser MIME)
  - `resolveMimeType('file.xyz', '')` → null (unknown format)
  - `getSupportedExtensions()` → contains .pdf, .docx, .csv, .txt, .ts, .js
  - `MAX_FILE_SIZE` is 10MB

- [ ] **Step 2.7: `features/image-gen/utils/detect-intent.ts`** (`detect-intent.test.ts`)
  - Image intent detection for Bulgarian messages
  - Image intent detection for English messages
  - Image intent detection for transliterated messages
  - Non-image messages return false
  - Empty message array returns false

---

## Phase 3: Data Access Layer (DAL) Tests

> **Why?** DAL is the security boundary. Bug here = unauthorized access to other users' data.

- [ ] **Step 3.1: `lib/dal.ts` — verifySession()** (`dal.test.ts`)
  - ✅ Valid session → returns `{ userId, email }`
  - ❌ Invalid/expired session → calls `redirect('/login')`
  - ❌ Supabase error → calls `redirect('/login')`
  - Mock: `@supabase/ssr` → `createServerClient`, `next/headers` → `cookies()`

- [ ] **Step 3.2: `lib/dal.ts` — getConversations()**
  - ✅ Returns only conversations for specific user
  - ✅ Sorted by `updated_at` DESC
  - ❌ Unknown userId → empty array

- [ ] **Step 3.3: `lib/dal.ts` — getConversation()**
  - ✅ Returns conversation if userId matches
  - ❌ Foreign conversationId → `null` (ownership check)
  - ❌ Non-existent ID → `null`

- [ ] **Step 3.4: `lib/dal.ts` — getMessages()**
  - ✅ Returns messages for valid conversationId
  - ❌ Foreign conversation → ownership blocks

- [ ] **Step 3.5: `features/rag/dal.ts` — Knowledge DAL**
  - ✅ `getKnowledgeEntries(userId)` — only user's entries
  - ✅ `getKnowledgeEntry(id, userId)` — ownership check
  - ✅ `getKnowledgeEntryWithChunks(id, userId)` — entry + chunks
  - ❌ `getKnowledgeEntry(id, wrongUserId)` → `NotFoundError`
  - ✅ `deleteKnowledgeEntry(id, userId)` — deletes entry + chunks (cascade)
  - ✅ `toggleChunkActive(chunkId, userId, false)` — deactivates chunk
  - ❌ `toggleChunkActive(chunkId, wrongUserId, true)` → `NotFoundError`

---

## Phase 4: RAG Services Tests

> **Why?** Embedding + chunking is critical logic. Error = invalid vectors = bad search results.

- [ ] **Step 4.1: `rag/utils/chunk-text.ts`** (`chunk-text.test.ts`)
  - ✅ Short text (< 200 chars) → 1 chunk
  - ✅ Long text → multiple chunks ≤ 1500 chars
  - ✅ Overlap between chunks (200 chars)
  - ✅ Empty/whitespace chunks filtered
  - ❌ Empty text → throw Error
  - ✅ Each chunk has `content`, `embedding` (1536D), `chunkIndex`
  - Mock: `embedTexts()` → return fixed 1536D vectors

- [ ] **Step 4.2: `rag/utils/parse-file.ts`** (`parse-file.test.ts`)
  - ✅ PDF file → extracted text
  - ✅ DOCX file → extracted text (mammoth)
  - ✅ CSV file → table as text
  - ✅ Plain text → direct UTF-8 decode
  - ✅ Code file (`.ts`, `.js`) → wrapped with `[Source code: filename]`
  - ❌ Empty file → empty or error
  - Fixtures: small sample files for each format

- [ ] **Step 4.3: `rag/services/embed-entry.ts`** (`embed-entry.test.ts`)
  - ✅ `createAndEmbedEntry()` — insert entry + chunks in correct order
  - ✅ chunk_count updated
  - ❌ Chunk insert failure → rollback (deletes entry)
  - ✅ `reEmbedEntry()` — re-embed only if content changed
  - ✅ `reEmbedEntry()` — skip if content is same
  - Mock: Supabase client + `chunkAndEmbed()`

- [ ] **Step 4.4: `rag/services/search.ts`** (`search.test.ts`)
  - ✅ `searchKnowledge(query, userId)` — embed query + call RPC
  - ✅ Filters by userId (doesn't return foreign chunks)
  - ✅ Returns results sorted by similarity
  - ❌ Empty query → []
  - ❌ Embed failure → [] (graceful degradation)
  - ✅ `formatSearchResults()` — correct formatting
  - Mock: `embedQuery()` + Supabase RPC

- [ ] **Step 4.5: `rag/tools/search-knowledge.ts`** (`search-knowledge.test.ts`)
  - ✅ `createSearchKnowledgeTool(userId)` — LangChain tool with correct userId
  - ✅ Tool invoke → calls `searchKnowledge()` with correct userId
  - ❌ Empty query → empty results

---

## Phase 5: Rate Limiting Tests

> **Why?** Rate limiting is security critical. Non-working limiter = open door for abuse.

- [ ] **Step 5.1: `lib/ratelimit.ts`** (`ratelimit.test.ts`)
  - ✅ `getClientIP(request)` — extracts from `x-forwarded-for`
  - ✅ `getClientIP(request)` — fallback to `x-real-ip`
  - ✅ `getClientIP(request)` — `'unknown'` if no headers
  - ✅ `handleRateLimit()` — success → `{ success: true, headers }`
  - ❌ `handleRateLimit()` — limit exceeded → `{ success: false, response: 429 }`
  - ✅ Response includes `Retry-After` header
  - ✅ Response includes `RateLimit-*` headers
  - Mock: Upstash Ratelimit instance

---

## Phase 6: Server Actions Tests

> **Why?** Server actions handle forms + auth. Bug = auth bypass or data corruption.

- [ ] **Step 6.1: `auth/actions/auth.actions.ts` — loginAction** (`auth.actions.test.ts`)
  - ✅ Valid email + password → signInWithPassword → redirect('/chat')
  - ❌ Invalid email → field error
  - ❌ Short password → field error
  - ❌ Wrong password → Supabase error → action error state
  - ❌ Missing email → field error

- [ ] **Step 6.2: `auth/actions/signup.action.ts` — signupAction** (`signup.action.test.ts`)
  - ✅ Valid name + email + password → signUp → redirect('/chat')
  - ❌ Short name (< 2 chars) → field error
  - ❌ Email already exists → Supabase error → action error
  - ✅ display_name passed in metadata

- [ ] **Step 6.3: `auth/actions/auth.actions.ts` — logoutAction**
  - ✅ signOut → redirect('/login')

- [ ] **Step 6.4: `chat/actions/conversation.actions.ts`** (`conversation.actions.test.ts`)
  - ✅ `createConversationAction(characterId)` — creates conversation + redirect
  - ✅ `renameConversationAction(id, title)` — updates title
  - ✅ `deleteConversationAction(id)` — deletes conversation
  - ❌ Unauthenticated user → redirect
  - ❌ Foreign conversation → ownership blocks

- [ ] **Step 6.5: `landing/actions/waitlist.actions.ts`** (`waitlist.actions.test.ts`)
  - ✅ Successful addition → success state
  - ✅ Duplicate email (23505) → `alreadyJoined: true`
  - ❌ Unauthenticated → error

---

## Phase 7: API Route Tests (Integration)

> **Why?** API routes are public endpoints. Tests validate entire pipeline: rate limit → auth → validation → business logic → response.

- [ ] **Step 7.1: `POST /api/chat`** (`route.test.ts`)
  - ✅ Valid request → streaming response (Content-Type: text/event-stream)
  - ❌ No session → 401
  - ❌ Invalid JSON → 400
  - ❌ Invalid Zod schema → 400
  - ❌ Unknown characterId → 404
  - ❌ Rate limit exceeded → 429 with Retry-After
  - ✅ Response includes rate limit headers
  - ✅ Image intent detection → image URL in stream
  - ✅ RAG tools created if user has knowledge entries
  - ✅ `after()` called for DB save

- [ ] **Step 7.2: `GET /api/conversations`** (`route.test.ts`)
  - ✅ Authenticated → JSON array of conversations
  - ❌ No session → 401
  - ❌ Rate limit → 429

- [ ] **Step 7.3: `GET /api/knowledge`** (`route.test.ts`)
  - ✅ Authenticated → JSON array of knowledge entries
  - ❌ No session → 401

- [ ] **Step 7.4: `POST /api/knowledge`** (manual entry)
  - ✅ JSON body with title + content → creates entry + chunks
  - ❌ Content > 500K chars → 400
  - ❌ Missing content → 400

- [ ] **Step 7.5: `POST /api/knowledge`** (file upload)
  - ✅ FormData with PDF file → parse + embed + create
  - ❌ File > 10MB → 413
  - ❌ Unsupported MIME → 400
  - ❌ Upload rate limit → 429 (stricter: 5 req/60s)

- [ ] **Step 7.6: `PATCH /api/knowledge/[id]`**
  - ✅ Update title → success
  - ✅ Update content → re-embed
  - ❌ Foreign entry → 404
  - ❌ No session → 401

- [ ] **Step 7.7: `DELETE /api/knowledge/[id]`**
  - ✅ Delete → cascade removes chunks
  - ❌ Foreign entry → 404

- [ ] **Step 7.8: `PATCH /api/knowledge/[id]/chunks/[chunkId]`**
  - ✅ Toggle is_active → success
  - ❌ Foreign chunk → 404

- [ ] **Step 7.9: `POST /api/tts/session`** (`session.route.test.ts`)
  - ✅ Valid request → signed URL + promptOverride
  - ❌ Character without elevenLabsAgentId → 400
  - ❌ Unknown conversationId → 404
  - ❌ Foreign conversation → 404
  - ❌ Rate limit → 429

- [ ] **Step 7.10: `POST /api/tts/transcript`** (`transcript.route.test.ts`)
  - ✅ Valid messages → saved + updated_at
  - ❌ Foreign conversation → 404
  - ❌ > 100 messages → 400

---

## Phase 8: OpenRouter Client Tests

> **Why?** Streaming is the heart of the app. Mock OpenRouter, test stream parsing, tool calling, marker injection.

- [ ] **Step 8.1: `openrouter/client.ts` — streamChatAgent()** (`client.test.ts`)
  - ✅ No imageUrl → standard LLM stream
  - ✅ With imageUrl → inject image reaction prompt, append `__SAVAGE_IMG__<url>` marker
  - ✅ Stream encoding is correct UTF-8
  - Mock: LangChain ChatOpenAI `.stream()` → AsyncGenerator

- [ ] **Step 8.2: `openrouter/client.ts` — streamChatWithTools()**
  - ✅ No tool calls → direct stream
  - ✅ With tool calls → ReAct loop (call → execute → repeat → final answer)
  - ✅ RAG_SEARCH_MARKER emitted on tool invocation
  - ✅ `stripToolLeakage()` removes PLAN:, tool invocation lines
  - Mock: LangChain tool execution

- [ ] **Step 8.3: `embeddings/client.ts`** (`client.test.ts`)
  - ✅ `embedQuery(text)` → 1536D vector
  - ✅ `embedTexts(['a', 'b'])` → 2x 1536D vectors
  - ❌ Dimension mismatch → throw Error
  - ❌ Empty texts array → []
  - Mock: OpenAIEmbeddings

---

## Phase 9: Image Generation Tests

> **Why?** Image gen is fire-and-forget with graceful degradation. Must ensure failure doesn't break chat.

- [ ] **Step 9.1: `image-gen/api/generate-image.ts`** (`generate-image.test.ts`)
  - ✅ Successful response with base64 → upload to Storage → public URL
  - ✅ Successful response with URL → return URL directly
  - ❌ OpenRouter error → return null (don't throw!)
  - ❌ Storage upload fail → return null
  - Mock: OpenRouter fetch + Supabase Storage

- [ ] **Step 9.2: `image-gen/utils/extract-prompt.ts`** (`extract-prompt.test.ts`)
  - ✅ Bulgarian message → English prompt
  - ❌ LLM failure → fallback to original message
  - Mock: LangChain ChatOpenAI

---

## Phase 10: TTS Service Tests

> **Why?** TTS includes external API (ElevenLabs) + conversation ownership. Bug = exposing foreign conversations.

- [ ] **Step 10.1: `tts/api/session.service.ts`** (`session.service.test.ts`)
  - ✅ Valid request → signed URL from ElevenLabs
  - ✅ System prompt + VOICE_MODE_INSTRUCTIONS injected
  - ✅ Last 15 messages provided as context
  - ❌ Foreign conversation → VoiceSessionError (404)
  - ❌ Character without voice → VoiceSessionError (400)
  - ❌ ElevenLabs API error → VoiceSessionError (502)
  - Mock: Supabase + ElevenLabs fetch

- [ ] **Step 10.2: `tts/api/transcript.service.ts`** (`transcript.service.test.ts`)
  - ✅ Save messages → batch insert + update timestamp
  - ❌ Foreign conversation → TranscriptSaveError
  - ❌ DB failure → TranscriptSaveError
  - Mock: Supabase client

---

## Phase 11: Client-side Hook Tests

> **Why?** Hooks manage state and streaming. Bug = UI glitch, lost messages, broken UX.

- [ ] **Step 11.1: `chat/hooks/use-chat.ts`** (`use-chat.test.ts`)
  - ✅ `sendMessage()` → optimistic user message + assistant streaming
  - ✅ Streaming text accumulates correctly (char by char)
  - ✅ RAG_SEARCH_MARKER → `isSearchingKnowledge` = true
  - ✅ IMAGE_MARKER_PREFIX → imageUrl extracted
  - ✅ Markers stripped from visible content
  - ❌ HTTP error → `error` state set
  - ✅ `clearMessages()` → clears state
  - ✅ Carry-over buffer handles split markers
  - ✅ MAX_CONTEXT_MESSAGES = 20 (slice messages)
  - Mock: `fetch` → ReadableStream mock

- [ ] **Step 11.2: `rag/hooks/use-knowledge.ts`** (`use-knowledge.test.ts`)
  - ✅ `useKnowledgeEntries()` — fetch + cache
  - ✅ `useCreateKnowledge()` → POST + invalidate cache
  - ✅ `useUploadKnowledge()` → POST FormData + invalidate cache
  - ✅ `useDeleteKnowledge()` → DELETE + invalidate cache
  - ✅ `useToggleChunk()` → PATCH + invalidate detail cache
  - ❌ Server error → mutation error state
  - Mock: MSW handlers for `/api/knowledge/*`

---

## Phase 12: Component Tests (UI)

> **Why?** Visual components must render correctly and handle user interaction.

- [ ] **Step 12.1: `ChatMessage.tsx`** (`ChatMessage.test.tsx`)
  - ✅ User message → right aligned
  - ✅ Assistant message → left aligned with avatar
  - ✅ Markdown rendering (bold, code blocks, links)
  - ✅ Code block → copy button
  - ✅ Image URL → `<img>` tag
  - ✅ Streaming state → blinking cursor

- [ ] **Step 12.2: `ChatInput.tsx`** (`ChatInput.test.tsx`)
  - ✅ Enter → submit
  - ✅ Shift+Enter → newline
  - ✅ Disabled while streaming
  - ✅ Empty message → doesn't submit

- [ ] **Step 12.3: `ChatContainer.tsx`** (`ChatContainer.test.tsx`)
  - ✅ Renders message list
  - ✅ Empty state → greeting
  - ✅ Auto-scroll on new message

- [ ] **Step 12.4: `LoginForm.tsx`** (`LoginForm.test.tsx`)
  - ✅ Renders email + password fields
  - ✅ Submit → calls loginAction
  - ✅ Error → shows error message
  - ✅ Loading state → disabled button

- [ ] **Step 12.5: `SignupForm.tsx`** (`SignupForm.test.tsx`)
  - ✅ Renders name + email + password fields
  - ✅ Submit → calls signupAction
  - ✅ Field errors → shows on correct field

- [ ] **Step 12.6: `CharacterCard.tsx`** (`CharacterCard.test.tsx`)
  - ✅ Shows name, emoji, personality
  - ✅ Click → select handler

- [ ] **Step 12.7: `CharacterSelector.tsx`** (`CharacterSelector.test.tsx`)
  - ✅ Renders grid with all characters
  - ✅ Character selection → callback

---

## Phase 13: Supabase Storage Tests

- [ ] **Step 13.1: `lib/supabase/storage.ts`** (`storage.test.ts`)
  - ✅ `uploadImageToStorage(base64, userId)` → decode + upload + public URL
  - ❌ Invalid base64 → error
  - ✅ `deleteImagesFromStorage(urls)` → batch delete
  - ❌ Delete failure → silent (logged, not thrown)
  - Mock: Supabase Storage client

---

## Phase 14: E2E Tests (Playwright)

> **Why?** E2E tests the entire flow from browser to DB and back. Catches integration issues between layers.

- [ ] **Step 14.1: Auth E2E** (`auth.spec.ts`)
  - ✅ Signup → redirect to /chat
  - ✅ Login → redirect to /chat
  - ✅ Logout → redirect to /login
  - ✅ Unauthenticated → redirect to /login on /chat
  - ✅ Authenticated → redirect to /chat on /login

- [ ] **Step 14.2: Chat E2E** (`chat.spec.ts`)
  - ✅ Character selection → new chat → send message
  - ✅ Assistant response streams (text appears gradually)
  - ✅ Refresh → messages persist (from DB)
  - ✅ Navigate between different conversations

- [ ] **Step 14.3: Characters E2E** (`characters.spec.ts`)
  - ✅ See all 3 characters
  - ✅ Selection → chat with correct character

- [ ] **Step 14.4: Knowledge Base E2E** (`knowledge.spec.ts`)
  - ✅ Add manual entry → see in list
  - ✅ Upload PDF → parsing + embedding + visible entry
  - ✅ Edit entry → updated content
  - ✅ Delete entry → removed from list
  - ✅ Toggle chunk active/inactive

- [ ] **Step 14.5: Conversations E2E** (`conversations.spec.ts`)
  - ✅ New chat → see in sidebar
  - ✅ Rename conversation
  - ✅ Delete conversation → removed
  - ✅ Click conversation → loads messages

---

## Phase 15: CI/CD Integration

> **Why?** Automatic tests on every PR. Code only merges if tests pass.

- [ ] **Step 15.1: Update `ci.yml` — Unit + Integration Tests**

  ```yaml
  - name: Run unit & integration tests
    run: npm run test:run
    env:
      # Env vars for mocks (not real API keys)
      NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: test-key
      OPENROUTER_API_KEY: test-key
      UPSTASH_REDIS_REST_URL: http://localhost:8079
      UPSTASH_REDIS_REST_TOKEN: test-token
  ```

- [ ] **Step 15.2: Coverage Threshold**

  ```yaml
  - name: Run tests with coverage
    run: npm run test:coverage -- --reporter=json --outputFile=coverage.json

  - name: Check coverage threshold
    run: |
      # Minimum 70% line coverage for merge
      # Will gradually increase to 85%+
  ```

- [ ] **Step 15.3: Playwright E2E Job (Separate)**

  ```yaml
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [ci] # Only if unit tests pass
    if: github.event_name == 'pull_request' # Only on PR, not on push

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env:
          # Real test env vars (staging Supabase)
          # or local Supabase instance
  ```

- [ ] **Step 15.4: PR Status Checks**
  - Required checks before merge:
    - ✅ Lint (ESLint)
    - ✅ Typecheck (tsc --noEmit)
    - ✅ Unit tests (vitest)
    - ✅ Build (next build)
  - Optional (non-blocking):
    - ⚠️ E2E tests (Playwright)
    - ⚠️ Coverage report

---

## Phase Priority

| Priority | Phase                    | Rationale                             |
| -------- | ------------------------ | ------------------------------------- |
| 🔴 P0    | Phase 0 (Setup)          | Without infrastructure, nothing works |
| 🔴 P0    | Phase 1 (Schemas)        | Fast, easy, protects API contracts    |
| 🔴 P0    | Phase 15 (CI/CD)         | Integrate early, block PRs from day 1 |
| 🟠 P1    | Phase 2 (Utils)          | Pure functions, high value            |
| 🟠 P1    | Phase 3 (DAL)            | Security boundary, ownership checks   |
| 🟠 P1    | Phase 5 (Rate Limit)     | Security critical                     |
| 🟡 P2    | Phase 4 (RAG Services)   | Core business logic                   |
| 🟡 P2    | Phase 6 (Server Actions) | Auth + form handling                  |
| 🟡 P2    | Phase 7 (API Routes)     | Full integration pipeline             |
| 🟢 P3    | Phase 8 (OpenRouter)     | Streaming logic                       |
| 🟢 P3    | Phase 9 (Image Gen)      | Graceful degradation                  |
| 🟢 P3    | Phase 10 (TTS)           | External API                          |
| 🟢 P3    | Phase 11 (Hooks)         | Client state management               |
| 🔵 P4    | Phase 12 (Components)    | UI rendering                          |
| 🔵 P4    | Phase 13 (Storage)       | Storage operations                    |
| 🔵 P4    | Phase 14 (E2E)           | Full browser flow                     |

---

## Metrics

| Metric                | Starting Goal  | Target Goal          |
| --------------------- | -------------- | -------------------- |
| Line coverage         | 70%            | 85%+                 |
| Branch coverage       | 60%            | 75%+                 |
| Zod schema coverage   | 100%           | 100%                 |
| API route coverage    | 100%           | 100%                 |
| DAL function coverage | 100%           | 100%                 |
| E2E critical paths    | 5 flows        | 10+ flows            |
| CI pipeline time      | < 3 min (unit) | < 5 min (unit + E2E) |

---

## Notes

- **MSW** is the single mock layer — don't use separate mocks for fetch, axios, etc.
- **`server-only`** imports must be mocked in test environment (noop module)
- **Supabase RPC** (`match_documents`, `swap_chunks`) tested via mocking `supabase.rpc()`
- **Streaming tests** use custom `ReadableStream` mocks
- **E2E tests** can use staging Supabase or local instance (`supabase start`)
- **Don't test** shadcn/ui components (only test our wrappers)
- **Don't test** LangChain internals (only test our integration with mocked LangChain)

---

**Last Updated:** April 16, 2026
**Project:** SavageAI Test Plan
**Tech Stack:** Vitest 3 + React Testing Library + MSW 2 + Playwright
