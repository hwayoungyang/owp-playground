import type { PublicApiKind } from './types';

export const publicApiKindLabels = {
  component: 'Component',
  hook: 'Hook',
  function: 'Function',
  class: 'Class',
  context: 'Context',
  value: 'Value',
  type: 'Type',
  asset: 'File',
} as const satisfies Readonly<Record<PublicApiKind, string>>;
