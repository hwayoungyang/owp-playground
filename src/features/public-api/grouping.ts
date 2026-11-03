import {
  componentGroupId,
  componentGroups,
} from '../../playgrounds/components/model/componentGroups';
import { publicApiGroups } from './types';
import { coreComponentGroupId, coreComponentGroups } from './core-groups';

export function publicApiNavigationGroups(packageId: string) {
  const groups =
    packageId === 'components'
      ? componentGroups
      : packageId === 'core'
        ? coreComponentGroups
        : null;
  return groups
    ? [...groups, ...publicApiGroups.filter((group) => group.id !== 'components')]
    : publicApiGroups;
}

export function publicApiNavigationGroup(entry: {
  readonly packageId: string;
  readonly group: string;
  readonly name: string;
  readonly modules: readonly string[];
}): string {
  if (entry.group !== 'components') return entry.group;
  if (entry.packageId === 'components') return componentGroupId(entry.name, entry.modules);
  if (entry.packageId === 'core') return coreComponentGroupId(entry.name);
  return entry.group;
}
