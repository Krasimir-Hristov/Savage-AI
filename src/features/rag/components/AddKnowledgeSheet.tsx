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
import { FileDropZone } from '@/features/rag/components/FileDropZone';
import { useCreateKnowledge, useUploadKnowledge } from '@/features/rag/hooks/use-knowledge';

interface AddKnowledgeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddKnowledgeSheet = ({
  open,
  onOpenChange,
}: AddKnowledgeSheetProps): React.JSX.Element => {
  const [tab, setTab] = useState<string>('write');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createMutation = useCreateKnowledge();
  const uploadMutation = useUploadKnowledge();

  const isPending = createMutation.isPending || uploadMutation.isPending;

  const reset = (): void => {
    setTitle('');
    setContent('');
    setSelectedFile(null);
    createMutation.reset();
    uploadMutation.reset();
  };

  const handleClose = (nextOpen: boolean): void => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleSubmitManual = async (): Promise<void> => {
    if (!content.trim()) return;
    try {
      await createMutation.mutateAsync({
        title: title.trim() || undefined,
        content: content.trim(),
      });
      handleClose(false);
    } catch {
      // Error is surfaced via createMutation.error
    }
  };

  const handleSubmitFile = async (): Promise<void> => {
    if (!selectedFile) return;
    try {
      await uploadMutation.mutateAsync({ file: selectedFile, title: title.trim() || undefined });
      handleClose(false);
    } catch {
      // Error is surfaced via uploadMutation.error
    }
  };

  const error = createMutation.error?.message ?? uploadMutation.error?.message;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className='w-full sm:max-w-lg overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>Add Knowledge</SheetTitle>
          <SheetDescription>
            Add text or upload a file to your personal knowledge base.
          </SheetDescription>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className='mt-4'>
          <TabsList className='w-full'>
            <TabsTrigger value='write' className='flex-1'>
              Write
            </TabsTrigger>
            <TabsTrigger value='upload' className='flex-1'>
              Upload
            </TabsTrigger>
          </TabsList>

          {/* Shared title field */}
          <div className='mt-4 space-y-2'>
            <label htmlFor='kb-title' className='text-sm font-medium'>
              Title <span className='text-muted-foreground'>(optional)</span>
            </label>
            <Input
              id='kb-title'
              placeholder='e.g. My Resume, Project Notes'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
            />
          </div>

          <TabsContent value='write' className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='kb-content' className='text-sm font-medium'>
                Content
              </label>
              <Textarea
                id='kb-content'
                className='min-h-50 resize-y'
                placeholder='Paste or type your text here...'
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPending}
              />
            </div>

            {error && <p className='text-sm text-destructive'>{error}</p>}

            <Button
              className='w-full'
              onClick={handleSubmitManual}
              disabled={isPending || !content.trim()}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className='size-4 animate-spin mr-2' />
                  Embedding…
                </>
              ) : (
                'Save & Embed'
              )}
            </Button>
          </TabsContent>

          <TabsContent value='upload' className='space-y-4'>
            <FileDropZone onFile={setSelectedFile} disabled={isPending} />

            {selectedFile && (
              <p className='text-sm text-muted-foreground'>
                Selected: <span className='font-medium text-foreground'>{selectedFile.name}</span> (
                {(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}

            {error && <p className='text-sm text-destructive'>{error}</p>}

            <Button
              className='w-full'
              onClick={handleSubmitFile}
              disabled={isPending || !selectedFile}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className='size-4 animate-spin mr-2' />
                  Processing & Embedding…
                </>
              ) : (
                'Upload & Embed'
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
