import React from 'react';

import Link from 'next/link';

import AppLogo from '@/shared/components/AppLogo';
import { UserMenu } from '@/shared/components/layout/UserMenu';

interface MainHeaderProps {
  email: string;
  displayName: string | null;
  mobileSidebar: React.ReactNode;
}

const MainHeader = ({ email, displayName, mobileSidebar }: MainHeaderProps): React.JSX.Element => (
  <header className='shrink-0 flex items-center justify-between px-4 h-12 border-b border-border bg-background md:hidden'>
    {mobileSidebar}
    <Link href='/'>
      <AppLogo size='sm' />
    </Link>
    <UserMenu email={email} displayName={displayName} />
  </header>
);

export default MainHeader;
