'use client';

import React from 'react';
import { Switch } from '@/shared/components/ui/switch';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToggleChunk } from '@/features/rag/hooks/use-knowledge';
import type { DocumentChunk } from '@/types/knowledge';

interface ChunkListProps {
  entryId: string;
  chunks: DocumentChunk[];
}

export const ChunkList = ({ entryId, chunks }: ChunkListProps): React.JSX.Element => {
  const { mutate: toggleChunk, isPending } = useToggleChunk();

  if (chunks.length === 0) {
    return <p className='text-sm text-muted-foreground py-4'>No chunks yet.</p>;
  }

  return (
    <ScrollArea className='max-h-100'>
      <div className='flex flex-col gap-3'>
        {chunks
          .sort((a, b) => a.chunk_index - b.chunk_index)
          .map((chunk) => (
            <div
              key={chunk.id}
              className={cn(
                'rounded-lg border p-3 text-sm transition-opacity',
                !chunk.is_active && 'opacity-40'
              )}
            >
              <div className='flex items-center justify-between gap-3 mb-2'>
                <span className='text-xs font-medium text-muted-foreground'>
                  Chunk #{chunk.chunk_index + 1}
                </span>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-muted-foreground'>
                    {chunk.is_active ? 'Active' : 'Disabled'}
                  </span>
                  <Switch
                    checked={chunk.is_active}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      toggleChunk({ entryId, chunkId: chunk.id, isActive: checked })
                    }
                  />
                </div>
              </div>
              <p className='text-xs text-foreground/80 whitespace-pre-wrap line-clamp-6'>
                {chunk.content}
              </p>
            </div>
          ))}
      </div>
    </ScrollArea>
  );
};
