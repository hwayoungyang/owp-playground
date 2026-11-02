import { componentRoles } from './components';
import { coreRoles } from './core';
import { chartRoles } from './charts';
import { integrationRoles } from './integrations';
import { gridTypeRoles } from './grid-types';
import { componentTypeRoles } from './component-types';
import { themeTypeRoles } from './theme-types';
import { coreTypeRoles } from './core-types';
import { chartTypeRoles } from './chart-types';
import { apiDescriptionSearchText } from '../description-kind';
import type { PublicApiKind } from '../types';

export const apiRoles = {
  ...componentRoles,
  ...coreRoles,
  ...chartRoles,
  ...integrationRoles,
  ...gridTypeRoles,
  ...componentTypeRoles,
  ...themeTypeRoles,
  ...coreTypeRoles,
  ...chartTypeRoles,
};
export const apiRoleEnglish = Object.fromEntries(
  Object.values(apiRoles).map(([korean, english]) => [korean, english]),
);

export function publicApiSearchText(entry: {
  readonly name: string;
  readonly description: string;
  readonly modules: readonly string[];
  readonly kind: PublicApiKind;
}): string {
  const role = apiRoles[entry.name];
  const owner = apiRoles[entry.name.replace(/(?:Own)?Props$/, '')];
  const descriptions = role ?? (owner ? owner.map((text) => `${text} Props`) : []);
  return [
    entry.name,
    entry.description,
    ...entry.modules,
    ...descriptions,
    ...apiDescriptionSearchText(descriptions.length > 0 ? descriptions : ['', ''], entry.kind),
  ].join(' ');
}
