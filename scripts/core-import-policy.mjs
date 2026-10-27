const core = '@owp/core';

const owners = new Map();
const register = (specifier, names) =>
  names
    .split(/\s+/)
    .filter(Boolean)
    .forEach((name) => owners.set(name, specifier));
register(
  '@owp/components',
  `
  OwpTable OwpFieldTable OwpDialog OwpAlertDialog OwpPageCarded OwpPageContent
  OwpSearchFilter OwpErrorBoundary OwpFloatingPanel OwpLoading OwpHidden
  OwpScrollbars OwpScrollbarsProvider OwpDiscardConfirmation OwpResponsiveLayoutGlobalStyles
`,
);
register(
  '@owp/components/hooks',
  `
  useOwpDialogs useConfirm ConfirmProps useDiscardGuard useOwpTranslation useResponsiveDevice
  useDialogOpenFocusCleanup useHeaderWrapState
`,
);
register('@owp/components/feedback', 'OwpDialogsProvider OwpDialogsProviderProps');
register(
  '@owp/components/types',
  `
  OwpDialogProps OwpAlertDialogPayload OwpAlertDialogConfirmButtonColor OwpTableProps
  OwpFieldTableProps OwpFieldTableCellLayoutProps OwpPageCardedProps OwpPageCardedRef
  OwpPageContentProps OwpSearchFilterProps OwpErrorBoundaryProps OwpFloatingPanelProps
  OwpLoadingProps OwpLoadingVariant OwpHiddenProps OwpScrollbarsProps OwpDiscardConfirmationProps
  AlertDialogPayload AlertDialogProps AlertOptions CloseDialog ConfirmDialogPayload
  ConfirmDialogProps ConfirmOptions DialogComponent DialogHook DialogLoaderDescriptor
  DialogOpenResultOf DialogPayloadOf DialogProviderProps DialogProps DialogResultOf
  OpenAlertDialog OpenConfirmDialog OpenDialog OpenDialogOptions OpenPromptDialog
  PromptDialogPayload PromptDialogProps PromptOptions OwpDirtySource OwpDiscardIntent
  OwpDiscardRequestOptions OwpDiscardGuard DiscardPending DiscardController
`,
);
register('@owp/components/utils', 'createDiscardGuard evaluateDirty');
register(
  '@owp/theme',
  `
  OwpThemeProvider defaultTheme defaultThemes defaultThemeOptions mustHaveThemeOptions
  extendThemeWithMixins lightPaletteText darkPaletteText defaultSnackbarTheme snackbarVariantKeys
  changeThemeMode getThemeWithButtonPaletteDefaults useGridTheme useTableTheme useDatePickerTheme
`,
);
register(
  '@owp/theme/types',
  `
  OwpThemeType OwpThemesType OwpSnackbarThemeConfigType OwpSnackbarVariantThemeConfigType
  OwpSnackbarVariantType
`,
);
register(
  '@owp/utils',
  'NumericValue formatNumber toFiniteNumber getDisplayValue getTrimmedValue isNilOrEmptyString getFormDefaultValues',
);
register(
  '@owp/utils/browser',
  'blurActiveElement preloadOnIdle isEnterKeyEvent createFormDataBody isDynamicImportChunkLoadError recoverFromDynamicImportChunkLoadError',
);
register('@owp/utils/zip', 'saveZipFile readZipEntryText readZipEntryJson loadJSZip');
register(
  '@owp/excel',
  'loadExcelJSBrowser createExportDataToExcelBuffer exportExcelByBuffer ExcelDataMapper ExcelHeader OwpExcelJSBrowserModule',
);
register(
  '@tanstack/react-query',
  'useQueryClient QueryClient QueryClientConfig QueryObserverResult RefetchOptions',
);

const removedPolicies = new Set([
  'useDialogPolicy',
  'usePageCardedPolicy',
  'useSearchFilterPolicy',
  'OwpDialogPolicy',
  'OwpDialogPolicyOptions',
  'OwpPageCardedPolicy',
  'OwpPageCardedPolicyOptions',
  'OwpErrorBoundaryPolicy',
  'errorBoundaryPolicy',
  'OwpCoreResponsiveLayoutGlobalStyles',
  'OwpExportDataToExcelButton',
  'rebuildValue',
  'saveAsZipFile',
  'DATA_GRID_TABLE_BODY_BORDER_COLOR',
  'DATA_GRID_TABLE_HEADER_BORDER_COLOR',
]);

/** Core에 남은 앱 통합 API와 분리된 패키지의 공개 소유권을 검사한다. */
export function verifyCoreImportPolicy(imports) {
  const errors = [];
  for (const entry of imports) {
    if (entry.specifier !== core && !entry.specifier.startsWith(`${core}/`)) continue;
    if (entry.kind === 're-export-all') {
      errors.push({ ...entry, reason: 'core-re-export-all' });
      continue;
    }
    for (const symbol of entry.names) {
      if (removedPolicies.has(symbol.name)) {
        errors.push({ ...entry, name: symbol.name, reason: 'removed-core-api' });
        continue;
      }
      const expectedSpecifier = owners.get(symbol.name);
      if (expectedSpecifier)
        errors.push({ ...entry, name: symbol.name, reason: 'wrong-owner', expectedSpecifier });
    }
  }
  return errors;
}
