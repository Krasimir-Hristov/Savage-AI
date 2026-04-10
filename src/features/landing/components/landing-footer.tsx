export const LandingFooter = (): React.JSX.Element => {
  return (
    <footer className='bg-black py-12 px-6 border-t border-white/5'>
      <div className='flex flex-col md:flex-row justify-between items-center gap-8 w-full max-w-7xl mx-auto'>
        <div className='flex flex-col items-center md:items-start gap-4'>
          <span className='text-lg font-black text-white uppercase font-heading'>SavageAI</span>
          <p className='font-heading text-xs tracking-widest uppercase text-zinc-500'>
            &copy; 2026 SavageAI. All rights reserved.
          </p>
        </div>
        <nav aria-label='Footer navigation'>
          <div className='flex gap-8'>
            {['features', 'characters', 'pricing'].map((section) => (
              <a
                key={section}
                href={`#${section}`}
                className='font-heading text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition-colors duration-200'
              >
                {section}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </footer>
  );
};
