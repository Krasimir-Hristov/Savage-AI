import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// cn()
// ---------------------------------------------------------------------------

describe('cn()', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes — false value is excluded', () => {
    expect(cn('foo', false && 'bar')).toBe('foo');
  });

  it('handles conditional classes — true value is included', () => {
    expect(cn('foo', true && 'bar')).toBe('foo bar');
  });

  it('handles undefined and null values gracefully', () => {
    expect(cn('foo', undefined, null)).toBe('foo');
  });

  it('overrides conflicting Tailwind padding classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('overrides conflicting Tailwind text-color classes (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('returns empty string when no classes are provided', () => {
    expect(cn()).toBe('');
  });
});


