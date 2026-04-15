'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPT =
  '.pdf,.docx,.csv,.txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.go,.rs,.c,.cpp,.h,.json,.xml,.yaml,.yml,.html,.css,.sql,.sh';

interface FileDropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export const FileDropZone = ({
  onFile,
  disabled,
  className,
}: FileDropZoneProps): React.JSX.Element => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [disabled, onFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
      // Reset so same file can be picked again
      e.target.value = '';
    },
    [onFile]
  );

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role='button'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type='file'
        accept={ACCEPT}
        onChange={handleChange}
        className='sr-only'
        disabled={disabled}
      />
      <Upload className='size-8 text-muted-foreground' />
      <div>
        <p className='text-sm font-medium'>Drop a file here or click to browse</p>
        <p className='text-xs text-muted-foreground mt-1'>
          PDF, DOCX, CSV, TXT, Markdown, Code — max 10 MB
        </p>
      </div>
    </div>
  );
};
