import { componentCatalog } from './model/componentCatalog.ts';
import { hookCatalog } from './model/hookCatalog.ts';
import { utilCatalog } from './model/utilCatalog.ts';
import { scenarioCatalog } from './model/scenarioCatalog.ts';
import { componentGroups } from './model/componentGroups.ts';
import type { NavigationCategory } from '../../shared/types/playground';
import type { ComponentsCatalogEntry } from './model/types';

export type { ComponentsCatalogEntry, ComponentsExample, ComponentsGuide } from './model/types';

export const componentsCategories = [
  { id: 'input-examples', label: '입력 폼' },
  { id: 'data-examples', label: '검색과 데이터 표시' },
  { id: 'workflow-examples', label: '편집과 확인' },
  { id: 'layout-examples', label: '페이지 구성' },
  { id: 'icon-examples', label: 'Icons' },
  ...componentGroups.map(({ id, label }) => ({ id, label, section: 'reference' as const })),
  { id: 'hooks', label: 'Hooks', section: 'reference' },
  { id: 'utils', label: 'Utils', section: 'reference' },
] as const satisfies readonly NavigationCategory[];

export const componentsCatalog: readonly ComponentsCatalogEntry[] = [
  {
    id: 'getting-started',
    title: '시작하기',
    kind: 'guide',
    category: 'docs',
    package: '@owp/components',
    description: 'Components 설치부터 첫 숫자 입력과 공개 API 사용까지 안내합니다.',
    api: ['OwpNumberField'],
    source: 'guides/getting-started.tsx',
  },
  ...scenarioCatalog,
  ...componentCatalog,
  ...hookCatalog,
  ...utilCatalog,
];

export function findComponentsEntry(id: string | null): ComponentsCatalogEntry {
  const entry = componentsCatalog.find((example) => example.id === id) ?? componentsCatalog[0];
  if (!entry) throw new RangeError('Components catalog is empty');
  return entry;
}
