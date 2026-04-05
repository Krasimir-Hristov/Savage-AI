# SavageAI Route Implementation Guide

> **Purpose:** Reference for implementing API routes with required security patterns.  
> **Status:** Grows as routes are created and documented with real code.

---

## 📋 Quick Reference

- **Full Security Rules:** [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) (Section 8: Rate Limiting)
- **Auto-Review Rules:** [`.github/coderabbit.yaml`](./.github/coderabbit.yaml)
- **Utilities:** [`src/lib/ratelimit.ts`](./src/lib/ratelimit.ts) (rate limiters + helpers)
- **Auth Verification:** [`src/lib/dal.ts`](./src/lib/dal.ts) (server-only data access)

---

## ✅ 5-Step Pattern: Every API Route MUST Follow

### 1️⃣ Import Rate Limiter

```typescript
import { chatRateLimit, handleRateLimit, getClientIP } from '@/lib/ratelimit';
```

### 2️⃣ Rate Limit FIRST (before anything else)

```typescript
const ip = getClientIP(req);
const rateLimitResult = await handleRateLimit(chatRateLimit, ip);
if (!rateLimitResult.success) return rateLimitResult.response!;
```

### 3️⃣ Verify Session

```typescript
const session = await verifySession();
if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
```

### 4️⃣ Validate with Zod

```typescript
const result = requestSchema.safeParse(body);
if (!result.success) return new Response(JSON.stringify({ error: 'Invalid' }), { status: 400 });
```

### 5️⃣ Return with Rate Limit Headers

```typescript
return new Response(JSON.stringify({ success: true, data }), {
  headers: { 'Content-Type': 'application/json', ...rateLimitResult.headers },
});
```

---

## 🔒 Available Rate Limiters

Located in `src/lib/ratelimit.ts`:

| Limiter                  | Limit        | Use Case                                 |
| ------------------------ | ------------ | ---------------------------------------- |
| `chatRateLimit`          | 20 req / 10s | `/api/chat` (streaming responses)        |
| `authRateLimit`          | 5 req / 60s  | `/api/auth/*` (login, signup)            |
| `conversationsRateLimit` | 60 req / 60s | `/api/conversations/*` (GET/POST/DELETE) |

Need different limit? Add to `src/lib/ratelimit.ts`:

```typescript
export const newLimiter = new Ratelimit({ ... });
```

---

## 🚫 Critical Rules

- ❌ NEVER skip rate limiting
- ❌ NEVER call rate limit AFTER auth/DB checks
- ❌ NEVER use `parse()` (use `safeParse()`)
- ❌ NEVER catch silently (`catch(e) {}`)
- ❌ NEVER hardcode IP (use `getClientIP()`)
- ❌ NEVER expose secrets to browser

---

## 📝 Implemented Routes

**This section documents REAL routes with actual code.**

### Current Status

- None yet (MVP Phase)

### When Adding a Route

1. Create file: `src/app/api/[resource]/route.ts`
2. Follow 5-step pattern above
3. Test (curl / Postman)
4. CodeRabbit auto-reviews
5. Document here with code snippet

---

**CodeRabbit will flag if you miss rate limiting, validation, or error handling.**

---

**Last Updated:** April 5, 2026  
**Project:** SavageAI MVP
