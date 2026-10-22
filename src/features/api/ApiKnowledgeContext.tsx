import { createContext, useContext } from 'react';
import type { ApiDataset } from './model/knowledge';

export const ApiKnowledgeContext = createContext<ApiDataset | null>(null);

export function useApiKnowledge(): ApiDataset {
  const dataset = useContext(ApiKnowledgeContext);
  if (!dataset) throw new TypeError('API dataset provider is required');
  return dataset;
}
