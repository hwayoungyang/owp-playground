export const coreComponentGroups = [
  { id: 'core-providers', label: 'Provider' },
  {
    id: 'core-inputs',
    label: 'Input, Select',
    names: [
      'OwpQuerySelector',
      'OwpCommonCodeQuerySelector',
      'OwpCommonCodeSelector',
      'OwpCommonCodeRadioGroup',
      'OwpLanguageSwitcherSelect',
    ],
  },
  { id: 'core-layout', label: 'Layout', names: ['OwpLayout'] },
  {
    id: 'core-errors',
    label: 'Error Handling',
    names: ['OwpErrorStatusPage', 'OwpRouteErrorElement', 'QueryErrorResetBoundary'],
  },
  { id: 'core-translation', label: 'Translation', names: ['Trans'] },
  { id: 'components', label: 'Other Components', names: [] },
] as const;

export function coreComponentGroupId(name: string): string {
  if (name.endsWith('Provider')) return 'core-providers';
  return (
    coreComponentGroups.find(
      (group) => 'names' in group && group.names.some((candidate) => candidate === name),
    )?.id ?? 'components'
  );
}
