import { useOwpTranslation } from '@owp/components/hooks';
import { ApiIndexList } from '../../../shared/ui/ApiIndexList';
import { publicApiKindLabels } from '../../../features/public-api/kind-labels';
import { formatApiDescription } from '../../../shared/i18n/reference-copy';
import { componentsApiGroups, componentsApiHref } from './navigation';
import type { ComponentsApiEntry } from './types';
import { componentGroupId, componentGroups } from '../model/componentGroups';

export function ComponentsApiIndex({
  entries,
}: {
  readonly entries: readonly ComponentsApiEntry[];
}) {
  const { i18n } = useOwpTranslation();
  return (
    <ApiIndexList
      groups={[
        ...componentGroups,
        ...componentsApiGroups.filter((group) => group.id !== 'components'),
      ]}
      items={entries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        description: formatApiDescription(entry.description),
        kind: publicApiKindLabels[entry.kind],
        group:
          entry.group === 'components' ? componentGroupId(entry.name, entry.imports) : entry.group,
        href: componentsApiHref(entry.id, i18n.language),
        searchTerms: [entry.name, entry.description, ...entry.imports],
      }))}
    />
  );
}
