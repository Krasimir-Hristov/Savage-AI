import { LandingNav } from '@/features/landing/components/LandingNav';
import { LandingHero } from '@/features/landing/components/LandingHero';
import { LandingFeatures } from '@/features/landing/components/LandingFeatures';
import { LandingCharacters } from '@/features/landing/components/LandingCharacters';
import { LandingDemo } from '@/features/landing/components/LandingDemo';
import { LandingPricing } from '@/features/landing/components/LandingPricing';
import { LandingFooter } from '@/features/landing/components/LandingFooter';
import { getOptionalUser } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';

const Home = async (): Promise<React.JSX.Element> => {
  const user = await getOptionalUser();
  let isOnWaitlist = false;
  if (user?.email) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('waitlist')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      isOnWaitlist = !!data;
    } catch (error) {
      console.error('Failed to check waitlist status:', error);
    }
  }
  return (
    <div className='flex flex-col min-h-screen bg-background'>
      <LandingNav user={user} />
      <main className='flex flex-col flex-1'>
        <LandingHero />
        <LandingFeatures />
        <LandingCharacters />
        <LandingDemo />
        <LandingPricing userId={user?.userId} initialNotified={isOnWaitlist} />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Home;
