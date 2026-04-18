import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from '../auth.schema';

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

  describe('security — malicious input', () => {
    it('rejects XSS payload in email field', () => {
      const result = loginSchema.safeParse({
        email: '<script>alert("xss")</script>',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.email).toBeDefined();
    });

    it('rejects SQL injection string in email field', () => {
      const result = loginSchema.safeParse({
        email: "' OR '1'='1",
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.email).toBeDefined();
    });

    it('rejects null bytes in email', () => {
      const result = loginSchema.safeParse({
        email: 'user\x00@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
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
    it('rejects XSS payload in email field', () => {
      const result = signupSchema.safeParse({
        name: 'Ivan',
        email: '<img src=x onerror=alert(1)>',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.email).toBeDefined();
    });

    it('rejects SQL injection string in email field', () => {
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
