import { LandingNav } from '@/features/landing/components/landing-nav';
import { LandingHero } from '@/features/landing/components/landing-hero';
import { LandingFeatures } from '@/features/landing/components/landing-features';
import { LandingCharacters } from '@/features/landing/components/landing-characters';
import { LandingDemo } from '@/features/landing/components/landing-demo';
import { LandingPricing } from '@/features/landing/components/landing-pricing';
import { LandingFooter } from '@/features/landing/components/landing-footer';
import { getOptionalUser } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';

const Home = async (): Promise<React.JSX.Element> => {
  const user = await getOptionalUser();
  let isOnWaitlist = false;
  if (user?.email) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();
    isOnWaitlist = !!data;
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
