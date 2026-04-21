import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Import component — no UI mocks needed, use flexible queries
// ---------------------------------------------------------------------------

import AuthError from '@/app/(auth)/error';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(cleanup);

describe('AuthError boundary', () => {
  const mockReset = vi.fn();
  const mockError = new Error('Test authentication error');

  it('renders the "Something went wrong" heading', () => {
    render(<AuthError error={mockError} reset={mockReset} />);

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('renders a "Try again" button', () => {
    render(<AuthError error={mockError} reset={mockReset} />);

    // Button renders as a native <button> element with text "Try again"
    const button = screen.getByRole('button', { name: /try again/i });
    expect(button).toBeInTheDocument();
  });

  it('calls reset() when the "Try again" button is clicked', async () => {
    const reset = vi.fn();
    render(<AuthError error={mockError} reset={reset} />);

    await userEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('does not expose the raw error stack to the user', () => {
    const errorWithStack = Object.assign(new Error('Secret internal error'), {
      stack: 'Error: Secret internal error\n  at sensitiveFunction (src/secret.ts:42)',
    });

    render(<AuthError error={errorWithStack} reset={mockReset} />);

    // Stack trace should not be visible in the rendered output
    expect(screen.queryByText(/sensitiveFunction/)).not.toBeInTheDocument();
    expect(screen.queryByText(/secret\.ts/)).not.toBeInTheDocument();
  });

  it('renders an error description to guide the user', () => {
    render(<AuthError error={mockError} reset={mockReset} />);

    // At least one element contains guidance text
    const allText = screen.getAllByText(/error occurred|unexpected error|please try again/i);
    expect(allText.length).toBeGreaterThanOrEqual(1);
  });
});

