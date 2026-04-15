// RAG feature — no barrel export.
// Server-only modules (dal, services, tools) and client components must be imported directly
// to avoid mixing 'server-only' with 'use client' contexts.
//
// Server imports:
//   import { ... } from '@/features/rag/dal'
//   import { ... } from '@/features/rag/services/search'
//   import { ... } from '@/features/rag/tools/search-knowledge'
//
// Client imports:
//   import { KnowledgePage } from '@/features/rag/components/KnowledgePage'
//   import { useKnowledgeEntries, ... } from '@/features/rag/hooks/use-knowledge'
