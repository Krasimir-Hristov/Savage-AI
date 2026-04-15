'use client';

import React from 'react';
import { FileText, Pencil, Trash2, Upload } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/lib/utils';
import type { KnowledgeEntry } from '@/types/knowledge';

interface KnowledgeEntryCardProps {
  entry: KnowledgeEntry;
  onEdit: (entry: KnowledgeEntry) => void;
  onDelete: (entry: KnowledgeEntry) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const KnowledgeEntryCard = ({
  entry,
  onEdit,
  onDelete,
}: KnowledgeEntryCardProps): React.JSX.Element => {
  const isFile = entry.source_type === 'file';
  const title = entry.title ?? entry.file_name ?? 'Untitled entry';

  return (
    <Card className='group relative flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30'>
      <div className='flex items-start gap-3'>
        <div
          className={cn(
            'shrink-0 flex items-center justify-center size-10 rounded-lg',
            isFile ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
          )}
        >
          {isFile ? <Upload className='size-5' /> : <FileText className='size-5' />}
        </div>

        <div className='flex-1 min-w-0'>
          <h3 className='text-sm font-medium truncate'>{title}</h3>
          <p className='text-xs text-muted-foreground mt-0.5 line-clamp-2'>
            {entry.content.slice(0, 200)}
          </p>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Badge variant='secondary' className='text-[10px]'>
            {entry.chunk_count} chunk{entry.chunk_count !== 1 ? 's' : ''}
          </Badge>
          {isFile && entry.file_size && (
            <span className='text-[10px] text-muted-foreground'>
              {formatFileSize(entry.file_size)}
            </span>
          )}
          <span className='text-[10px] text-muted-foreground'>{formatDate(entry.created_at)}</span>
        </div>

        <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity'>
          <Button
            variant='ghost'
            size='icon'
            className='size-7'
            onClick={() => onEdit(entry)}
            aria-label='Edit entry'
          >
            <Pencil className='size-3.5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='size-7 text-destructive hover:text-destructive'
            onClick={() => onDelete(entry)}
            aria-label='Delete entry'
          >
            <Trash2 className='size-3.5' />
          </Button>
        </div>
      </div>
    </Card>
  );
};
