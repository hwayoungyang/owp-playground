import type {
  ComponentsApiMember,
  ComponentsApiPropsVariant,
  ComponentsApiSignature,
} from '../../playgrounds/components/api/types';

export const publicApiPackageIds = [
  'components',
  'core',
  'charts',
  'datagrid',
  'date-picker',
  'excel',
  'pdf',
  'theme',
  'utils',
] as const;
export type PublicApiPackageId = (typeof publicApiPackageIds)[number];
export type PublicApiKind =
  | 'component'
  | 'hook'
  | 'function'
  | 'class'
  | 'context'
  | 'value'
  | 'type'
  | 'asset';
export const publicApiGroups = [
  { id: 'components', label: 'Components' },
  { id: 'hooks', label: 'Hooks' },
  { id: 'utils', label: 'Utils' },
  { id: 'contexts', label: 'Context' },
  { id: 'constants', label: 'Constants' },
  { id: 'values', label: 'Values' },
  { id: 'types', label: 'Types' },
  { id: 'assets', label: 'Styles' },
] as const;
export type PublicApiGroup = (typeof publicApiGroups)[number]['id'];
export type PublicApiSummary = {
  readonly id: string;
  readonly name: string;
  readonly label?: string;
  readonly packageId: PublicApiPackageId;
  readonly kind: PublicApiKind;
  readonly group: PublicApiGroup;
  readonly modules: readonly string[];
  readonly description: string;
  readonly exampleIds?: readonly string[];
};
export type PublicApiExample = {
  readonly packageId: string;
  readonly id: string;
  readonly title: string;
  readonly source: string;
};
export type PublicApiSignature = ComponentsApiSignature & {
  readonly parameterMembers: readonly {
    readonly name: string;
    readonly members: readonly ComponentsApiMember[];
  }[];
  readonly returnMembers: readonly ComponentsApiMember[];
};
export type PublicApiEntry = PublicApiSummary & {
  readonly javascript?: boolean;
  readonly owner: string;
  readonly imports: readonly string[];
  readonly declaration: string;
  readonly propsVariants: readonly ComponentsApiPropsVariant[];
  readonly signatures: readonly PublicApiSignature[];
  readonly valueType: string | null;
  readonly examples: readonly PublicApiExample[];
  readonly usage: string;
  readonly usageKind: 'documented' | 'component' | 'call' | 'type' | 'value' | 'asset';
};
export type PublicApiPackageData = {
  readonly id: PublicApiPackageId;
  readonly version: string;
  readonly entries: readonly PublicApiEntry[];
  readonly entrypoints: readonly { readonly name: string; readonly symbols: readonly string[] }[];
};
export type PublicApiEntryLoaders = Readonly<Record<string, () => Promise<PublicApiEntry>>>;
export type PublicApiIndex = readonly {
  readonly id: PublicApiPackageId;
  readonly version: string;
  readonly entries: readonly PublicApiSummary[];
}[];

export function isPublicApiPackage(id: string): id is PublicApiPackageId {
  return publicApiPackageIds.some((candidate) => candidate === id);
}

export function publicApiSampleId(symbol: string): string {
  return `export:${symbol}`;
}

export function isPublicApiListEntry(entry: Pick<PublicApiSummary, 'kind' | 'name'>): boolean {
  return entry.kind !== 'asset' || !entry.name.endsWith('/package.json');
}

export function publicApiSymbol(sampleId: string): string | null {
  return sampleId.startsWith('export:') ? sampleId.slice('export:'.length) : null;
}
