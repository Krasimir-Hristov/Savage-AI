'use client';

import { useState } from 'react';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { joinWaitlistAction } from '@/features/landing/actions/waitlist.actions';

interface LandingPricingProps {
  userId?: string | null;
  initialNotified?: boolean;
}

const freeTierFeatures = [
  'Standard Character Access',
  '100 Messages / Day',
  'Shared Processing Queue',
];

const savageTierFeatures = [
  'All Elite Characters',
  'Unlimited Brutal Honest Messages',
  'Instant-Zero Latency',
  'Custom Character Builder (Beta)',
];

export const LandingPricing = ({
  userId,
  initialNotified = false,
}: LandingPricingProps): React.JSX.Element => {
  const [notified, setNotified] = useState(initialNotified);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNotify = async (): Promise<void> => {
    if (!userId) {
      router.push('/signup?waitlist=savage');
      return;
    }
    setIsLoading(true);
    try {
      const result = await joinWaitlistAction();
      if (result.success || result.alreadyJoined) {
        setNotified(true);
      }
    } catch (error) {
      console.error('Failed to join waitlist:', error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <section id='pricing' aria-label='Pricing' className='py-24 px-6 bg-[#131315]'>
      <div className='max-w-5xl mx-auto text-center mb-16'>
        <h2 className='font-(family-name:--font-sora) text-4xl md:text-5xl font-extrabold text-white mb-6 uppercase tracking-tight'>
          PAY OR <span className='text-[#DC2626]'>SUFFER.</span>
        </h2>
        <p className='text-zinc-400 max-w-xl mx-auto'>
          Actually, the free tier is pretty good. But the Savage Tier is where the real fun begins.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto'>
        {/* Free Tier */}
        <div className='p-10 rounded-lg bg-[#0e0e10] flex flex-col border border-white/10'>
          <h3 className='font-heading text-zinc-500 uppercase tracking-widest text-sm mb-2'>
            The Free Tier
          </h3>
          <div className='flex items-baseline gap-1 mb-8'>
            <span className='text-5xl font-(family-name:--font-sora) font-extrabold text-white'>
              $0
            </span>
            <span className='text-zinc-500 font-heading'>/forever</span>
          </div>
          <ul className='space-y-4 mb-10 grow'>
            {freeTierFeatures.map((item) => (
              <li key={item} className='flex items-center gap-3 text-zinc-400'>
                <CheckCircle2 size={18} className='text-[#DC2626] shrink-0' aria-hidden='true' />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href='/signup'
            className='w-full py-4 border border-white/20 text-white font-(family-name:--font-sora) font-bold text-center hover:bg-white/5 transition-colors rounded'
          >
            Get Insulted for Free
          </Link>
        </div>

        {/* Savage Tier */}
        <div className='p-10 rounded-lg bg-[#1f1f22] flex flex-col border-2 border-[#DC2626] relative overflow-hidden'>
          <div
            className='absolute top-4 -right-8 bg-[#DC2626] text-[#0e0e10] px-12 py-1 rotate-45 font-heading text-[10px] font-black uppercase tracking-tighter'
            aria-label='Coming Soon'
          >
            Coming Soon
          </div>
          <h3 className='font-heading text-[#DC2626] uppercase tracking-widest text-sm mb-2'>
            The Savage Tier
          </h3>
          <div className='flex items-baseline gap-1 mb-8'>
            <span className='text-5xl font-(family-name:--font-sora) font-extrabold text-white'>
              $19
            </span>
            <span className='text-zinc-500 font-heading'>/mo</span>
            <span className='ml-2 text-xs font-heading text-zinc-500 uppercase tracking-widest self-center'>
              · launching soon
            </span>
          </div>
          <ul className='space-y-4 mb-10 grow'>
            {savageTierFeatures.map((item) => (
              <li key={item} className='flex items-center gap-3 text-white font-medium'>
                <CheckCircle2 size={18} className='text-[#DC2626] shrink-0' aria-hidden='true' />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={handleNotify}
            disabled={notified || isLoading}
            className='w-full py-4 bg-[#DC2626] text-[#0e0e10] font-(family-name:--font-sora) font-bold text-center hover:scale-[1.02] active:scale-[0.98] transition-transform rounded disabled:opacity-80 disabled:scale-100 disabled:cursor-default cursor-pointer'
          >
            {isLoading ? 'Saving...' : notified ? "✓ You're on the list!" : 'Notify Me When Live'}
          </button>
        </div>
      </div>
    </section>
  );
};
