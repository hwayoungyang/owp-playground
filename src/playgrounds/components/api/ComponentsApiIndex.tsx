import { useOwpTranslation } from '@owp/components/hooks';
import { ApiIndexList } from '../../../shared/ui/ApiIndexList';
import { publicApiKindLabels } from '../../../features/public-api/kind-labels';
import { formatApiDescription } from '../../../shared/i18n/reference-copy';
import { componentsApiGroups, componentsApiHref } from './navigation';
import type { ComponentsApiEntry } from './types';

export function ComponentsApiIndex({
  entries,
}: {
  readonly entries: readonly ComponentsApiEntry[];
}) {
  const { i18n } = useOwpTranslation();
  return (
    <ApiIndexList
      groups={componentsApiGroups.map((group) => ({
        ...group,
        label: group.id === 'components' ? '컴포넌트' : group.label,
      }))}
      items={entries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        description: formatApiDescription(entry.description),
        kind: publicApiKindLabels[entry.kind],
        group: entry.group,
        href: componentsApiHref(entry.id, i18n.language),
        searchTerms: [entry.name, entry.description, ...entry.imports],
      }))}
    />
  );
}
