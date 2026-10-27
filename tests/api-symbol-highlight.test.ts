import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { highlightSource } from '../src/features/code/highlight';
import { sourceTokens } from '../src/features/code/highlight-tokens';
import { coreCatalog } from '../src/playgrounds/core/catalog';
import { gridCatalog } from '../src/playgrounds/datagrid/catalog';
import { chartExecutionCatalog } from '../src/playgrounds/charts/catalog';

const core = { package: '@owp/core', api: [] };
function names(html: string) {
  return sourceTokens(html)
    .filter((token) => token.scopes.includes('code-api-symbol'))
    .map((token) => token.text);
}
function text(html: string) {
  const entities: Readonly<Record<string, string>> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
  };
  return html
    .replace(/<\/?span\b[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#x27);/g, (entity) => entities[entity] ?? entity);
}

describe('public API symbol emphasis', () => {
  it('emphasizes only used runtime names, preserving import aliases and JSX provider pairs', () => {
    const source = `import { useInitApp as init, unused, type AppType } from '@owp/core/hooks';
import { OwpCoreProvider as Provider } from '@owp/core/contexts';
const result = init();
return <Provider title="init Provider">{result}</Provider>;`;
    const html = highlightSource(source, 'typescript', core);
    expect(names(html)).toEqual(['init', 'Provider', 'Provider']);
    expect(text(html)).toBe(source);
    expect(html).not.toContain('code-api-symbol">title');
  });

  it('filters unrelated packages, React helpers, type imports, constants, properties, comments and strings', () => {
    const source = `import { useInitApp, STORAGE_KEYS } from '@owp/core';
import type { TypeOnly } from '@owp/core';
import { type OtherType } from '@owp/core';
import { useState, useEffect } from 'react';
import { useOwpTranslation } from '@owp/components/hooks';
import { ChartFrame } from '@owp/charts';
// useInitApp() TypeOnly()
const note = 'useInitApp()';
const pattern = /useInitApp()/;
object.useInitApp();
const unrelated = { useInitApp: () => {} };
useState(); useEffect(); useOwpTranslation();
TypeOnly(); OtherType();
return <ChartFrame title="useInitApp" />;
useInitApp();`;
    const html = highlightSource(source, 'typescript', core);
    expect(names(html)).toEqual(['useInitApp']);
    expect(text(html)).toBe(source);
  });

  it('includes supporting APIs only when their owner and name are explicitly referenced', () => {
    const source = `import { OwpTable, OwpButton } from '@owp/components';
return <><OwpTable /><OwpButton /></>;`;
    expect(
      names(highlightSource(source, 'typescript', { ...core, api: ['@owp/components:OwpTable'] })),
    ).toEqual(['OwpTable']);
  });

  it('handles namespace calls and JSX names without emphasizing the namespace or ordinary properties', () => {
    const source = `import * as Core from '@owp/core';
Core.useInitApp();
const data = Core.STORAGE_KEYS;
return <Core.OwpCoreProvider><div /></Core.OwpCoreProvider>;`;
    expect(names(highlightSource(source, 'typescript', core))).toEqual([
      'useInitApp',
      'OwpCoreProvider',
      'OwpCoreProvider',
    ]);
  });

  it('keeps outer uses while excluding local variable, function parameter and arrow parameter shadows', () => {
    const source = `import { useInitApp } from '@owp/core/hooks';
useInitApp();
function local(useInitApp: () => void) { useInitApp(); }
const arrow = (useInitApp: () => void) => { useInitApp(); };
const single = useInitApp => useInitApp();
function nested() { const useInitApp = local; useInitApp(); }
function destructured() { const { useInitApp } = adapter; useInitApp(); }
useInitApp();`;
    expect(names(highlightSource(source, 'typescript', core))).toEqual([
      'useInitApp',
      'useInitApp',
    ]);
  });

  it('excludes class and object method declarations and property assignments', () => {
    const source = `import { useInitApp } from '@owp/core/hooks';
class Local { useInitApp() {} }
const handlers = { useInitApp() {} };
useInitApp();`;
    expect(names(highlightSource(source, 'typescript', core))).toEqual(['useInitApp']);
  });

  it('requires imports for direct snippets and leaves non-TypeScript content untouched', () => {
    expect(
      names(highlightSource('useInitApp(); return <OwpCoreProvider />;', 'typescript', {})),
    ).toEqual([]);
    expect(names(highlightSource('{ "useInitApp": "<Provider>" }', 'json', core))).toEqual([]);
    expect(
      names(highlightSource('/* useInitApp */ .OwpCoreProvider { color: red }', 'css', core)),
    ).toEqual([]);
  });

  it('distinguishes executable template substitutions from literal template text', () => {
    const source =
      "import { useInitApp } from '@owp/core';\nconst label = `useInitApp() ${useInitApp()}`;";
    const html = highlightSource(source, 'typescript', core);
    expect(names(html)).toEqual(['useInitApp']);
    expect(text(html)).toBe(source);
  });

  it('allows imported public API inference for full guide snippets without a selected example', async () => {
    const source = await readFile(
      new URL('../src/playgrounds/core/guides/providers.tsx', import.meta.url),
      'utf8',
    );
    const html = highlightSource(source, 'typescript', {});
    expect(names(html)).toContain('useInitApp');
    for (const provider of ['OwpCoreProvider', 'OwpStyleProvider', 'OwpUiProvider'])
      expect(names(html)).toContain(provider);
    expect(names(html)).not.toContain('useState');
    expect(text(html)).toBe(source);
  });

  it('selects APIs in a fixed common provider fixture independently of the entrypoint API list', () => {
    // 실제 파일의 소유권 변경과 분리해 설치된 Core 9.0.0의 공개 경로를 고정합니다.
    const source = `import { OwpCoreProvider, OwpDialogsProvider, OwpUiProvider, type OwpAppConfigs } from '@owp/core/contexts';
import { useGetCurrentSettings, useSetDefaultSettings } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import { OwpThemeProvider } from '@owp/theme';
import { useEffect, type ReactNode } from 'react';
function CoreProvidersFixture({ configs, children }: { configs: OwpAppConfigs; children: ReactNode }) {
  const setDefaults = useSetDefaultSettings();
  const settings = useGetCurrentSettings();
  const { t } = useOwpTranslation();
  useEffect(() => { setDefaults(configs.settingsConfig); }, [configs, setDefaults]);
  return (
    <OwpCoreProvider configs={configs}>
      <OwpThemeProvider table={settings.theme.main.table}>
        <OwpUiProvider queryCancellation={{ routeChange: true, pageExit: true }}>
          <OwpDialogsProvider>{children}</OwpDialogsProvider>
        </OwpUiProvider>
      </OwpThemeProvider>
    </OwpCoreProvider>
  );
}`;
    const html = highlightSource(source, 'typescript', core);
    for (const api of [
      'OwpCoreProvider',
      'OwpUiProvider',
      'OwpDialogsProvider',
      'useGetCurrentSettings',
      'useSetDefaultSettings',
    ])
      expect(names(html)).toContain(api);
    expect(names(html)).not.toContain('useOwpTranslation');
    expect(names(html)).not.toContain('useEffect');
    expect(names(html)).not.toContain('OwpThemeProvider');
    expect(names(html)).toEqual([
      'useSetDefaultSettings',
      'useGetCurrentSettings',
      'OwpCoreProvider',
      'OwpUiProvider',
      'OwpDialogsProvider',
      'OwpDialogsProvider',
      'OwpUiProvider',
      'OwpCoreProvider',
    ]);
    expect(text(html)).toBe(source);
  });

  it('covers Charts helpers and DataGrid components and hooks with package-specific relevance', () => {
    const source = `import { ChartFrame } from '@owp/charts';
import { createPareto } from '@owp/charts/utils';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
createPareto(); useDataGridApi(); return <><ChartFrame /><OwpDataGrid /></>;`;
    expect(names(highlightSource(source, 'typescript', { package: '@owp/charts' }))).toEqual([
      'createPareto',
      'ChartFrame',
    ]);
    expect(names(highlightSource(source, 'typescript', { package: '@owp/datagrid' }))).toEqual([
      'useDataGridApi',
      'OwpDataGrid',
    ]);
  });

  it('preserves exact text and line boundaries across current Core, Charts and DataGrid source files', async () => {
    for (const example of [
      ...coreCatalog,
      ...chartExecutionCatalog,
      ...gridCatalog.filter((entry) => entry.kind === 'grid'),
    ]) {
      const source = await readFile(
        new URL(
          `../src/playgrounds/${example.package.replace('@owp/', '')}/${example.source}`,
          import.meta.url,
        ),
        'utf8',
      );
      const html = highlightSource(source, 'typescript', example);
      expect(text(html), example.id).toBe(source);
      expect(text(html).split('\n').length, example.id).toBe(source.split('\n').length);
      for (const token of sourceTokens(html).filter((token) =>
        token.scopes.includes('code-api-symbol'),
      )) {
        expect(source.slice(token.start, token.end), example.id).toBe(token.text);
        expect(token.text, example.id).toMatch(/^[$\p{ID_Start}][$\p{ID_Continue}]*$/u);
      }
    }
  });

  it('escapes hostile source text before adding symbol spans', () => {
    const source = `import { useInitApp } from '@owp/core';
const text = '<script>alert("&")</script>'; useInitApp();`;
    const html = highlightSource(source, 'typescript', core);
    expect(html).not.toContain('<script>');
    expect(names(html)).toEqual(['useInitApp']);
    expect(text(html)).toBe(source);
  });
});
