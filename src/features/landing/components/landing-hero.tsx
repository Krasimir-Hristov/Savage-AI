import Link from 'next/link';

export const LandingHero = (): React.JSX.Element => {
  return (
    <section
      aria-label='Hero'
      className='relative min-h-[85vh] flex flex-col items-center justify-center px-6 overflow-hidden bg-black'
    >
      {/* Background glow blobs */}
      <div className='absolute inset-0 z-0 opacity-20 pointer-events-none' aria-hidden='true'>
        <div className='absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#DC2626] blur-[160px]' />
        <div className='absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#ff5555] blur-[160px]' />
      </div>

      <div className='relative z-10 max-w-5xl text-center'>
        <span className='font-heading text-[#DC2626] uppercase tracking-[0.2em] text-xs font-bold mb-6 block'>
          The Future of Interaction
        </span>
        <h1 className='font-(family-name:--font-sora) text-5xl md:text-8xl font-extrabold tracking-tight leading-[0.9] text-white mb-8'>
          AI WITH AN <br />
          <span className='text-transparent bg-clip-text bg-linear-to-r from-[#DC2626] via-[#ff5555] to-[#ff5555]'>
            ATTITUDE.
          </span>
        </h1>
        <p className='text-xl md:text-2xl text-zinc-400 font-light max-w-2xl mx-auto mb-12'>
          Useful. Brutally Honest.{' '}
          <span className='text-white font-medium'>Zero filters, no corporate fluff.</span> Just the
          answers you need with the grit you expect.
        </p>
        <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
          <Link
            href='/login'
            className='w-full sm:w-auto px-10 py-5 bg-[#DC2626] text-[#0e0e10] font-(family-name:--font-sora) font-bold text-lg rounded hover:scale-[1.02] transition-transform active:scale-95 shadow-[0px_0px_30px_rgba(255,141,139,0.3)]'
          >
            Start Free
          </Link>
          <a
            href='#demo'
            className='w-full sm:w-auto px-10 py-5 border border-white/20 hover:border-[#DC2626] text-white font-(family-name:--font-sora) font-bold text-lg rounded hover:bg-white/5 transition-all'
          >
            See Demo
          </a>
        </div>
      </div>

      {/* Decorative watermark */}
      <div
        className='absolute bottom-10 left-6 hidden lg:block opacity-[0.03] pointer-events-none select-none'
        aria-hidden='true'
      >
        <span className='text-[12rem] font-black uppercase text-white leading-none'>SAVAGE</span>
      </div>
    </section>
  );
};
