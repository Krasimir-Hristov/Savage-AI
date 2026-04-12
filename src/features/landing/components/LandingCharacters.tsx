import Image from 'next/image';
import Link from 'next/link';

const characters = [
  {
    id: 'angry-grandpa',
    name: 'Angry Grandpa',
    tagline: '"He doesn\'t care about your feelings, but he knows how to fix a car."',
    avatar: '/avatars/angry-grandpa.jpg',
  },
  {
    id: 'balkan-dad',
    name: 'Balkan Dad',
    tagline: '"Advice delivered with a side of logic and a lot of shouting."',
    avatar: '/avatars/balkan-dad.jpg',
  },
  {
    id: 'corporate-shark',
    name: 'Corporate Shark',
    tagline: '"Savage efficiency for the business world. ROI or GTFO."',
    avatar: '/avatars/corporate-shark.jpg',
  },
];

export const LandingCharacters = (): React.JSX.Element => {
  return (
    <section id='characters' aria-label='Characters' className='py-24 px-6 max-w-7xl mx-auto'>
      <div className='flex flex-col md:flex-row justify-between items-end mb-16 gap-6'>
        <div>
          <h2 className='font-(family-name:--font-sora) text-4xl font-bold text-white mb-4'>
            CHOOSE YOUR <span className='text-[#DC2626]'>DEMISE.</span>
          </h2>
          <p className='text-zinc-400 text-lg'>
            Pick a personality that matches your tolerance for insults.
          </p>
        </div>
        <Link
          href='/chat'
          className='font-heading text-sm uppercase text-[#DC2626] font-bold flex items-center gap-2 hover:translate-x-2 transition-transform'
        >
          View All Characters{' '}
          <span className='material-symbols-outlined' aria-hidden='true'>
            arrow_forward
          </span>
        </Link>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
        {characters.map((char) => (
          <Link key={char.id} href={`/chat?character=${char.id}`} className='group'>
            <div className='relative aspect-4/5 mb-6 overflow-hidden rounded-lg bg-[#19191c]'>
              <Image
                src={char.avatar}
                alt={char.name}
                fill
                sizes='(max-width: 768px) 100vw, 33vw'
                className='object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500'
              />
              <div className='absolute bottom-0 left-0 w-full p-6 bg-linear-to-t from-black to-transparent'>
                <h3 className='font-(family-name:--font-sora) text-3xl font-bold text-white'>
                  {char.name}
                </h3>
              </div>
            </div>
            <p className='text-zinc-400 leading-relaxed'>{char.tagline}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};
