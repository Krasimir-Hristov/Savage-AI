'use client';

import React, { useState } from 'react';

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

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

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
          <span className='text-lg leading-none'>{selectedCharacter?.ui.emoji ?? '👤'}</span>
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
