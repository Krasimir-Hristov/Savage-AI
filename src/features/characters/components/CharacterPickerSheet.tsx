'use client';

import React, { useState, useEffect } from 'react';

import Image from 'next/image';
import { ChevronUp } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import type { Character } from '@/types/character';

import { CharacterSelector } from './CharacterSelector';

interface CharacterPickerSheetProps {
  characters: Character[];
  selectedCharacterId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export const CharacterPickerSheet = ({
  characters,
  selectedCharacterId,
  onSelect,
  disabled = false,
}: CharacterPickerSheetProps): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  // Reset avatarError when selected character changes
  useEffect(() => {
    setAvatarError(false);
  }, [selectedCharacterId]);

  const handleSelect = (id: string): void => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <div className='md:hidden shrink-0 border-b border-border bg-card/40 px-4 py-2'>
      <Button
        variant='outline'
        onClick={() => setOpen(true)}
        disabled={disabled}
        className='w-full flex items-center justify-between gap-2 h-10'
        aria-label='Pick a character'
      >
        <span className='flex items-center gap-2 min-w-0'>
          {!avatarError && selectedCharacter?.avatar ? (
            <Image
              src={selectedCharacter.avatar}
              alt={selectedCharacter.name}
              width={24}
              height={24}
              className='rounded-full object-cover shrink-0 w-6 h-6'
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className='flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold shrink-0'>
              {selectedCharacter?.name.charAt(0)}
            </div>
          )}
          <span className='truncate font-medium text-sm'>
            {selectedCharacter?.name ?? 'Choose a character'}
          </span>
        </span>
        <ChevronUp size={16} className='shrink-0 text-muted-foreground' />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side='bottom'
          className='max-h-[80vh] overflow-y-auto p-0'
          aria-describedby={undefined}
        >
          <SheetHeader className='px-4 pt-4 pb-2'>
            <SheetTitle className='font-heading text-base'>Choose your character</SheetTitle>
          </SheetHeader>
          <CharacterSelector
            characters={characters}
            selectedCharacterId={selectedCharacterId}
            onSelect={handleSelect}
            disabled={disabled}
            title=''
            description=''
            className='border-b-0'
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};
