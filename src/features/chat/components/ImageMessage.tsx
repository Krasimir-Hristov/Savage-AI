'use client';

import { Download } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';

interface ImageMessageProps {
  imageUrl: string;
  alt?: string;
}

const downloadImage = async (url: string): Promise<void> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `savage-ai-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
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
        <Button
          variant='ghost'
          size='icon'
          onClick={() => downloadImage(imageUrl)}
          className='absolute top-2 right-2 h-8 w-8 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-black/70'
          aria-label='Download image'
        >
          <Download size={16} />
        </Button>
      </div>
    </div>
  );
};
