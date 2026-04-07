import React from 'react';

import { getConversations, getUser, verifySession } from '@/lib/dal';
import MainHeader from '@/shared/components/layout/main-header';
import { UserMenu } from '@/shared/components/layout/user-menu';

import { DesktopSidebar, MobileSidebar } from './sidebar-wrapper';

const MainLayout = async ({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> => {
  const { userId } = await verifySession();
  const [user, conversations] = await Promise.all([getUser(), getConversations(userId)]);

  const preferredCharacter = user.preferred_character ?? 'angry-grandpa';
  const email = user.display_name ?? '';

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      {/* Desktop sidebar — hidden on mobile */}
      <DesktopSidebar
        initialConversations={conversations}
        preferredCharacter={preferredCharacter}
      />

      {/* Main content column */}
      <div className='flex flex-col flex-1 min-w-0 overflow-hidden'>
        {/* Mobile header — only visible below md */}
        <MainHeader
          email={email}
          displayName={user.display_name}
          mobileSidebar={
            <MobileSidebar
              initialConversations={conversations}
              preferredCharacter={preferredCharacter}
            />
          }
        />

        {/* Desktop top-right user menu — only visible md+ */}
        <div className='hidden md:flex shrink-0 items-center justify-end px-4 h-12 border-b border-border'>
          <UserMenu email={email} displayName={user.display_name} />
        </div>

        <main className='flex-1 min-h-0 overflow-hidden'>{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
