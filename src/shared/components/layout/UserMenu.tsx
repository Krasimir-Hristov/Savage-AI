'use client';

import React from 'react';

import { BookOpen, LogOut, User } from 'lucide-react';
import Link from 'next/link';

import { logoutAction } from '@/features/auth/actions/auth.actions';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

interface UserMenuProps {
  email: string;
  displayName: string | null;
}

const getInitials = (name: string | null, email: string): string => {
  if (name) {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
};

export const UserMenu = ({ email, displayName }: UserMenuProps): React.JSX.Element => {
  const initials = getInitials(displayName, email);
  const label = displayName ?? email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          aria-label='User menu'
          className='rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring'
        >
          <Avatar size='sm'>
            <AvatarFallback className='bg-primary/20 text-primary text-[10px] font-semibold'>
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-52'>
        <DropdownMenuLabel className='flex items-center gap-2'>
          <User size={14} className='text-muted-foreground shrink-0' />
          <span className='truncate text-sm font-normal text-muted-foreground'>{label}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href='/knowledge' className='flex items-center gap-2'>
            <BookOpen size={14} />
            Knowledge Base
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant='destructive'
          onClick={async () => {
            await logoutAction();
          }}
        >
          <LogOut size={14} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
