'use client';

import React, { useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { AddKnowledgeSheet } from '@/features/rag/components/AddKnowledgeSheet';
import { DeleteKnowledgeDialog } from '@/features/rag/components/DeleteKnowledgeDialog';
import { EditKnowledgeSheet } from '@/features/rag/components/EditKnowledgeSheet';
import { KnowledgeEntryCard } from '@/features/rag/components/KnowledgeEntryCard';
import { useKnowledgeEntries } from '@/features/rag/hooks/use-knowledge';
import type { KnowledgeEntry } from '@/types/knowledge';

const LoadingSkeleton = (): React.JSX.Element => (
  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className='h-32 w-full rounded-xl' />
    ))}
  </div>
);

const EmptyState = ({ onAdd }: { onAdd: () => void }): React.JSX.Element => (
  <div className='flex flex-col items-center justify-center py-20 gap-4 text-center'>
    <div className='flex items-center justify-center size-16 rounded-2xl bg-muted'>
      <BookOpen className='size-8 text-muted-foreground' />
    </div>
    <div>
      <h3 className='text-lg font-semibold'>No knowledge entries yet</h3>
      <p className='text-sm text-muted-foreground mt-1 max-w-sm'>
        Add text notes or upload files to create your personal knowledge base. AI characters will
        use this context to give you better answers.
      </p>
    </div>
    <Button onClick={onAdd}>
      <Plus className='size-4 mr-2' />
      Add Knowledge
    </Button>
  </div>
);

export const KnowledgePage = (): React.JSX.Element => {
  const { data: entries, isLoading, error } = useKnowledgeEntries();

  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<KnowledgeEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<KnowledgeEntry | null>(null);

  return (
    <div className='flex flex-col h-full overflow-y-auto'>
      <div className='max-w-5xl w-full mx-auto px-4 py-6 space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Knowledge Base</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Manage your personal context — AI characters will use it during chat.
            </p>
          </div>
          {entries && entries.length > 0 && (
            <Button onClick={() => setAddOpen(true)} size='sm'>
              <Plus className='size-4 mr-2' />
              Add
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className='text-sm text-destructive bg-destructive/10 rounded-lg p-4'>
            Failed to load knowledge entries: {error.message}
          </div>
        ) : !entries || entries.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} />
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {entries.map((entry) => (
              <KnowledgeEntryCard
                key={entry.id}
                entry={entry}
                onEdit={setEditEntry}
                onDelete={setDeleteEntry}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sheets & Dialogs */}
      <AddKnowledgeSheet open={addOpen} onOpenChange={setAddOpen} />
      <EditKnowledgeSheet entry={editEntry} onOpenChange={(open) => !open && setEditEntry(null)} />
      <DeleteKnowledgeDialog
        entry={deleteEntry}
        onOpenChange={(open) => !open && setDeleteEntry(null)}
      />
    </div>
  );
};
