import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyOwpSourceContracts } from '../scripts/owp-import-contracts.mjs';

const root = path.resolve(import.meta.dirname, '..');
const verify = (content) => verifyOwpSourceContracts(root, [{ file: 'consumer.tsx', content }]);

describe('installed OWP import ownership', () => {
  it('accepts Components 3.1.1 UI and Core 8.1.0 public composition APIs and types', async () => {
    const result = await verify(`
      import { OwpDialog, OwpPageCarded, OwpPageContent, OwpErrorBoundary } from '@owp/components';
      import { useDialogPolicy, usePageCardedPolicy } from '@owp/core/hooks';
      import { OwpCoreResponsiveLayoutGlobalStyles, OwpRouteErrorElement } from '@owp/core';
      import { errorBoundaryPolicy } from '@owp/core/utils';
      import type { DialogProps, OwpDialogPolicy, OwpPageCardedPolicy, OwpErrorBoundaryPolicy } from '@owp/core/types';
      import type { OwpDialogProps, OwpPageCardedProps, OwpPageContentProps, OwpErrorBoundaryProps } from '@owp/components/types';
    `);
    expect(result.errors).toEqual([]);
  });

  it('accepts Core policy adapters with aliases and namespace access', async () => {
    // Given
    const content = `import { OwpTable as Table, OwpFieldTable, OwpDialog, OwpPageCarded, OwpPageContent, OwpSearchFilter, OwpErrorBoundary, OwpRouteErrorElement } from '@owp/core';
      import * as Core from '@owp/core';
      import type { OwpDialogProps } from '@owp/core/types';
      const dialog = Core.OwpDialog;`;
    // When
    const result = await verify(content);
    // Then
    expect(result.errors).toEqual([]);
  });

  it('rejects UI exports removed from Core while accepting their Components owners', async () => {
    // Given
    const content = `import { OwpLoading, OwpFloatingPanel, OwpHidden } from '@owp/core';
      import type { OwpLoadingProps, OwpFloatingPanelProps, OwpHiddenProps } from '@owp/core/types';
      import { OwpLoading as Loading, OwpFloatingPanel as Panel, OwpHidden as Hidden } from '@owp/components';
      import type { OwpLoadingProps as LoadingProps, OwpFloatingPanelProps as PanelProps, OwpHiddenProps as HiddenProps } from '@owp/components/types';`;
    // When
    const result = await verify(content);
    // Then
    expect(new Set(result.errors.map((error) => error.name))).toEqual(
      new Set([
        'OwpLoading',
        'OwpFloatingPanel',
        'OwpHidden',
        'OwpLoadingProps',
        'OwpFloatingPanelProps',
        'OwpHiddenProps',
      ]),
    );
    expect(result.errors.every((error) => error.specifier.startsWith('@owp/core'))).toBe(true);
  });

  it('checks type reexports separately from runtime exports', async () => {
    // Given
    const content = `export type { OwpSettingsConfigType as Settings } from '@owp/core/types';
      export { OwpSettingsConfigType as RuntimeSettings } from '@owp/core/types';`;
    // When
    const result = await verify(content);
    // Then
    expect(result.errors).toMatchObject([
      { name: 'OwpSettingsConfigType', reason: 'missing-runtime-export', line: 2 },
    ]);
  });

  it('checks selected dynamic exports without evaluating browser modules', async () => {
    // Given
    const content = `const chart = import('@owp/charts').then(({ CoreChart }) => CoreChart);
      const invalid = import('@owp/core').then(({ OwpLoading: Loading }) => Loading);`;
    // When
    const result = await verify(content);
    // Then
    expect(new Set(result.errors.map((error) => error.name))).toEqual(new Set(['OwpLoading']));
    expect(result.errors.every((error) => error.kind === 'dynamic-selection')).toBe(true);
  });

  it('checks namespace members against the public module', async () => {
    // Given
    const content = `import * as Core from '@owp/core'; const loading = Core.OwpLoading;`;
    // When
    const result = await verify(content);
    // Then
    expect(result.errors).toMatchObject([
      { name: 'OwpLoading', reason: 'missing-declaration' },
      { name: 'OwpLoading', reason: 'missing-runtime-export' },
    ]);
  });

  it('rejects private subpaths even when their files exist', async () => {
    // Given
    const content = `export * from '@owp/core/dist/index.js'; import '@owp/core/owp-app.css';`;
    // When
    const result = await verify(content);
    // Then
    expect(result.errors).toMatchObject([
      { specifier: '@owp/core/dist/index.js', reason: 'private-path' },
    ]);
  });
});
