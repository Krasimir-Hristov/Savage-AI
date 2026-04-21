import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Character } from '@/types/character';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-testid='character-image' />
  ),
}));

// ---------------------------------------------------------------------------
// Import component AFTER mocks
// ---------------------------------------------------------------------------

import { CharacterCard } from '@/features/characters/components/CharacterCard';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const mockCharacter: Character = {
  id: 'angry-grandpa',
  name: 'Angry Grandpa',
  personality: 'Old-school curmudgeon who thinks the modern world is soft',
  avatar: '/avatars/angry-grandpa.jpg',
  systemPrompt: 'You are Angry Grandpa',
  ui: {
    emoji: '👴',
    colorClass: 'text-character-grandpa',
    placeholder: 'Ask the old man something...',
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(cleanup);

describe('CharacterCard', () => {
  describe('rendering', () => {
    it('renders the character name', () => {
      render(
        <CharacterCard
          character={mockCharacter}
          isSelected={false}
          onSelect={vi.fn()}
        />
      );

      expect(screen.getByText('Angry Grandpa')).toBeInTheDocument();
    });

    it('renders the character personality description', () => {
      render(
        <CharacterCard
          character={mockCharacter}
          isSelected={false}
          onSelect={vi.fn()}
        />
      );

      const matches = screen.getAllByText('Old-school curmudgeon who thinks the modern world is soft');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('renders the avatar image with correct alt text', () => {
      render(
        <CharacterCard
          character={mockCharacter}
          isSelected={false}
          onSelect={vi.fn()}
        />
      );

      // next/image mock renders an <img> with alt=character.name
      const imgs = screen.getAllByAltText('Angry Grandpa');
      expect(imgs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('selection', () => {
    it('calls onSelect with character id when clicked', async () => {
      const onSelect = vi.fn();
      render(
        <CharacterCard
          character={mockCharacter}
          isSelected={false}
          onSelect={onSelect}
        />
      );

      // The Card element has role="button" + aria-pressed; target it specifically
      const card = screen.getByRole('button', { pressed: false });
      await userEvent.click(card);

      expect(onSelect).toHaveBeenCalledWith('angry-grandpa');
    });

    it('calls onSelect when Enter is pressed', async () => {
      const onSelect = vi.fn();
      render(
        <CharacterCard
          character={mockCharacter}
          isSelected={false}
          onSelect={onSelect}
        />
      );

      const card = screen.getByRole('button', { pressed: false });
      card.focus();
      await userEvent.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalledWith('angry-grandpa');
    });

    it('calls onSelect when Space is pressed', async () => {
      const onSelect = vi.fn();
      render(
        <CharacterCard
          character={mockCharacter}
          isSelected={false}
          onSelect={onSelect}
        />
      );

      const card = screen.getByRole('button', { pressed: false });
      card.focus();
      await userEvent.keyboard(' ');

      expect(onSelect).toHaveBeenCalledWith('angry-grandpa');
    });

    it('shows "Selected" button label when isSelected is true', () => {
      render(
        <CharacterCard
          character={mockCharacter}
          isSelected
          onSelect={vi.fn()}
        />
      );

      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('shows "Select" button label when isSelected is false', () => {
      render(
        <CharacterCard
          character={mockCharacter}
          isSelected={false}
          onSelect={vi.fn()}
        />
      );

      const selectBtns = screen.getAllByText('Select');
      expect(selectBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('accessibility', () => {
    it('has role="button"', () => {
      render(
        <CharacterCard
          character={mockCharacter}
          isSelected={false}
          onSelect={vi.fn()}
        />
      );

      // Card has role="button" with aria-pressed, inner Button also has role="button"
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('has aria-pressed="true" when selected', () => {
      render(
        <CharacterCard
          character={mockCharacter}
          isSelected
          onSelect={vi.fn()}
        />
      );

      // The Card has aria-pressed={isSelected}
      const card = screen.getByRole('button', { pressed: true });
      expect(card).toHaveAttribute('aria-pressed', 'true');
    });

    it('has aria-pressed="false" when not selected', () => {
      render(
        <CharacterCard
          character={mockCharacter}
          isSelected={false}
          onSelect={vi.fn()}
        />
      );

      const card = screen.getByRole('button', { pressed: false });
      expect(card).toHaveAttribute('aria-pressed', 'false');
    });

    it('has aria-disabled="true" and does not call onSelect when disabled', async () => {
      const onSelect = vi.fn();
      render(
        <CharacterCard
          character={mockCharacter}
          isSelected={false}
          onSelect={onSelect}
          disabled
        />
      );

      // With disabled=true, Card gets aria-disabled="true"
      // (aria-pressed is still "false" since isSelected=false)
      const card = screen.getByRole('button', { pressed: false });
      expect(card).toHaveAttribute('aria-disabled', 'true');

      await userEvent.click(card);
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
