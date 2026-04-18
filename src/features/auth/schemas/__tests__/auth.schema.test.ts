import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from '@/features/auth/schemas/auth.schema';

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------

describe('loginSchema', () => {
  describe('valid inputs', () => {
    it('accepts a valid email and password ≥ 8 chars', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts a password of exactly 8 characters', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '12345678',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects an invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.email).toBeDefined();
    });

    it('rejects a password shorter than 8 characters', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.password).toBeDefined();
    });

    it('rejects a missing email', () => {
      const result = loginSchema.safeParse({
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.email).toBeDefined();
    });

    it('rejects a missing password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.password).toBeDefined();
    });

    it('rejects an empty object', () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // loginSchema validates email FORMAT only — it does not sanitize content.
  // Payloads below are rejected because they are not valid email addresses,
  // not because the schema performs content sanitization.
  describe('email field — format validation only (no content sanitization)', () => {
    it('rejects XSS payload in email field (invalid email format)', () => {
      const result = loginSchema.safeParse({
        email: '<script>alert("xss")</script>',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.email).toBeDefined();
    });

    it('rejects SQL injection string in email field (invalid email format)', () => {
      const result = loginSchema.safeParse({
        email: "' OR '1'='1",
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.email).toBeDefined();
    });

    it('rejects null bytes in email (invalid email format)', () => {
      const result = loginSchema.safeParse({
        email: 'user\x00@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
    // Note: loginSchema enforces RFC email format only — it does not sanitize content.
    // Content-level protection is handled downstream via parameterized queries and output encoding.
  });
});

// ---------------------------------------------------------------------------
// signupSchema
// ---------------------------------------------------------------------------

describe('signupSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid name, email and password', () => {
      const result = signupSchema.safeParse({
        name: 'Ivan Ivanov',
        email: 'ivan@example.com',
        password: 'securePass1',
      });
      expect(result.success).toBe(true);
    });

    it('accepts a name with exactly 2 characters', () => {
      const result = signupSchema.safeParse({
        name: 'Al',
        email: 'al@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts a name with exactly 50 characters', () => {
      const result = signupSchema.safeParse({
        name: 'A'.repeat(50),
        email: 'long@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('trims whitespace from name', () => {
      const result = signupSchema.safeParse({
        name: '  Ivan  ',
        email: 'ivan@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Ivan');
      }
    });
  });

  describe('invalid inputs', () => {
    it('rejects a name shorter than 2 characters', () => {
      const result = signupSchema.safeParse({
        name: 'A',
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.name).toBeDefined();
    });

    it('rejects a name longer than 50 characters', () => {
      const result = signupSchema.safeParse({
        name: 'A'.repeat(51),
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.name).toBeDefined();
    });

    it('rejects an invalid email', () => {
      const result = signupSchema.safeParse({
        name: 'Ivan',
        email: 'not-valid',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.email).toBeDefined();
    });

    it('rejects a password shorter than 8 characters', () => {
      const result = signupSchema.safeParse({
        name: 'Ivan',
        email: 'ivan@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.password).toBeDefined();
    });

    it('rejects missing fields', () => {
      const result = signupSchema.safeParse({});
      expect(result.success).toBe(false);
      const errors = result.error?.flatten().fieldErrors;
      expect(errors?.name).toBeDefined();
      expect(errors?.email).toBeDefined();
      expect(errors?.password).toBeDefined();
    });
  });

  describe('security — malicious input', () => {
    // name field — schema-level content sanitization via regex /^[^<>"\x00]+$/
    it('rejects HTML script tag in name field', () => {
      const result = signupSchema.safeParse({
        name: '<script>alert("xss")</script>',
        email: 'ivan@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.name).toBeDefined();
    });

    it('rejects HTML image injection in name field', () => {
      const result = signupSchema.safeParse({
        name: '<img src=x onerror=alert(1)>',
        email: 'ivan@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.name).toBeDefined();
    });

    it('rejects null bytes in name field', () => {
      const result = signupSchema.safeParse({
        name: 'Ivan\x00',
        email: 'ivan@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.name).toBeDefined();
    });

    it("accepts a name with an apostrophe (e.g. O'Brien)", () => {
      const result = signupSchema.safeParse({
        name: "O'Brien",
        email: 'obrien@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    // email field — rejected by format validation (not content sanitization)
    it('rejects XSS payload in email field (invalid email format)', () => {
      const result = signupSchema.safeParse({
        name: 'Ivan',
        email: '<img src=x onerror=alert(1)>',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.email).toBeDefined();
    });

    it('rejects SQL injection string in email field (invalid email format)', () => {
      const result = signupSchema.safeParse({
        name: 'Ivan',
        email: "admin'--",
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.email).toBeDefined();
    });
  });
});
