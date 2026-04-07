'use client';

import React from 'react';
import { MessageSquarePlus, Menu, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Badge } from '@/shared/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '@/features/characters/data';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat';

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId?: string;
  characterId: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  className?: string;
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const SidebarContent = ({
  conversations,
  currentConversationId,
  characterId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: ChatSidebarProps): React.JSX.Element => {
  const character = CHARACTERS[characterId] ?? CHARACTERS[DEFAULT_CHARACTER_ID];
  const ui = character.ui;

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-border'>
        <span className='font-heading font-semibold text-sm text-foreground tracking-wide'>
          SavageAI
        </span>
        <Button
          onClick={onNewChat}
          variant='ghost'
          size='icon'
          aria-label='New chat'
          className='shrink-0'
        >
          <MessageSquarePlus size={16} />
        </Button>
      </div>

      {/* Active character badge */}
      <div className='px-4 py-2.5 border-b border-border'>
        <div className='flex items-center gap-2'>
          <span className='text-sm'>{ui.emoji}</span>
          <Badge variant='outline' className={cn('text-xs font-medium', ui.colorClass)}>
            {character.name}
          </Badge>
        </div>
      </div>

      {/* Conversations list */}
      <ScrollArea className='flex-1'>
        {conversations.length === 0 ? (
          <div className='px-4 py-8 text-center'>
            <p className='text-xs text-muted-foreground'>No conversations yet.</p>
            <p className='text-xs text-muted-foreground mt-1'>Start one below!</p>
          </div>
        ) : (
          <div className='flex flex-col py-2'>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'group flex items-center gap-1 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors',
                  conv.id === currentConversationId
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-medium truncate'>{conv.title ?? 'New conversation'}</p>
                  <p className='text-[10px] text-muted-foreground/70 mt-0.5'>
                    {formatDate(conv.updated_at)}
                  </p>
                </div>

                {/* Delete dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      aria-label='Conversation options'
                      className='shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal size={12} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className='px-4 py-3 border-t border-border'>
        <Button onClick={onNewChat} variant='outline' size='sm' className='w-full gap-2'>
          <MessageSquarePlus size={14} />
          New Chat
        </Button>
      </div>
    </div>
  );
};

export const ChatSidebar = ({ className, ...props }: ChatSidebarProps): React.JSX.Element => (
  <aside
    className={cn(
      'hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-card h-full',
      className
    )}
  >
    <SidebarContent {...props} />
  </aside>
);

interface MobileSidebarTriggerProps {
  sidebarProps: ChatSidebarProps;
}

export const MobileSidebarTrigger = ({
  sidebarProps,
}: MobileSidebarTriggerProps): React.JSX.Element => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant='ghost' size='icon' aria-label='Open menu' className='md:hidden'>
        <Menu size={18} />
      </Button>
    </SheetTrigger>
    <SheetContent side='left' className='p-0 w-64' showCloseButton={false}>
      <SheetHeader className='sr-only'>
        <SheetTitle>Navigation</SheetTitle>
      </SheetHeader>
      <SidebarContent {...sidebarProps} />
    </SheetContent>
  </Sheet>
);
