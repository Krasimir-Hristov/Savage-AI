'use client';

import { Download } from 'lucide-react';

interface ImageMessageProps {
  imageUrl: string;
  alt?: string;
}

const downloadImage = async (url: string): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `savage-ai-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank');
  }
};

export const ImageMessage = ({
  imageUrl,
  alt = 'Generated image',
}: ImageMessageProps): React.JSX.Element => {
  return (
    <div className='my-3'>
      <div className='relative group inline-block rounded-xl overflow-hidden border border-border'>
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic AI-generated images from Supabase Storage */}
        <img
          src={imageUrl}
          alt={alt}
          className='max-w-full max-h-128 rounded-xl object-contain'
          loading='lazy'
        />
        <button
          onClick={() => downloadImage(imageUrl)}
          className='absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 cursor-pointer'
          aria-label='Download image'
        >
          <Download size={16} />
        </button>
      </div>
    </div>
  );
};
