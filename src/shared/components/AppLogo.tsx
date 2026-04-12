import React from 'react';

import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'h-7',
  md: 'h-8',
  lg: 'h-9',
} as const;

interface AppLogoProps {
  size?: keyof typeof sizeClasses;
  className?: string;
}

const AppLogo = ({ size = 'md', className }: AppLogoProps): React.JSX.Element => (
  <img src='/logo.svg' alt='SavageAI' className={cn('w-auto', sizeClasses[size], className)} />
);

export default AppLogo;
