'use client';

import React, { useState } from 'react';

import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import type { Character } from '@/types/character';
import { cn } from '@/lib/utils';

export interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export const CharacterCard = ({
  character,
  isSelected,
  onSelect,
  disabled = false,
}: CharacterCardProps): React.JSX.Element => {
  const [avatarError, setAvatarError] = useState(false);

  const handleClick = (): void => {
    if (!disabled) {
      onSelect(character.id);
    }
  };

  return (
    <Card
      role='button'
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'relative cursor-pointer select-none gap-3 p-4 transition-all duration-150',
        'ring-1',
        isSelected
          ? 'bg-muted ring-border'
          : 'hover:bg-card/80 ring-foreground/10 hover:ring-foreground/20',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <CheckCircle2
          size={16}
          className={cn('absolute top-3 right-3 shrink-0', character.ui.colorClass)}
          aria-hidden='true'
        />
      )}

      {/* Avatar */}
      <div className='relative flex items-center justify-center size-14 rounded-full bg-muted shrink-0 mx-auto overflow-hidden'>
        {!avatarError && character.avatar ? (
          <Image
            src={character.avatar}
            alt={character.name}
            width={56}
            height={56}
            className='rounded-full object-cover'
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div className='flex items-center justify-center size-full bg-linear-to-br from-muted to-muted-foreground text-white text-sm font-semibold'>
            {character.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Name + personality */}
      <div className='text-center space-y-1'>
        <p
          className={cn(
            'font-heading font-semibold text-sm leading-tight',
            character.ui.colorClass
          )}
        >
          {character.name}
        </p>
        <p className='text-xs text-muted-foreground leading-snug line-clamp-2'>
          {character.personality}
        </p>
      </div>

      {/* Select button */}
      <Button
        variant={isSelected ? 'secondary' : 'outline'}
        size='sm'
        tabIndex={-1}
        aria-hidden='true'
        className='w-full pointer-events-none'
      >
        {isSelected ? 'Selected' : 'Select'}
      </Button>
    </Card>
  );
};
