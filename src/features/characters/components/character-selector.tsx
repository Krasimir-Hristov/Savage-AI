'use client';

import React from 'react';

import { CharacterCard } from '@/features/characters/components/character-card';
import { cn } from '@/lib/utils';
import type { Character } from '@/types/character';

interface CharacterSelectorProps {
  characters: Character[];
  selectedCharacterId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

export const CharacterSelector = ({
  characters,
  selectedCharacterId,
  onSelect,
  disabled = false,
  title = 'Choose who starts this chat',
  description = 'Pick one character before sending the first message. Once the conversation starts, the choice is locked.',
  className,
}: CharacterSelectorProps): React.JSX.Element => {
  return (
    <section className={cn('shrink-0 border-b border-border bg-card/40 px-4 py-4', className)}>
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-4'>
        <div className='space-y-1'>
          <h2 className='font-heading text-base font-semibold text-foreground'>{title}</h2>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              isSelected={character.id === selectedCharacterId}
              onSelect={onSelect}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
