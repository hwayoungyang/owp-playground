import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyOwpSourceContracts } from '../scripts/owp-import-contracts.mjs';

const root = path.resolve(import.meta.dirname, '..');
const verify = (file, content) =>
  verifyOwpSourceContracts(root, [
    {
      file: `src/playgrounds/core/${file}`,
      content,
    },
  ]);

describe('Core sample import roles', () => {
  it('keeps Core APIs and Components result UI together outside the adapter category', async () => {
    const result = await verify(
      'examples/api-query.tsx',
      `
      import { OwpTable as Results } from '@owp/components';
      import { createOwpApiHooks } from '@owp/core/hooks';
      import { OwpCoreProvider } from '@owp/core/contexts';
      import { OwpQuerySelector, OwpCommonCodeSelector, OwpLanguageSwitcherSelect, OwpExportDataToExcelButton } from '@owp/core';
      import type { OwpSettingsConfigType } from '@owp/core/types';
    `,
    );
    expect(result.errors).toEqual([]);
  });

  it('rejects a Core result table through aliases, namespaces, reexports and dynamic selections', async () => {
    const result = await verify(
      'examples/api-query.tsx',
      `
      import { OwpTable as Results } from '@owp/core';
      import * as Core from '@owp/core';
      const table = Core.OwpTable;
      export { OwpTable as ResultTable } from '@owp/core';
      const lazy = import('@owp/core').then(({ OwpTable: Table }) => Table);
    `,
    );
    expect(result.errors).toHaveLength(4);
    expect(result.errors.every((error) => error.reason === 'wrong-sample-owner')).toBe(true);
    expect(result.errors.every((error) => error.expectedSpecifier === '@owp/components')).toBe(
      true,
    );
  });

  it('permits settings adapters despite the sample belonging to app state', async () => {
    const result = await verify(
      'examples/app-settings.tsx',
      `
      import { OwpTable, OwpFieldTable } from '@owp/core';
      import { useSetSettings, useChangeOwpTheme } from '@owp/core/hooks';
    `,
    );
    expect(result.errors).toEqual([]);
    const wrong = await verify(
      'examples/app-settings.tsx',
      `import { OwpTable } from '@owp/components';`,
    );
    expect(wrong.errors.map((error) => error.expectedSpecifier)).toEqual(['@owp/core']);
    const search = await verify(
      'examples/search-filter.tsx',
      `import { OwpSearchFilter } from '@owp/components';`,
    );
    expect(search.errors.map((error) => error.expectedSpecifier)).toEqual(['@owp/core']);
  });

  it('keeps the dialog manager and adapter types separate from result UI types', async () => {
    const result = await verify(
      'examples/dialog.tsx',
      `
      import { OwpDialog } from '@owp/core';
      import { OwpFieldTable } from '@owp/components';
      import type { DialogProps, OwpDialogProps } from '@owp/core/types';
      import type { OwpFieldTableProps } from '@owp/components/types';
    `,
    );
    expect(result.errors).toEqual([]);
    const components = await verify(
      'examples/dialog.tsx',
      `
      import { OwpDialog } from '@owp/components';
      import type { DialogProps } from '@owp/core/types';
      import type { OwpDialogProps } from '@owp/components/types';
    `,
    );
    expect(components.errors).toEqual([]);
    const wrong = await verify(
      'examples/dialog.tsx',
      `import { OwpDialog } from '@owp/components';
       import type { OwpDialogProps } from '@owp/core/types';`,
    );
    expect(wrong.errors.map((error) => error.expectedSpecifier)).toEqual(['@owp/components/types']);
  });

  it('keeps the startup policy adapters while importing its table directly', async () => {
    const result = await verify(
      'guides/getting-started.tsx',
      `
      import { OwpPageCarded, OwpErrorBoundary, OwpRouteErrorElement } from '@owp/core';
      import { OwpTable, OwpLoading } from '@owp/components';
    `,
    );
    expect(result.errors).toEqual([]);
  });

  it('does not impose sample policy on other packages or shared runtime', async () => {
    const result = await verifyOwpSourceContracts(root, [
      { file: 'src/consumer.tsx', content: `import { OwpTable } from '@owp/core';` },
      {
        file: 'src/playgrounds/core/runtime/CoreProviders.tsx',
        content: `import { OwpRouteErrorElement } from '@owp/core';`,
      },
    ]);
    expect(result.errors).toEqual([]);
  });

  it('accepts the migrated examples and startup source against installed public APIs', async () => {
    const files = [
      'examples/dialog.tsx',
      'examples/page-carded.tsx',
      'examples/page-content.tsx',
      'examples/error-boundary.tsx',
      'guides/getting-started.tsx',
    ];
    const sources = await Promise.all(
      files.map(async (file) => ({
        file: `src/playgrounds/core/${file}`,
        content: await readFile(path.join(root, 'src/playgrounds/core', file), 'utf8'),
      })),
    );
    expect((await verifyOwpSourceContracts(root, sources)).errors).toEqual([]);
  });

  it('accepts aliased Components UI with Core policy props and styles', async () => {
    const result = await verify(
      'examples/dialog.tsx',
      `
      import { OwpDialog as Dialog } from '@owp/components';
      import { useDialogPolicy as usePolicy } from '@owp/core/hooks';
      const policy = usePolicy({ open: true, isDirty: true });
      const view = <>{policy.styles}<Dialog title="Edit" {...policy.props} /></>;
    `,
    );
    expect(result.errors).toEqual([]);
  });

  it.each([
    ['dialog', 'useDialogPolicy', 'OwpDialog'],
    ['page-carded', 'usePageCardedPolicy', 'OwpPageCarded'],
  ])('requires both policy outputs for %s', async (sample, hook, component) => {
    const source = `
      import { ${component} as Ui } from '@owp/components';
      import { ${hook} } from '@owp/core/hooks';
      const policy = ${hook}({ open: true, isDirty: true });
      const view = <>{policy.styles}<Ui {...policy.props} /></>;
    `;
    expect((await verify(`examples/${sample}.tsx`, source)).errors).toEqual([]);
    const propsMissing = await verify(
      `examples/${sample}.tsx`,
      source.replace('{...policy.props}', ''),
    );
    expect(propsMissing.errors.map((error) => error.reason)).toEqual(['missing-policy-props']);
    const stylesMissing = await verify(
      `examples/${sample}.tsx`,
      source.replace('{policy.styles}', ''),
    );
    expect(stylesMissing.errors.map((error) => error.reason)).toEqual(['missing-policy-styles']);
    const overridden = await verify(
      `examples/${sample}.tsx`,
      source.replace('{...policy.props}', '{...policy.props} responsiveLayout={false}'),
    );
    expect(overridden.errors.map((error) => error.reason)).toEqual(['overridden-policy-props']);
    const doublePolicy = await verify(
      `examples/${sample}.tsx`,
      source.replace("from '@owp/components'", "from '@owp/core'"),
    );
    expect(doublePolicy.errors.map((error) => error.reason)).toEqual(['double-core-policy']);
  });

  it('requires the public responsive style slot and rejects double Core styling', async () => {
    const source = `
      import { OwpPageContent as Content } from '@owp/components';
      import { OwpCoreResponsiveLayoutGlobalStyles as Styles } from '@owp/core';
      const view = <Content slots={{ responsiveLayoutGlobalStyles: Styles }} />;
    `;
    expect((await verify('examples/page-content.tsx', source)).errors).toEqual([]);
    const missing = await verify(
      'examples/page-content.tsx',
      source.replace('slots={{ responsiveLayoutGlobalStyles: Styles }}', ''),
    );
    expect(missing.errors.map((error) => error.reason)).toEqual([
      'missing-responsive-layout-style-slot',
    ]);
    const doublePolicy = await verify(
      'examples/page-content.tsx',
      source.replace("from '@owp/components'", "from '@owp/core'"),
    );
    expect(doublePolicy.errors.map((error) => error.reason)).toEqual(['double-core-policy']);
  });

  it('requires errorBoundaryPolicy on Components boundaries and rejects duplicate Core policy', async () => {
    const source = `
      import { OwpErrorBoundary as Boundary } from '@owp/components';
      import { errorBoundaryPolicy as policy } from '@owp/core/utils';
      const view = <Boundary {...policy} />;
    `;
    expect((await verify('examples/error-boundary.tsx', source)).errors).toEqual([]);
    const missing = await verify('examples/error-boundary.tsx', source.replace('{...policy}', ''));
    expect(missing.errors.map((error) => error.reason)).toEqual(['missing-error-boundary-policy']);
    const doublePolicy = await verify(
      'examples/error-boundary.tsx',
      source.replace("from '@owp/components'", "from '@owp/core'"),
    );
    expect(doublePolicy.errors.map((error) => error.reason)).toEqual(['double-core-policy']);
  });
});
