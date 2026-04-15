import React from 'react';

import { KnowledgePage } from '@/features/rag/components/KnowledgePage';

export const dynamic = 'force-dynamic';

const KnowledgeRoute = (): React.JSX.Element => {
  return <KnowledgePage />;
};

export default KnowledgeRoute;
