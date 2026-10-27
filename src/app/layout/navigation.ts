import type { PlaygroundPackage } from '../../playgrounds/registry';
import { apiEntry } from '../../playgrounds/registry';
import type { ExampleMetadata, NavigationCategory } from '../../shared/types/playground';
import { exampleApiLinks } from '../../features/api/model/links';

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
      readonly id: 'examples';
      readonly label: string;
      readonly categories: readonly NavigationSubcategory[];
    };

export type NavigationViewModel = {
  readonly groups: readonly NavigationGroup[];
  readonly exampleCount: number;
  readonly currentCategoryLabel: string;
};

export function buildNavigationModel({
  playground,
  examples,
  categories,
  currentId,
  isApi,
  getExampleUrl,
}: {
  readonly playground: PlaygroundPackage;
  readonly examples: readonly NavigationExample[];
  readonly categories: readonly NavigationCategory[];
  readonly currentId: string;
  readonly isApi: boolean;
  readonly getExampleUrl: (id: string) => string;
}): NavigationViewModel {
  const guideEntries = examples.filter((entry) => entry.kind === 'guide');

  const docItems: NavigationItem[] = guideEntries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    url: getExampleUrl(entry.id),
    active: !isApi && currentId === entry.id,
    kind: entry.kind,
    api: entry.api,
    description: entry.description,
  }));
  if (playground.status === 'ready') {
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
          api: exampleApiLinks(playground.id, entry.id).map((reference) => reference.label),
          description: entry.description,
        }));
      return {
        id: category.id,
        label: category.label,
        items,
      };
    })
    .filter((cat) => cat.items.length > 0);

  const groups: NavigationGroup[] = [
    {
      type: 'docs',
      id: 'docs',
      label: '문서',
      items: docItems,
    },
    {
      type: 'examples',
      id: 'examples',
      label: '예제',
      categories: exampleCategories,
    },
  ];

  const exampleCount = examples.filter((entry) => entry.kind !== 'guide').length;

  let currentCategoryLabel = '';
  if (isApi || guideEntries.some((entry) => currentId === entry.id)) {
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
  };
}
