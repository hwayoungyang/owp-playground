export const componentGroups = [
  {
    id: 'component-inputs',
    label: 'Input, Select',
    names: [
      'OwpNumberField',
      'OwpTextMaskField',
      'OwpBarcodeInputField',
      'OwpSelectorBase',
      'OwpOptionSelector',
      'OwpYesNoSelector',
      'OwpFieldHelperText',
      'OwpRequiredHelperText',
    ],
  },
  {
    id: 'component-actions',
    label: 'Button, Action',
    names: ['OwpFilePickerButton', 'OwpMoreActionsButton'],
  },
  {
    id: 'component-tables',
    label: 'Table',
    names: ['OwpTable', 'OwpFieldTable', 'OwpTableTotalCount'],
  },
  {
    id: 'component-sections',
    label: 'Section, Page',
    names: [
      'OwpSection',
      'OwpPageContent',
      'OwpPageCarded',
      'OwpSearchFilter',
      'OwpTabs',
      'OwpTab',
    ],
  },
  {
    id: 'component-feedback',
    label: 'Dialog, Feedback',
    names: [
      'OwpDialog',
      'OwpAlertDialog',
      'OwpDiscardConfirmation',
      'OwpFloatingPanel',
      'OwpDialogsProvider',
      'OwpFeedbackBoundary',
      'OwpFeedbackProvider',
      'OwpLoading',
      'OwpDeferredMount',
      'OwpErrorBoundary',
      'OwpGridLoadingOverlay',
      'OwpGridNoDataOverlay',
    ],
  },
  { id: 'component-icons', label: 'Icon', names: ['OwpSvgIcon'] },
  {
    id: 'component-responsive',
    label: 'Responsive, Scroll',
    names: [
      'OwpHidden',
      'OwpScrollbars',
      'OwpScrollbarsProvider',
      'OwpResponsiveLayoutGlobalStyles',
    ],
  },
  { id: 'components', label: 'Other Components', names: [] },
] as const;

export type ComponentGroupId = (typeof componentGroups)[number]['id'];

export function componentGroupId(name: string, modules: readonly string[] = []): ComponentGroupId {
  if (modules.some((module) => /\/icons(?:['";]|$)/.test(module))) return 'component-icons';
  return (
    componentGroups.find((group) => group.names.some((candidate) => candidate === name))?.id ??
    'components'
  );
}
