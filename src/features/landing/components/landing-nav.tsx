'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { logoutAction } from '@/features/auth/actions/auth.actions';

export interface LandingUser {
  email: string;
  userId: string;
  displayName: string | null;
}

interface LandingNavProps {
  user?: LandingUser | null;
}

const getDisplayName = (email: string, displayName: string | null): string => {
  if (displayName) return displayName.toUpperCase();
  return (email.split('@')[0] || 'User').toUpperCase();
};

export const LandingNav = ({ user }: LandingNavProps): React.JSX.Element => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async (): Promise<void> => {
    setLogoutError(null);
    try {
      const result = await logoutAction();
      // logoutAction redirects on success — if we reach here, it failed
      if (!result.success) {
        setLogoutError(result.error?.message ?? 'Failed to sign out. Please try again.');
        return;
      }
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setLogoutError('Failed to sign out. Please try again.');
    }
  };

  return (
    <nav className='sticky top-0 z-50 bg-[#0e0e10] border-b border-white/5'>
      <div className='flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto'>
        <div className='flex items-center gap-8'>
          <Link
            href='/'
            className='text-2xl font-black tracking-tighter text-white uppercase font-heading'
          >
            SavageAI
          </Link>
          <div className='hidden md:flex gap-6'>
            {['features', 'characters', 'pricing'].map((section) => (
              <a
                key={section}
                href={`#${section}`}
                className='font-heading text-sm tracking-tight uppercase text-zinc-400 font-medium hover:text-[#ff5555] transition-colors duration-150'
              >
                {section}
              </a>
            ))}
          </div>
        </div>

        {user ? (
          <div className='relative'>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className='font-heading text-sm tracking-tight uppercase bg-[#DC2626] text-[#0e0e10] px-6 py-2 rounded font-bold hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer'
              aria-label='User menu'
              aria-expanded={isOpen}
            >
              <span>Welcome,</span>
              <span>{getDisplayName(user.email, user.displayName)}</span>
            </button>

            {isOpen && (
              <div className='absolute right-0 mt-2 w-48 bg-[#1f1f22] border border-white/10 rounded shadow-lg z-10'>
                <div className='p-3 border-b border-white/10'>
                  <p className='text-xs text-zinc-500'>Logged in as</p>
                  <p className='text-sm font-medium text-white truncate'>{user.email}</p>
                </div>
                <Link
                  href='/chat'
                  className='block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer'
                  onClick={() => setIsOpen(false)}
                >
                  Go to Chat
                </Link>
                {logoutError && (
                  <p className='px-4 py-2 text-xs text-red-400'>{logoutError}</p>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    void handleLogout();
                  }}
                  className='block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-b cursor-pointer'
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href='/login'
            className='font-heading text-sm tracking-tight uppercase bg-[#DC2626] text-[#0e0e10] px-6 py-2 rounded font-bold hover:scale-105 active:scale-95 transition-transform'
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};
