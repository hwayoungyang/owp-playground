import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectOwpImports } from '../scripts/owp-import-contracts.mjs';
import { verifyCoreImportPolicy } from '../scripts/core-import-policy.mjs';

const verify = (content, file = 'src/playgrounds/core/examples/example.tsx') =>
  verifyCoreImportPolicy(collectOwpImports(file, content));

describe('strict Core import ownership', () => {
  it('accepts direct Components, Theme, Utils, Excel and TanStack owners alongside Core integrations', () => {
    expect(
      verify(`
      import { OwpDialog, OwpPageCarded, OwpPageContent, OwpSearchFilter, OwpErrorBoundary, OwpTable } from '@owp/components';
      import { useOwpDialogs, useConfirm, useDiscardGuard } from '@owp/components/hooks';
      import { OwpDialogsProvider } from '@owp/components/feedback';
      import type { DialogProps, OwpDiscardGuard } from '@owp/components/types';
      import { defaultThemes } from '@owp/theme';
      import { recoverFromDynamicImportChunkLoadError } from '@owp/utils/browser';
      import { saveZipFile } from '@owp/utils/zip';
      import { createExportDataToExcelBuffer } from '@owp/excel';
      import { useQueryClient } from '@tanstack/react-query';
      import { OwpRouteErrorElement, OwpQuerySelector } from '@owp/core';
      import { useSearchAction, usePageLeaveGuard } from '@owp/core/hooks';
      const view = <><OwpDialog open /><OwpPageCarded /><OwpPageContent /><OwpErrorBoundary /></>;
    `),
    ).toEqual([]);
  });

  it('rejects former Core wrappers through aliases, namespaces, JSX, reexports and dynamic selections', () => {
    const errors = verify(`
      import { OwpTable as Results } from '@owp/core';
      import * as Core from '@owp/core';
      const table = Core.OwpTable;
      const view = <Core.OwpDialog open />;
      export { OwpPageContent as Content } from '@owp/core';
      const lazy = import('@owp/core').then(({ OwpErrorBoundary: Boundary }) => Boundary);
    `);
    expect(errors).toHaveLength(5);
    expect(errors.every((error) => error.reason === 'wrong-owner')).toBe(true);
    expect(errors.every((error) => error.expectedSpecifier === '@owp/components')).toBe(true);
  });

  it('rejects removed policy hooks and policy reexports instead of requiring their composition', () => {
    const errors = verify(`
      import { useDialogPolicy, usePageCardedPolicy } from '@owp/core/hooks';
      import { errorBoundaryPolicy } from '@owp/core/utils';
      import type { OwpDialogPolicy } from '@owp/core/types';
    `);
    expect(errors.map((error) => error.reason)).toEqual(Array(4).fill('removed-core-api'));
  });

  it('rejects moved types, feedback, utilities and vendor reexports at every source location', () => {
    const errors = verify(
      `
      import { OwpDialogsProvider } from '@owp/core/contexts';
      import type { OwpDialogProps, OwpThemesType, NumericValue, ExcelHeader, QueryClient } from '@owp/core/types';
      export { useOwpDialogs } from '@owp/core/hooks';
    `,
      'src/consumer.tsx',
    );
    expect(errors.map((error) => error.expectedSpecifier)).toEqual([
      '@owp/components/feedback',
      '@owp/components/types',
      '@owp/theme/types',
      '@owp/utils',
      '@owp/excel',
      '@tanstack/react-query',
      '@owp/components/hooks',
    ]);
  });

  it('rejects blanket Core reexports while retaining explicit Core API exports', () => {
    expect(verify(`export * from '@owp/core';`)).toMatchObject([{ reason: 'core-re-export-all' }]);
    expect(verify(`export { OwpRouteErrorElement } from '@owp/core';`)).toEqual([]);
  });

  it('accepts migrated source ownership without requiring obsolete policy props, styles or slots', async () => {
    const root = path.resolve(import.meta.dirname, '../src/playgrounds/core');
    for (const file of [
      'examples/dialog.tsx',
      'examples/page-carded.tsx',
      'examples/page-content.tsx',
      'examples/error-boundary.tsx',
      'examples/search-filter.tsx',
      'guides/getting-started.tsx',
    ]) {
      expect(
        verify(await readFile(path.join(root, file), 'utf8'), `src/playgrounds/core/${file}`),
      ).toEqual([]);
    }
  });
});
