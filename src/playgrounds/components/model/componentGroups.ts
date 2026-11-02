export const componentGroups = [
  {
    id: 'component-inputs',
    label: '입력·선택',
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
    label: '버튼·작업',
    names: ['OwpFilePickerButton', 'OwpMoreActionsButton'],
  },
  {
    id: 'component-tables',
    label: 'Table',
    names: ['OwpTable', 'OwpFieldTable', 'OwpTableTotalCount'],
  },
  {
    id: 'component-sections',
    label: 'Section·페이지',
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
    label: 'Dialog·피드백',
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
    label: '반응형·스크롤',
    names: [
      'OwpHidden',
      'OwpScrollbars',
      'OwpScrollbarsProvider',
      'OwpResponsiveLayoutGlobalStyles',
    ],
  },
  { id: 'components', label: '기타 컴포넌트', names: [] },
] as const;

export type ComponentGroupId = (typeof componentGroups)[number]['id'];

export function componentGroupId(name: string, modules: readonly string[] = []): ComponentGroupId {
  if (modules.some((module) => /\/icons(?:['";]|$)/.test(module))) return 'component-icons';
  return (
    componentGroups.find((group) => group.names.some((candidate) => candidate === name))?.id ??
    'components'
  );
}
