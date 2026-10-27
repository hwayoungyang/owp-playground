import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { verifyOwpSourceContracts } from '../scripts/owp-import-contracts.mjs';

const root = await mkdtemp(path.join(tmpdir(), 'owp-import-contracts-'));
afterAll(() => rm(root, { recursive: true, force: true }));
await writeFile(path.join(root, 'package.json'), '{}');
const packages = {
  core: {
    '.': ['OwpRouteErrorElement'],
    './hooks': ['useSearchAction', 'usePageLeaveGuard'],
    './contexts': ['OwpCoreProvider'],
    './types': ['OwpSettingsConfigType'],
    './owp-app.css': [],
  },
  components: {
    '.': ['OwpDialog', 'OwpPageCarded', 'OwpErrorBoundary'],
    './hooks': ['useOwpDialogs', 'useDiscardGuard'],
    './feedback': ['OwpDialogsProvider'],
    './types': ['DialogProps', 'OwpDialogProps'],
  },
  theme: { '.': ['defaultThemes'] },
  utils: { './browser': ['recoverFromDynamicImportChunkLoadError'], './zip': ['saveZipFile'] },
  excel: { '.': ['createExportDataToExcelBuffer'] },
};
for (const [name, entries] of Object.entries(packages)) {
  const directory = path.join(root, 'node_modules/@owp', name);
  await mkdir(directory, { recursive: true });
  const exports = { './package.json': './package.json' };
  for (const [subpath, symbols] of Object.entries(entries)) {
    const file = subpath === '.' ? 'index' : subpath.slice(2).replaceAll('/', '-');
    if (file.endsWith('.css')) {
      exports[subpath] = `./${file}`;
      await writeFile(path.join(directory, file), '');
      continue;
    }
    exports[subpath] = { types: `./${file}.d.ts`, import: `./${file}.js` };
    await writeFile(
      path.join(directory, `${file}.d.ts`),
      symbols
        .map((symbol) =>
          subpath === './types'
            ? `export type ${symbol} = unknown;`
            : `export declare const ${symbol}: unknown;`,
        )
        .join('\n'),
    );
    await writeFile(
      path.join(directory, `${file}.js`),
      subpath === './types'
        ? ''
        : 'throw new Error("Browser modules must remain static");\n' +
            symbols.map((symbol) => `export const ${symbol} = undefined;`).join('\n'),
    );
  }
  await writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({ name: `@owp/${name}`, type: 'module', exports }),
  );
}
const verify = (content) => verifyOwpSourceContracts(root, [{ file: 'consumer.tsx', content }]);

describe('static public OWP contracts with independent package fixtures', () => {
  it('accepts direct package owners and Core integrations without importing browser modules', async () => {
    expect(
      (
        await verify(`
      import { OwpDialog, OwpErrorBoundary } from '@owp/components';
      import { useOwpDialogs } from '@owp/components/hooks';
      import { OwpDialogsProvider } from '@owp/components/feedback';
      import type { DialogProps } from '@owp/components/types';
      import { defaultThemes } from '@owp/theme';
      import { saveZipFile } from '@owp/utils/zip';
      import { recoverFromDynamicImportChunkLoadError } from '@owp/utils/browser';
      import { createExportDataToExcelBuffer } from '@owp/excel';
      import { OwpRouteErrorElement } from '@owp/core';
      import { useSearchAction, usePageLeaveGuard } from '@owp/core/hooks';
    `)
      ).errors,
    ).toEqual([]);
  });
  it('prioritizes ownership errors for removed Core wrappers and hooks', async () => {
    const result = await verify(
      `import { OwpDialog } from '@owp/core'; export { useOwpDialogs } from '@owp/core/hooks';`,
    );
    expect(result.errors.map((error) => error.reason)).toEqual(['wrong-owner', 'wrong-owner']);
  });
  it('checks type reexports separately from runtime exports', async () => {
    expect(
      (
        await verify(
          `export type { OwpSettingsConfigType } from '@owp/core/types'; export { OwpSettingsConfigType } from '@owp/core/types';`,
        )
      ).errors,
    ).toMatchObject([{ name: 'OwpSettingsConfigType', reason: 'missing-runtime-export' }]);
  });
  it('checks dynamic selections and namespace members without executing modules', async () => {
    const result = await verify(
      `const value = import('@owp/core').then(({ OwpDialog }) => OwpDialog); import * as Core from '@owp/core'; const view = <Core.OwpErrorBoundary />;`,
    );
    expect(result.errors.map((error) => error.reason)).toEqual(['wrong-owner', 'wrong-owner']);
  });
  it('rejects private subpaths and blanket Core reexports', async () => {
    expect(
      (await verify(`export * from '@owp/core/dist/index.js'; import '@owp/core/owp-app.css';`))
        .errors,
    ).toMatchObject([{ reason: 'private-path' }, { reason: 'core-re-export-all' }]);
  });
});
