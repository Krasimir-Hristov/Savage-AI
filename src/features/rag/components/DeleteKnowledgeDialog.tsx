'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { useDeleteKnowledge } from '@/features/rag/hooks/use-knowledge';
import type { KnowledgeEntry } from '@/types/knowledge';

interface DeleteKnowledgeDialogProps {
  entry: KnowledgeEntry | null;
  onOpenChange: (open: boolean) => void;
}

export const DeleteKnowledgeDialog = ({
  entry,
  onOpenChange,
}: DeleteKnowledgeDialogProps): React.JSX.Element => {
  const deleteMutation = useDeleteKnowledge();

  const handleDelete = async (): Promise<void> => {
    if (!entry) return;
    await deleteMutation.mutateAsync(entry.id);
    onOpenChange(false);
  };

  const title = entry?.title ?? entry?.file_name ?? 'this entry';

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Knowledge Entry</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{title}</strong>? This will permanently remove
            the entry and all its embedded chunks. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {deleteMutation.error && (
          <p className='text-sm text-destructive'>{deleteMutation.error.message}</p>
        )}

        <DialogFooter>
          <Button
            variant='ghost'
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button variant='destructive' onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? (
              <>
                <Loader2 className='size-4 animate-spin mr-2' />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
