'use client';

import React, { useRef, useState } from 'react';
import { MessageSquarePlus, Menu, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { CharacterAvatar } from '@/shared/components/CharacterAvatar';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/shared/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '@/features/characters/data';
import AppLogo from '@/shared/components/AppLogo';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat';

export interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId?: string;
  characterId: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => Promise<void>;
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
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
}: ChatSidebarProps): React.JSX.Element => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingConv, setDeletingConv] = useState<Conversation | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = (conv: Conversation): void => {
    setEditingId(conv.id);
    setEditingTitle(conv.title ?? '');
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  const commitRename = async (): Promise<void> => {
    if (!editingId) return;
    const id = editingId;
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    try {
      await onRenameConversation(id, trimmed);
      setEditingId(null);
    } catch (e) {
      console.error(`Failed to rename conversation ${id}:`, e);
      // Leave editing open so the user can retry
    }
  };

  const cancelEditing = (): void => {
    setEditingId(null);
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-border'>
        <Link href='/'>
          <AppLogo size='md' />
        </Link>
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

      {/* Chat History label */}
      <div className='px-4 py-2.5 border-b border-border'>
        <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
          Chat History
        </p>
      </div>

      {/* Conversations list */}
      <div className='flex-1 overflow-y-auto'>
        {conversations.length === 0 ? (
          <div className='px-4 py-8 text-center'>
            <p className='text-xs text-muted-foreground'>No conversations yet.</p>
            <p className='text-xs text-muted-foreground mt-1'>Start one below!</p>
          </div>
        ) : (
          <div className='flex flex-col py-2'>
            {conversations.map((conv) => {
              const convChar = CHARACTERS[conv.character_id] ?? CHARACTERS[DEFAULT_CHARACTER_ID];
              return (
                <div
                  key={conv.id}
                  role='button'
                  tabIndex={0}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    conv.id === currentConversationId
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                  onClick={() => {
                    if (editingId !== conv.id) onSelectConversation(conv.id);
                  }}
                  onKeyDown={(e) => {
                    if (editingId !== conv.id && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSelectConversation(conv.id);
                    }
                  }}
                >
                  <CharacterAvatar
                    avatar={convChar.avatar}
                    emoji={convChar.ui.emoji}
                    name={convChar.name}
                    size='sm'
                    className='shrink-0'
                  />
                  <div className='flex-1 min-w-0'>
                    {editingId === conv.id ? (
                      <Input
                        ref={inputRef}
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => {
                          void commitRename();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void commitRename();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEditing();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className='h-auto px-0 py-0 text-xs font-medium bg-transparent border-0 border-b border-border rounded-none shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:border-foreground text-foreground'
                        maxLength={100}
                      />
                    ) : (
                      <>
                        <p className='text-xs font-medium truncate'>
                          {conv.title ?? 'New conversation'}
                        </p>
                        <p className='text-[10px] text-muted-foreground/70 mt-0.5'>
                          {formatDate(conv.updated_at)}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Rename + Delete buttons — visible on row hover or keyboard focus */}
                  <div className='flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      aria-label='Rename conversation'
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(conv);
                      }}
                      className='cursor-pointer h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted'
                    >
                      <Pencil size={12} />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      aria-label='Delete conversation'
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingConv(conv);
                      }}
                      className='cursor-pointer h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-950'
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className='px-4 py-3 border-t border-border'>
        <Button
          onClick={onNewChat}
          variant='outline'
          size='sm'
          className='w-full gap-2 cursor-pointer'
        >
          <MessageSquarePlus size={14} />
          New Chat
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deletingConv}
        onOpenChange={(open) => {
          if (!open) setDeletingConv(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
            <DialogDescription>
              {deletingConv?.title
                ? `"${deletingConv.title}" will be permanently deleted.`
                : 'This conversation will be permanently deleted.'}{' '}
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Cancel</Button>
            </DialogClose>
            <Button
              variant='destructive'
              onClick={() => {
                if (deletingConv) {
                  onDeleteConversation(deletingConv.id);
                  setDeletingConv(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <SheetContent
      side='left'
      className='p-0 w-64'
      showCloseButton={false}
      aria-describedby={undefined}
    >
      <SheetHeader className='sr-only'>
        <SheetTitle>Navigation</SheetTitle>
      </SheetHeader>
      <SidebarContent {...sidebarProps} />
    </SheetContent>
  </Sheet>
);
