import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Message } from '@/types/chat';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock('react-markdown', () => ({
  default: ({ children, skipHtml }: { children: string; skipHtml?: boolean }) => (
    <div data-testid='markdown' data-skip-html={String(skipHtml)}>
      {children}
    </div>
  ),
}));

vi.mock('rehype-highlight', () => ({ default: () => null }));
vi.mock('remark-gfm', () => ({ default: () => null }));

vi.mock('@/shared/components/CharacterAvatar', () => ({
  CharacterAvatar: ({ name }: { name: string }) => (
    <div data-testid='character-avatar' aria-label={name}>
      {name}
    </div>
  ),
}));

vi.mock('@/features/chat/components/ImageMessage', () => ({
  ImageMessage: ({ imageUrl }: { imageUrl: string }) => (
    <img data-testid='image-message' src={imageUrl} alt='Generated' />
  ),
}));

vi.mock('@/shared/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ComponentPropsWithRef<'button'>) => (
    <button {...props}>{children}</button>
  ),
}));

// ---------------------------------------------------------------------------
// Import component AFTER mocks
// ---------------------------------------------------------------------------

import { ChatMessage } from '@/features/chat/components/ChatMessage';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'test-id',
  conversation_id: 'conv-id',
  role: 'user',
  content: 'Hello, world!',
  model: null,
  image_url: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

const CHARACTER_ID = 'angry-grandpa';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChatMessage', () => {
  describe('user message', () => {
    it('aligns to the right (justify-end)', () => {
      const { container } = render(
        <ChatMessage message={makeMessage({ role: 'user', content: 'Hi!' })} characterId={CHARACTER_ID} />
      );

      // Outermost div has justify-end
      const outer = container.firstElementChild as HTMLElement;
      expect(outer.className).toContain('justify-end');
    });

    it('renders the user message content', () => {
      render(
        <ChatMessage message={makeMessage({ role: 'user', content: 'Hello from user' })} characterId={CHARACTER_ID} />
      );

      expect(screen.getByText('Hello from user')).toBeInTheDocument();
    });

    it('does NOT render a character avatar for user messages', () => {
      render(
        <ChatMessage message={makeMessage({ role: 'user' })} characterId={CHARACTER_ID} />
      );

      expect(screen.queryByTestId('character-avatar')).not.toBeInTheDocument();
    });
  });

  describe('assistant message', () => {
    it('aligns to the left (flex gap-3, no justify-end)', () => {
      const { container } = render(
        <ChatMessage
          message={makeMessage({ role: 'assistant', content: 'I am the assistant' })}
          characterId={CHARACTER_ID}
        />
      );

      const outer = container.firstElementChild as HTMLElement;
      expect(outer.className).not.toContain('justify-end');
      expect(outer.className).toContain('flex');
    });

    it('renders the character avatar', () => {
      render(
        <ChatMessage
          message={makeMessage({ role: 'assistant', content: 'Hi' })}
          characterId={CHARACTER_ID}
        />
      );

      const avatars = screen.getAllByTestId('character-avatar');
      expect(avatars.length).toBeGreaterThanOrEqual(1);
    });

    it('renders the character name', () => {
      render(
        <ChatMessage
          message={makeMessage({ role: 'assistant', content: 'Hi' })}
          characterId={CHARACTER_ID}
        />
      );

      // The character name "Angry Grandpa" appears as a span in the message header
      const matches = screen.getAllByText('Angry Grandpa');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('renders markdown content via ReactMarkdown', () => {
      render(
        <ChatMessage
          message={makeMessage({ role: 'assistant', content: '**Bold text**' })}
          characterId={CHARACTER_ID}
        />
      );

      const markdowns = screen.getAllByTestId('markdown');
      const markdownWithContent = markdowns.find((el) =>
        el.textContent?.includes('**Bold text**')
      );
      expect(markdownWithContent).toBeDefined();
    });

    it('passes skipHtml to ReactMarkdown (XSS prevention)', () => {
      render(
        <ChatMessage
          message={makeMessage({ role: 'assistant', content: '<script>alert(1)</script>' })}
          characterId={CHARACTER_ID}
        />
      );

      // Our mock exposes data-skip-html so we can verify the prop was passed
      const markdowns = screen.getAllByTestId('markdown');
      expect(markdowns[0].getAttribute('data-skip-html')).toBe('true');
    });

    it('renders an image when image_url is present', () => {
      render(
        <ChatMessage
          message={makeMessage({
            role: 'assistant',
            content: 'Here is your image',
            image_url: 'https://example.com/test.jpg',
          })}
          characterId={CHARACTER_ID}
        />
      );

      expect(screen.getByTestId('image-message')).toBeInTheDocument();
    });

    it('shows typing indicator when isStreaming and content is empty', () => {
      const { container } = render(
        <ChatMessage
          message={makeMessage({ role: 'assistant', content: '' })}
          characterId={CHARACTER_ID}
          isStreaming
        />
      );

      // Typing indicator: 3 bouncing spans inside the bubble
      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });

    it('shows cursor blink while streaming with content', () => {
      const { container } = render(
        <ChatMessage
          message={makeMessage({ role: 'assistant', content: 'Typing...' })}
          characterId={CHARACTER_ID}
          isStreaming
        />
      );

      // Cursor blink: animate-pulse span
      const cursor = container.querySelector('.animate-pulse');
      expect(cursor).toBeInTheDocument();
    });
  });

  describe('security — XSS prevention', () => {
    it('does not inject <script> elements from message content', () => {
      const { container } = render(
        <ChatMessage
          message={makeMessage({
            role: 'assistant',
            content: '<script>document.title="hacked"</script>Hello',
          })}
          characterId={CHARACTER_ID}
        />
      );

      // skipHtml=true must be forwarded to ReactMarkdown — the real component
      // uses it to prevent raw HTML from being parsed into DOM elements.
      // Our mock records it as data-skip-html so we can assert it was passed.
      const markdown = container.querySelector('[data-testid="markdown"]');
      expect(markdown).toHaveAttribute('data-skip-html', 'true');
      expect(container.querySelector('script')).not.toBeInTheDocument();
    });

    it('does not inject <img onerror> elements from message content', () => {
      const { container } = render(
        <ChatMessage
          message={makeMessage({
            role: 'assistant',
            content: '<img src=x onerror="alert(1)">',
          })}
          characterId={CHARACTER_ID}
        />
      );

      // skipHtml=true is forwarded — real ReactMarkdown won't parse this HTML.
      const markdown = container.querySelector('[data-testid="markdown"]');
      expect(markdown).toHaveAttribute('data-skip-html', 'true');
      // No img with onerror from injected content (only safe mocked avatars present)
      const images = container.querySelectorAll('img');
      images.forEach((img) => {
        expect(img.getAttribute('onerror')).toBeNull();
      });
    });
  });

  describe('accessibility', () => {
    it('assistant avatar has an accessible label with the character name', () => {
      render(
        <ChatMessage
          message={makeMessage({ role: 'assistant', content: 'Hi' })}
          characterId={CHARACTER_ID}
        />
      );

      // Our CharacterAvatar mock renders with aria-label={name}
      const avatars = screen.getAllByLabelText('Angry Grandpa');
      expect(avatars.length).toBeGreaterThanOrEqual(1);
    });
  });
});
