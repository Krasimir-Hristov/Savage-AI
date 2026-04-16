'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ChunkList } from '@/features/rag/components/ChunkList';
import { useKnowledgeDetail, useUpdateKnowledge } from '@/features/rag/hooks/use-knowledge';
import type { KnowledgeEntry } from '@/types/knowledge';

interface EditKnowledgeSheetProps {
  entry: KnowledgeEntry | null;
  onOpenChange: (open: boolean) => void;
}

// Inner form — keyed by entry.id so React remounts it when a different entry is opened,
// initializing title/content from props once on mount (no useEffect setState needed).
const EditForm = ({
  entry,
  onOpenChange,
}: {
  entry: KnowledgeEntry;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element => {
  const [title, setTitle] = useState(entry.title ?? '');
  const [content, setContent] = useState(entry.content);
  const updateMutation = useUpdateKnowledge();

  const { data: detail, isLoading: isLoadingDetail } = useKnowledgeDetail(entry.id);

  const handleSave = async (): Promise<void> => {
    const payload: { id: string; title?: string; content?: string } = { id: entry.id };
    const newTitle = title.trim();
    const newContent = content.trim();

    if (newTitle !== (entry.title ?? '')) payload.title = newTitle;
    if (newContent !== entry.content) payload.content = newContent;

    // Skip if nothing changed
    if (!('title' in payload) && !('content' in payload)) {
      onOpenChange(false);
      return;
    }

    try {
      await updateMutation.mutateAsync(payload);
      onOpenChange(false);
    } catch {
      // Error is surfaced via updateMutation.error
    }
  };

  const contentChanged = content.trim() !== entry.content;

  return (
    <Tabs defaultValue='edit' className='mt-4'>
      <TabsList className='w-full'>
        <TabsTrigger value='edit' className='flex-1'>
          Edit
        </TabsTrigger>
        <TabsTrigger value='chunks' className='flex-1'>
          Chunks ({entry.chunk_count ?? 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value='edit' className='space-y-4'>
        <div className='space-y-2'>
          <label htmlFor='edit-title' className='text-sm font-medium'>
            Title
          </label>
          <Input
            id='edit-title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={updateMutation.isPending}
          />
        </div>

        <div className='space-y-2'>
          <label htmlFor='edit-content' className='text-sm font-medium'>
            Content
          </label>
          <Textarea
            id='edit-content'
            className='min-h-62.5 resize-y'
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={updateMutation.isPending}
          />
          {contentChanged && (
            <p className='text-xs text-amber-500'>
              Content changed — saving will re-embed all chunks.
            </p>
          )}
        </div>

        {updateMutation.error && (
          <p className='text-sm text-destructive'>{updateMutation.error.message}</p>
        )}

        <Button className='w-full' onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className='size-4 animate-spin mr-2' />
              {contentChanged ? 'Re-embedding…' : 'Saving…'}
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </TabsContent>

      <TabsContent value='chunks'>
        {isLoadingDetail ? (
          <div className='space-y-3 py-2'>
            <Skeleton className='h-20 w-full rounded-lg' />
            <Skeleton className='h-20 w-full rounded-lg' />
            <Skeleton className='h-20 w-full rounded-lg' />
          </div>
        ) : detail?.chunks ? (
          <ChunkList entryId={entry.id} chunks={detail.chunks} />
        ) : (
          <p className='text-sm text-muted-foreground py-4'>No chunks found.</p>
        )}
      </TabsContent>
    </Tabs>
  );
};

export const EditKnowledgeSheet = ({
  entry,
  onOpenChange,
}: EditKnowledgeSheetProps): React.JSX.Element => {
  const isFile = entry?.source_type === 'file';

  return (
    <Sheet open={!!entry} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-lg overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>Edit Knowledge Entry</SheetTitle>
          <SheetDescription>
            {isFile
              ? 'Editing a file-based entry. Changing content will re-embed all chunks.'
              : 'Edit the text content. Changing content triggers re-embedding.'}
          </SheetDescription>
        </SheetHeader>

        {entry && <EditForm key={entry.id} entry={entry} onOpenChange={onOpenChange} />}
      </SheetContent>
    </Sheet>
  );
};
