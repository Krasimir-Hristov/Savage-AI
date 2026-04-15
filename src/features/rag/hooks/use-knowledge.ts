'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { KnowledgeEntry, KnowledgeEntryWithChunks } from '@/types/knowledge';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
const KEYS = {
  all: ['knowledge'] as const,
  detail: (id: string) => ['knowledge', id] as const,
};

// ---------------------------------------------------------------------------
// List entries
// ---------------------------------------------------------------------------
export const useKnowledgeEntries = () =>
  useQuery<KnowledgeEntry[]>({
    queryKey: KEYS.all,
    queryFn: async () => {
      const res = await fetch('/api/knowledge');
      if (!res.ok) throw new Error('Failed to fetch knowledge entries');
      return res.json() as Promise<KnowledgeEntry[]>;
    },
    staleTime: 1000 * 60 * 2,
  });

// ---------------------------------------------------------------------------
// Single entry with chunks
// ---------------------------------------------------------------------------
export const useKnowledgeDetail = (id: string) =>
  useQuery<KnowledgeEntryWithChunks>({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/${id}`);
      if (!res.ok) throw new Error('Failed to fetch entry');
      return res.json() as Promise<KnowledgeEntryWithChunks>;
    },
    enabled: !!id,
  });

// ---------------------------------------------------------------------------
// Create entry (manual text)
// ---------------------------------------------------------------------------
export const useCreateKnowledge = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title?: string; content: string }) => {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to create entry');
      }
      return res.json() as Promise<KnowledgeEntry>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
};

// ---------------------------------------------------------------------------
// Upload file
// ---------------------------------------------------------------------------
export const useUploadKnowledge = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, title }: { file: File; title?: string }) => {
      const form = new FormData();
      form.append('file', file);
      if (title) form.append('title', title);

      const res = await fetch('/api/knowledge', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Upload failed');
      }
      return res.json() as Promise<KnowledgeEntry>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
};

// ---------------------------------------------------------------------------
// Update entry (title / content — triggers re-embed if content changed)
// ---------------------------------------------------------------------------
export const useUpdateKnowledge = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; title?: string; content?: string }) => {
      const res = await fetch(`/api/knowledge/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Update failed');
      }
      return res.json() as Promise<KnowledgeEntry>;
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: KEYS.all });
      void qc.invalidateQueries({ queryKey: KEYS.detail(variables.id) });
    },
  });
};

// ---------------------------------------------------------------------------
// Delete entry
// ---------------------------------------------------------------------------
export const useDeleteKnowledge = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Delete failed');
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
};

// ---------------------------------------------------------------------------
// Toggle chunk active/inactive
// ---------------------------------------------------------------------------
export const useToggleChunk = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryId,
      chunkId,
      isActive,
    }: {
      entryId: string;
      chunkId: string;
      isActive: boolean;
    }) => {
      const res = await fetch(`/api/knowledge/${entryId}/chunks/${chunkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Toggle failed');
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: KEYS.detail(variables.entryId) });
    },
  });
};
