'use client';

import React from 'react';

import { Phone } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';

interface VoiceCallButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const VoiceCallButton = ({
  onClick,
  disabled = false,
  isLoading = false,
  className,
}: VoiceCallButtonProps): React.JSX.Element => (
  <Button
    onClick={onClick}
    disabled={disabled || isLoading}
    size='icon'
    variant='outline'
    aria-label='Start voice call'
    className={cn(
      'shrink-0 mb-0.5 cursor-pointer disabled:cursor-not-allowed border-border/50',
      isLoading && 'animate-pulse',
      className
    )}
  >
    <Phone size={16} />
  </Button>
);
