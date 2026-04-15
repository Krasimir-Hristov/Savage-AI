'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPT =
  '.pdf,.docx,.csv,.txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.go,.rs,.c,.cpp,.h,.json,.xml,.yaml,.yml,.html,.css,.sql,.sh';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

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
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (file: File) => {
      if (file.size > MAX_SIZE) {
        setSizeError(
          `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`
        );
        return;
      }
      setSizeError(null);
      onFile(file);
    },
    [onFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) validateAndEmit(file);
    },
    [disabled, validateAndEmit]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndEmit(file);
      // Reset so same file can be picked again
      e.target.value = '';
    },
    [validateAndEmit]
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
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
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
        {sizeError && <p className='text-xs text-destructive mt-1'>{sizeError}</p>}
      </div>
    </div>
  );
};
