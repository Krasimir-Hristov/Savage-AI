export const LandingDemo = (): React.JSX.Element => {
  return (
    <section id='demo' aria-label='Streaming demo' className='py-24 px-6 bg-black'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-[#1e1e20] rounded-xl overflow-hidden shadow-2xl border border-white/10'>
          {/* Terminal chrome */}
          <div className='bg-[#262528] px-4 py-3 flex items-center justify-between border-b border-white/10'>
            <div className='flex gap-2' aria-hidden='true'>
              <div className='w-3 h-3 rounded-full bg-red-500' />
              <div className='w-3 h-3 rounded-full bg-yellow-500' />
              <div className='w-3 h-3 rounded-full bg-green-500' />
            </div>
            <div className='text-xs font-heading text-zinc-500 uppercase tracking-widest'>
              SESSION_ACTIVE: BALKAN_DAD
            </div>
            <div className='w-10' aria-hidden='true' />
          </div>
          {/* Terminal body */}
          <div className='p-8 font-mono text-sm md:text-base leading-relaxed'>
            <div className='flex gap-4 mb-6'>
              <span className='text-[#ff5555] font-bold shrink-0'>YOU:</span>
              <span className='text-zinc-300'>
                Hey Dad, I&apos;m thinking about buying a sports car on credit. Thoughts?
              </span>
            </div>
            <div className='flex gap-4'>
              <span className='text-[#DC2626] font-bold shrink-0'>DAD:</span>
              <div className='text-white'>
                Listen to me, you waste of electricity. You have no money, you have no house, and
                you want to pay bank three times price for a metal box that goes fast into a tree?{' '}
                <span className='terminal-cursor inline-block' aria-hidden='true' />
                <br />
                <br />
                <span className='text-zinc-500 italic'>... Balkan Dad is typing ...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
