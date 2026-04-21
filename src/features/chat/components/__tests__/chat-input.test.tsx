import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/shared/components/VoiceCallButton', () => ({
  VoiceCallButton: ({ onClick, disabled, isLoading }: {
    onClick: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  }) => (
    <button
      data-testid='voice-call-button'
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label='Start voice call'
    >
      Call
    </button>
  ),
}));

// ---------------------------------------------------------------------------
// Import component AFTER mocks
// ---------------------------------------------------------------------------

import { ChatInput } from '@/features/chat/components/ChatInput';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const CHARACTER_ID = 'angry-grandpa';

const defaultProps = {
  onSend: vi.fn(),
  isStreaming: false,
  characterId: CHARACTER_ID,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(cleanup);

// Helper: get the main textarea (happy-dom may expose multiple textbox roles)
const getTextarea = () => screen.getAllByRole('textbox')[0];

describe('ChatInput', () => {
  describe('rendering', () => {
    it('renders a textarea', () => {
      render(<ChatInput {...defaultProps} />);

      expect(getTextarea()).toBeInTheDocument();
    });

    it('renders the send button with aria-label="Send message"', () => {
      render(<ChatInput {...defaultProps} />);

      // getByLabelText finds the button by its aria-label attribute
      expect(screen.getByLabelText(/send message/i)).toBeInTheDocument();
    });

    it('renders the character-specific placeholder', () => {
      render(<ChatInput {...defaultProps} />);

      // angry-grandpa ui.placeholder = "Ask the old man something... if you dare."
      expect(screen.getByPlaceholderText(/ask the old man something/i)).toBeInTheDocument();
    });
  });

  describe('sending messages', () => {
    it('calls onSend when the send button is clicked', async () => {
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const textarea = getTextarea();
      await userEvent.type(textarea, 'Hello!');
      await userEvent.click(screen.getByLabelText(/send message/i));

      expect(onSend).toHaveBeenCalledWith('Hello!');
    });

    it('calls onSend when Enter is pressed (without Shift)', async () => {
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const textarea = getTextarea();
      await userEvent.type(textarea, 'Hi there');
      await userEvent.keyboard('{Enter}');

      expect(onSend).toHaveBeenCalledWith('Hi there');
    });

    it('does NOT call onSend when Shift+Enter is pressed', async () => {
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const textarea = getTextarea();
      await userEvent.type(textarea, 'New line');
      await userEvent.keyboard('{Shift>}{Enter}{/Shift}');

      expect(onSend).not.toHaveBeenCalled();
    });

    it('clears the textarea after send', async () => {
      render(<ChatInput {...defaultProps} />);

      const textarea = getTextarea();
      await userEvent.type(textarea, 'Clear me after send');
      await userEvent.keyboard('{Enter}');

      expect(textarea).toHaveValue('');
    });

    it('does NOT call onSend for whitespace-only input', async () => {
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const textarea = getTextarea();
      await userEvent.type(textarea, '   ');
      await userEvent.keyboard('{Enter}');

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe('disabled states', () => {
    it('disables textarea and send button when isStreaming is true', () => {
      render(<ChatInput {...defaultProps} isStreaming />);

      expect(getTextarea()).toBeDisabled();
      expect(screen.getByLabelText(/send message/i)).toBeDisabled();
    });

    it('shows "Wait for response..." placeholder when isStreaming', () => {
      render(<ChatInput {...defaultProps} isStreaming />);

      expect(screen.getByPlaceholderText('Wait for response...')).toBeInTheDocument();
    });

    it('disables textarea when disabled prop is true', () => {
      render(<ChatInput {...defaultProps} disabled />);

      expect(getTextarea()).toBeDisabled();
    });
  });

  describe('voice call button', () => {
    it('does not render VoiceCallButton when onStartVoiceCall is not provided', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.queryByTestId('voice-call-button')).not.toBeInTheDocument();
    });

    it('renders VoiceCallButton when onStartVoiceCall is provided', () => {
      render(<ChatInput {...defaultProps} onStartVoiceCall={vi.fn()} />);

      expect(screen.getByTestId('voice-call-button')).toBeInTheDocument();
    });

    it('calls onStartVoiceCall when voice button is clicked', async () => {
      const onStartVoiceCall = vi.fn();
      render(<ChatInput {...defaultProps} onStartVoiceCall={onStartVoiceCall} />);

      await userEvent.click(screen.getByTestId('voice-call-button'));

      expect(onStartVoiceCall).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('send button has accessible name "Send message"', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByLabelText(/send message/i)).toBeInTheDocument();
    });

    it('textarea has a placeholder (implicit accessible description)', () => {
      render(<ChatInput {...defaultProps} />);

      const textarea = getTextarea();
      expect(textarea).toHaveAttribute('placeholder');
    });
  });
});
