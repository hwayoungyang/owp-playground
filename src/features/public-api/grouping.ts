import {
  componentGroupId,
  componentGroups,
} from '../../playgrounds/components/model/componentGroups';
import { publicApiGroups } from './types';

export function publicApiNavigationGroups(packageId: string) {
  return packageId === 'components'
    ? [...componentGroups, ...publicApiGroups.filter((group) => group.id !== 'components')]
    : publicApiGroups;
}

export function publicApiNavigationGroup(entry: {
  readonly packageId: string;
  readonly group: string;
  readonly name: string;
  readonly modules: readonly string[];
}): string {
  return entry.packageId === 'components' && entry.group === 'components'
    ? componentGroupId(entry.name, entry.modules)
    : entry.group;
}
