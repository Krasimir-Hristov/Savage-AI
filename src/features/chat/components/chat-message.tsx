'use client';

import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { CHARACTERS } from '@/features/characters/data';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';

class MarkdownErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <p className='text-sm text-muted-foreground italic'>Failed to render message.</p>;
    }
    return this.props.children;
  }
}

interface CopyCodeButtonProps {
  preRef: React.RefObject<HTMLPreElement | null>;
}

const CopyCodeButton = ({ preRef }: CopyCodeButtonProps): React.JSX.Element => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    const text = preRef.current?.innerText ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access may be denied in some contexts
    }
  };

  return (
    <Button
      onClick={handleCopy}
      aria-label='Copy code'
      variant='ghost'
      size='icon'
      className='absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground bg-white/10'
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </Button>
  );
};

const CodeBlock = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}): React.JSX.Element => {
  const preRef = useRef<HTMLPreElement>(null);

  return (
    <div className='relative group my-3'>
      <CopyCodeButton preRef={preRef} />
      <pre
        ref={preRef}
        className={cn('rounded-lg overflow-x-auto text-sm bg-[#0d1117]! p-4!', className)}
      >
        {children}
      </pre>
    </div>
  );
};

interface ChatMessageProps {
  message: Message;
  characterId: string;
  isStreaming?: boolean;
}

export const ChatMessage = ({
  message,
  characterId,
  isStreaming = false,
}: ChatMessageProps): React.JSX.Element => {
  const isUser = message.role === 'user';
  const character = CHARACTERS[characterId];
  const ui = character?.ui ?? CHARACTERS['angry-grandpa']?.ui;
  const characterName = character?.name ?? 'Unknown';
  const isEmpty = !message.content && isStreaming;

  if (isUser) {
    return (
      <div className='flex justify-end mb-4'>
        <div className='max-w-[75%] rounded-2xl rounded-tr-sm bg-primary/20 border border-primary/30 px-4 py-2.5 text-sm text-foreground'>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className='flex gap-3 mb-4'>
      {/* Character avatar */}
      <div className='shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base bg-muted border border-border'>
        {ui?.emoji}
      </div>

      <div className='flex-1 min-w-0'>
        {/* Character name */}
        <span className={cn('text-xs font-medium mb-1 block', ui?.colorClass)}>{characterName}</span>

        {/* Message bubble */}
        <div className='rounded-2xl rounded-tl-sm bg-muted/50 border border-border px-4 py-2.5'>
          {isEmpty ? (
            /* Typing indicator — 3 bouncing dots while waiting for first token */
            <div className='flex gap-1 items-center h-5'>
              <span className='w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]' />
              <span className='w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]' />
              <span className='w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce' />
            </div>
          ) : (
            <div className='markdown-content'>
              <MarkdownErrorBoundary>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  skipHtml
                  components={{ pre: CodeBlock }}
                >
                  {message.content}
                </ReactMarkdown>
              </MarkdownErrorBoundary>
              {isStreaming && (
                <span className='inline-block w-0.5 h-4 bg-foreground/60 animate-pulse align-middle ml-0.5' />
              )}
            </div>
          )}
        </div>

        {/* Timestamp — only shown after streaming is complete */}
        {message.created_at && !isStreaming && (
          <span className='text-xs text-muted-foreground mt-1 block pl-1'>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  );
};
