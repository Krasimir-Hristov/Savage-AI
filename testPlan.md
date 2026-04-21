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
│   │   │   └── utils.test.ts
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── schemas/
│   │   │   │   ├── __tests__/
│   │   │   │   │   └── auth.schema.test.ts
│   │   ├── chat/
│   │   │   ├── api/
│   │   │   │   ├── __tests__/
│   │   │   │   │   └── chat.schema.test.ts
│   │   ├── rag/
│   │   │   ├── api/
│   │   │   │   ├── __tests__/
│   │   │   │   │   └── knowledge.schema.test.ts
│   │
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── chat-message.test.tsx
│   │   │   ├── chat-input.test.tsx
│   │   │   └── character-card.test.tsx
│
├── test/
│   ├── setup.ts                         # Global setup (MSW, mocks)
│   ├── mocks/
│   │   ├── handlers.ts                  # MSW handlers
│   │   ├── server.ts                    # MSW server
│   │   ├── supabase.ts                  # Supabase mock
│   │   ├── openrouter.ts                # OpenRouter mock
│   │   └── server-only.ts               # Vite alias mock for server-only package
│   └── fixtures/
│       ├── users.ts
│       ├── conversations.ts
│       └── messages.ts
```

---

## Phase 0: Infrastructure Setup ✅

> **Goal:** Configure the test environment before writing any tests.

- [x] Install Vitest + React Testing Library + MSW
- [x] Configure `vitest.config.ts` (happy-dom, path aliases, coverage)
- [x] Configure `test/setup.ts` (MSW server, global mocks)
- [x] Create MSW handlers for Supabase + OpenRouter
- [x] Add test scripts to `package.json`
- [x] Configure `.github/workflows/ci.yml` for CI
- [x] Verify test infrastructure works with a smoke test

---

## Phase 1: Zod Schema Tests 🔄

> **Why first?** Schemas are pure functions without dependencies. Test easily and prevent regression on API contract changes.

- [x] **Step 1.1: Auth schemas** (`auth.schema.test.ts`)
  - ✅ `loginSchema` — valid email + password ≥ 8 chars
  - ❌ Invalid email, short password, missing fields
  - ❌ XSS in email field, SQL injection strings

- [x] **Step 1.2: Chat schema** (`chat.schema.test.ts`)
  - ✅ `chatRequestSchema` — valid messages (1-50), characterId, conversationId (UUID)
  - ❌ Empty messages array, > 50 messages
  - ❌ Invalid conversationId (not UUID)
  - ❌ Unknown characterId

- [x] **Step 1.3: Knowledge schemas** (`knowledge.schema.test.ts`)
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

## Phase 2: Pure Utility Function Tests

> **Goal:** Test `src/lib/utils.ts` and similar pure functions.

- [x] **Step 2.1: cn() utility** (`utils.test.ts`)
  - ✅ Merges class names correctly
  - ✅ Handles conditional classes
  - ✅ Overrides conflicting Tailwind classes

- [x] **Step 2.2: formatDate() utility**
  - ✅ Formats timestamps
  - ✅ Handles edge cases (today, yesterday)

---

## Phase 3: Character Data Tests

> **Goal:** Test character definitions in `src/features/characters/data/`.

- [x] **Step 3.1: Character definitions** (`characters.test.ts`)
  - ✅ Each character has required fields (id, name, systemPrompt, avatar)
  - ✅ System prompts are non-empty strings
  - ✅ Character IDs are unique slugs

---

## Phase 4: Server Action Tests

> **Goal:** Test auth Server Actions with mocked Supabase.

- [x] **Step 4.1: loginAction** (`auth.actions.test.ts`)
  - ✅ Successful login → redirect to /chat
  - ❌ Wrong password → returns error
  - ❌ Invalid email format → Zod error (no Supabase call)
  - ❌ Network error → graceful error message

- [x] **Step 4.2: signupAction** (`signup.action.test.ts`)
  - ✅ Successful signup → redirect to /chat
  - ❌ Email already exists → returns error
  - ❌ Weak password → Zod error
  - ❌ Missing fields → Zod error

- [x] **Step 4.3: logoutAction** (`auth.actions.test.ts`)
  - ✅ Successful logout → redirect to /login
  - ❌ Supabase error → returns {success: false}, no redirect (error path exits early)

---

## Phase 5: DAL (Data Access Layer) Tests

> **Goal:** Test `src/lib/dal.ts` with mocked Supabase client.

- [ ] **Step 5.1: verifySession()** (`dal.test.ts`)
  - ✅ Valid session → returns user
  - ❌ No session → redirects to /login
  - ❌ Expired session → redirects to /login

- [ ] **Step 5.2: getConversations()** (`dal.test.ts`)
  - ✅ Returns conversations for authenticated user
  - ✅ Returns empty array if no conversations
  - ❌ Unauthenticated → throws/redirects

- [ ] **Step 5.3: getMessages()** (`dal.test.ts`)
  - ✅ Returns messages for owned conversation
  - ❌ Non-existent conversation → returns empty
  - ❌ Other user's conversation → returns empty (RLS)

---

## Phase 6: API Route Tests (Unit)

> **Goal:** Test API route handlers with mocked dependencies.

- [ ] **Step 6.1: POST /api/chat** (`chat/route.test.ts`)
  - ✅ Valid request → starts streaming response
  - ❌ Unauthenticated → 401
  - ❌ Invalid body (Zod) → 400
  - ❌ Rate limited → 429
  - ❌ OpenRouter error → 500

- [ ] **Step 6.2: GET /api/conversations** (`conversations/route.test.ts`)
  - ✅ Returns user's conversations
  - ❌ Unauthenticated → 401
  - ❌ Rate limited → 429

- [ ] **Step 6.3: POST /api/knowledge** (`knowledge/route.test.ts`)
  - ✅ Valid upload → creates knowledge entry
  - ❌ File too large → 400
  - ❌ Unsupported MIME → 400
  - ❌ Unauthenticated → 401

---

## Phase 7: React Component Tests

> **Goal:** Test UI components with React Testing Library.

- [ ] **Step 7.1: ChatMessage component** (`chat-message.test.tsx`)
  - ✅ Renders user message on right side
  - ✅ Renders assistant message on left side
  - ✅ Renders markdown content correctly
  - ✅ Shows avatar for assistant

- [ ] **Step 7.2: ChatInput component** (`chat-input.test.tsx`)
  - ✅ Renders input and send button
  - ✅ Calls onSend when Enter is pressed
  - ✅ Calls onSend when button is clicked
  - ✅ Disabled when isLoading is true
  - ✅ Clears input after send

- [ ] **Step 7.3: CharacterCard component** (`character-card.test.tsx`)
  - ✅ Renders character name and avatar
  - ✅ Calls onSelect when clicked
  - ✅ Shows selected state when isSelected

---

## Phase 8: Custom Hook Tests

> **Goal:** Test `useChat` and `useCharacters` hooks.

- [ ] **Step 8.1: useChat hook** (`use-chat.test.ts`)
  - ✅ Initial state (empty messages, not loading)
  - ✅ sendMessage adds user message optimistically
  - ✅ Streaming response updates assistant message
  - ✅ isLoading is true during streaming
  - ❌ Network error → sets error state

- [ ] **Step 8.2: useCharacters hook** (`use-characters.test.ts`)
  - ✅ Returns list of characters
  - ✅ selectCharacter updates selectedCharacter
  - ✅ Default character is null

---

## Phase 9: Integration Tests (API + DB)

> **Goal:** Test full request/response cycles with MSW mocking external services.

- [ ] **Step 9.1: Chat flow integration** (`chat.integration.test.ts`)
  - ✅ Send message → OpenRouter called → response streamed
  - ✅ Messages saved to DB after stream
  - ❌ OpenRouter timeout → error handled

- [ ] **Step 9.2: Auth flow integration** (`auth.integration.test.ts`)
  - ✅ Signup → profile created → redirect
  - ✅ Login → session set → redirect
  - ✅ Logout → session cleared → redirect

---

## Phase 10: Rate Limiting Tests

> **Goal:** Test rate limiting middleware.

- [ ] **Step 10.1: chatRateLimit** (`ratelimit.test.ts`)
  - ✅ Under limit → request allowed
  - ❌ Over limit (20 req/10s) → 429 returned
  - ✅ Rate limit headers present in response

- [ ] **Step 10.2: getClientIP()** (`ratelimit.test.ts`)
  - ✅ Extracts IP from x-forwarded-for
  - ✅ Extracts IP from x-real-ip
  - ✅ Falls back to 'anonymous'

---

## Phase 11: Error Boundary Tests

> **Goal:** Test error.tsx boundaries and loading.tsx skeletons.

- [ ] **Step 11.1: Auth error boundary** (`(auth)/error.test.tsx`)
  - ✅ Renders error message
  - ✅ Shows retry button

- [ ] **Step 11.2: Main error boundary** (`(main)/error.test.tsx`)
  - ✅ Renders error message
  - ✅ Does not expose stack trace to user

---

## Phase 12: Security Tests

> **Goal:** Test security-critical paths.

- [ ] **Step 12.1: XSS prevention**
  - ✅ Message content is escaped in render
  - ✅ Character name is escaped
  - ❌ Script injection → not executed

- [ ] **Step 12.2: Auth bypass prevention**
  - ❌ Direct API call without session → 401
  - ❌ Accessing other user's conversation → empty result
  - ❌ Manipulated conversationId → RLS blocks it

---

## Phase 13: Accessibility Tests

> **Goal:** Basic a11y checks with jest-axe or similar.

- [ ] **Step 13.1: Chat interface a11y**
  - ✅ Input has label/placeholder
  - ✅ Send button has aria-label
  - ✅ Messages have correct roles

- [ ] **Step 13.2: Auth forms a11y**
  - ✅ Form labels are associated with inputs
  - ✅ Error messages are accessible

---

## Phase 14: Performance Tests

> **Goal:** Ensure no major performance regressions.

- [ ] **Step 14.1: Schema validation performance**
  - ✅ 1000 validations complete in < 100ms

- [ ] **Step 14.2: Character system prompt loading**
  - ✅ CHARACTERS constant is cached (not re-evaluated per request)

---

## Phase 15: E2E Tests (Playwright)

> **Goal:** Full user journey tests in real browser.

- [ ] **Step 15.1: Auth flow E2E**
  - ✅ Signup → verify email (if enabled) → login → dashboard
  - ✅ Logout → redirected to login page
  - ❌ Wrong credentials → error shown

- [ ] **Step 15.2: Chat flow E2E**
  - ✅ Select character → type message → see streaming response
  - ✅ New conversation created → appears in sidebar
  - ✅ Reload page → conversation history loads

- [ ] **Step 15.3: Mobile viewport E2E**
  - ✅ Sidebar collapses on mobile
  - ✅ Chat input is accessible on mobile
  - ✅ Touch events work correctly

---

## CI/CD Integration

```yaml
# .github/workflows/ci.yml
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run test:run # Vitest unit tests
      - run: npm run test:coverage # Coverage report
      # Playwright E2E — add in Phase 15
      # - run: npx playwright install
      # - run: npm run test:e2e
```

**Test commands:**

```bash
npm test              # Watch mode (development)
npm run test:run      # CI mode (one-shot)
npm run test:coverage # With coverage report
npm run test:ui       # Browser UI
```

---

## Coverage Targets

| Area               | Target | Priority |
| ------------------ | ------ | -------- |
| Zod schemas        | 100%   | High     |
| Server Actions     | 90%    | High     |
| DAL functions      | 90%    | High     |
| API routes         | 80%    | High     |
| React components   | 70%    | Medium   |
| Custom hooks       | 80%    | Medium   |
| Utility functions  | 95%    | High     |
| E2E critical paths | 100%   | High     |
