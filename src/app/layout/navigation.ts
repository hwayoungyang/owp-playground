import type { PlaygroundPackage } from '../../playgrounds/registry';
import { apiEntry } from '../../playgrounds/registry';
import { supportsApiReference } from '../../playgrounds/packages';
import type { ExampleMetadata, NavigationCategory } from '../../shared/types/playground';
import { exampleApiLinks } from '../../features/api/model/links';
import { isPublicApiListEntry, publicApiSampleId } from '../../features/public-api/types';
import type { PublicApiSummary } from '../../features/public-api/types';
import { publicApiSearchText } from '../../features/public-api/roles';
import {
  publicApiNavigationGroup,
  publicApiNavigationGroups,
} from '../../features/public-api/grouping';

export type NavigationExample = ExampleMetadata & {
  readonly kind?: string;
};

export type NavigationItem = {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly active: boolean;
  readonly kind?: string;
  readonly api?: readonly string[];
  readonly description?: string;
};

export type NavigationSubcategory = {
  readonly id: string;
  readonly label: string;
  readonly items: readonly NavigationItem[];
};

export type NavigationGroup =
  | {
      readonly type: 'docs';
      readonly id: 'docs';
      readonly label: string;
      readonly items: readonly NavigationItem[];
    }
  | {
      readonly type: 'examples';
      readonly id: 'examples' | 'reference';
      readonly label: string;
      readonly categories: readonly NavigationSubcategory[];
    };

export type NavigationViewModel = {
  readonly groups: readonly NavigationGroup[];
  readonly exampleCount: number;
  readonly currentCategoryLabel: string;
  readonly publicApiCount?: number;
};

export function buildNavigationModel({
  playground,
  examples,
  categories,
  currentId,
  isApi,
  getExampleUrl,
  publicEntries = [],
}: {
  readonly playground: PlaygroundPackage;
  readonly examples: readonly NavigationExample[];
  readonly categories: readonly NavigationCategory[];
  readonly currentId: string;
  readonly isApi: boolean;
  readonly getExampleUrl: (id: string) => string;
  readonly publicEntries?: readonly PublicApiSummary[];
}): NavigationViewModel {
  const guideEntries = examples.filter((entry) => entry.kind === 'guide');
  const listedPublicEntries = publicEntries.filter(isPublicApiListEntry);

  const docItems: NavigationItem[] = guideEntries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    url: getExampleUrl(entry.id),
    active: !isApi && currentId === entry.id,
    kind: entry.kind,
    api: entry.api,
    description: entry.description,
  }));
  if (supportsApiReference(playground) && publicEntries.length === 0) {
    const apiItem = apiEntry(playground);
    docItems.push({
      id: apiItem.id,
      title: 'API',
      url: getExampleUrl(apiItem.id),
      active: isApi,
      kind: apiItem.kind,
      api: apiItem.api,
      description: apiItem.description,
    });
  }
  if (publicEntries.length)
    docItems.push({
      id: 'exports',
      title: 'API',
      url: getExampleUrl('exports'),
      active: currentId === 'exports' || (isApi && currentId === 'api'),
      kind: 'reference',
    });

  const exampleCategories: NavigationSubcategory[] = categories
    .map((category) => {
      const items = examples
        .filter((entry) => entry.kind !== 'guide' && entry.category === category.id)
        .map((entry) => ({
          id: entry.id,
          title: entry.title,
          url: getExampleUrl(entry.id),
          active: !isApi && currentId === entry.id,
          kind: entry.kind,
          api:
            playground.id === 'components'
              ? entry.api
              : exampleApiLinks(playground.id, entry.id).map((reference) => reference.label),
          description: entry.description,
        }));
      return {
        id: category.id,
        label: category.label,
        items,
      };
    })
    .filter((cat) => cat.items.length > 0);

  const groups: NavigationGroup[] = [];
  if (docItems.length > 0)
    groups.push({
      type: 'docs',
      id: 'docs',
      label: '문서',
      items: docItems,
    });
  const referenceIds = new Set(
    categories
      .filter((category) => category.section === 'reference')
      .map((category) => category.id),
  );
  const usageCategories = exampleCategories.filter((category) => !referenceIds.has(category.id));
  const referenceCategories =
    publicEntries.length > 0
      ? publicApiNavigationGroups(playground.id).flatMap((group) => {
          const items = listedPublicEntries
            .filter((entry) => publicApiNavigationGroup(entry) === group.id)
            .map((entry) => ({
              id: publicApiSampleId(entry.id),
              title: entry.label ?? entry.name,
              url: getExampleUrl(publicApiSampleId(entry.id)),
              active: currentId === publicApiSampleId(entry.id),
              description: publicApiSearchText(entry),
              api: entry.modules,
            }));
          return items.length ? [{ id: `public-${group.id}`, label: group.label, items }] : [];
        })
      : exampleCategories.filter((category) => referenceIds.has(category.id));
  if (usageCategories.length > 0)
    groups.push({
      type: 'examples',
      id: 'examples',
      label: referenceCategories.length > 0 ? '사용 예제' : '예제',
      categories: usageCategories,
    });
  if (referenceCategories.length > 0)
    groups.push({
      type: 'examples',
      id: 'reference',
      label: publicEntries.length ? '공개 API' : '컴포넌트·Hooks·Utils',
      categories: referenceCategories,
    });

  const exampleCount = examples.filter((entry) => entry.kind !== 'guide').length;

  let currentCategoryLabel = '';
  if (currentId.startsWith('export:') || currentId === 'exports') {
    currentCategoryLabel = '공개 API';
  } else if (isApi || guideEntries.some((entry) => currentId === entry.id)) {
    currentCategoryLabel = '문서';
  } else {
    const currentExample = examples.find((entry) => entry.id === currentId);
    if (currentExample) {
      const cat = categories.find((c) => c.id === currentExample.category);
      currentCategoryLabel = cat?.label ?? '';
    }
  }

  return {
    groups,
    exampleCount,
    currentCategoryLabel,
    ...(publicEntries.length ? { publicApiCount: listedPublicEntries.length } : {}),
  };
}
