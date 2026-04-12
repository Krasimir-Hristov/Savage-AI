import { ShieldAlert, Zap, Shield } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ShieldAlert,
    title: 'Zero Filter',
    description:
      "We don't babysit. Get the raw, unedited truth on any topic. From coding advice to life choices, we tell it like it is.",
  },
  {
    icon: Zap,
    title: 'Token-Speed',
    description:
      'Ultra-fast streaming that keeps up with your brain. No "thinking..." spinners. Just immediate, aggressive output.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description:
      'Powered by Supabase Auth and end-to-end encryption. Your secrets are safe, even if our AI is making fun of them.',
  },
];

export const LandingFeatures = (): React.JSX.Element => {
  return (
    <section id='features' aria-label='Features' className='py-24 px-6 max-w-7xl mx-auto'>
      <h2 className='font-(family-name:--font-sora) text-4xl font-bold text-white mb-16 tracking-tight'>
        ENGINEERED FOR <span className='text-[#DC2626]'>CHAOS.</span>
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {features.map((f) => (
          <div
            key={f.title}
            className='bg-[#131315] p-8 rounded-lg border-l-4 border-[#DC2626] hover:bg-[#1f1f22] transition-colors'
          >
            <div className='w-12 h-12 bg-[#DC2626]/10 rounded flex items-center justify-center mb-6'>
              <f.icon className='text-[#DC2626] w-6 h-6' aria-hidden='true' />
            </div>
            <h3 className='font-(family-name:--font-sora) text-2xl font-bold text-white mb-4'>
              {f.title}
            </h3>
            <p className='text-zinc-400 leading-relaxed'>{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
