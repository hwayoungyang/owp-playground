import type { NavigationItem, NavigationViewModel } from './navigation';

export type NavigationResult = {
  readonly item: NavigationItem;
  readonly kind: '가이드' | '예제' | 'API';
  readonly category: string;
};

export function navigationResults(model: NavigationViewModel): readonly NavigationResult[] {
  return model.groups.flatMap((group): readonly NavigationResult[] => {
    switch (group.type) {
      case 'docs':
        return group.items.map((item) => ({
          item,
          kind: item.kind === 'reference' ? 'API' : '가이드',
          category: group.label,
        }));
      case 'examples':
        return group.categories.flatMap((category) =>
          category.items.map((item) => ({
            item,
            kind: group.id === 'reference' ? 'API' : '예제',
            category: category.label,
          })),
        );
      default:
        return assertNever(group);
    }
  });
}

export function searchNavigation({
  entries,
  query,
  translate,
}: {
  readonly entries: readonly NavigationResult[];
  readonly query: string;
  readonly translate: (value: string) => string;
}): readonly NavigationResult[] {
  const normalized = query.trim().toLocaleLowerCase();
  return entries.filter(({ item, kind, category }) =>
    [
      item.title,
      translate(item.title),
      item.description ?? '',
      translate(item.description ?? ''),
      ...(item.api ?? []),
      category,
      translate(category),
      kind,
      translate(kind),
    ]
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalized),
  );
}

function assertNever(value: never): never {
  throw new RangeError(`Unknown navigation group: ${String(value)}`);
}
