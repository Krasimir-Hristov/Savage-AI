'use client';

import React, { useState } from 'react';

import Image from 'next/image';

import { cn } from '@/lib/utils';

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 64,
} as const;

interface CharacterAvatarProps {
  avatar: string;
  name: string;
  size?: keyof typeof sizeMap;
  className?: string;
}

export const CharacterAvatar = ({
  avatar,
  name,
  size = 'md',
  className,
}: CharacterAvatarProps): React.JSX.Element => {
  const [avatarError, setAvatarError] = useState(false);
  const px = sizeMap[size];

  if (!avatarError && avatar) {
    return (
      <div
        className={cn(
          'shrink-0 rounded-full overflow-hidden bg-muted border border-border',
          className
        )}
        style={{ width: px, height: px }}
      >
        <Image
          src={avatar}
          alt={name}
          width={px}
          height={px}
          className='rounded-full object-cover'
          onError={() => setAvatarError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'shrink-0 rounded-full flex items-center justify-center bg-linear-to-br from-muted to-muted-foreground border border-border text-white font-semibold',
        size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-sm' : 'text-xs',
        className
      )}
      style={{ width: px, height: px }}
      role='img'
      aria-label={name}
    >
      {(name?.trim().charAt(0) || '?').toUpperCase()}
    </div>
  );
};
