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
  emoji: string;
  name: string;
  size?: keyof typeof sizeMap;
  className?: string;
}

export const CharacterAvatar = ({
  avatar,
  emoji,
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
        'shrink-0 rounded-full flex items-center justify-center bg-muted border border-border',
        size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-base' : 'text-sm',
        className
      )}
      style={{ width: px, height: px }}
      role='img'
      aria-label={name}
    >
      {emoji}
    </div>
  );
};
