import '../src/app/i18n';
import { readFile } from 'node:fs/promises';
import i18next from 'i18next';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import componentsManifest from '@owp/components/package.json' with { type: 'json' };
import * as components from '@owp/components';
import * as hooks from '@owp/components/hooks';
import * as utils from '@owp/components/utils';
import { ComponentsGettingStarted } from '../src/playgrounds/components/guides/GettingStarted';
import { GettingStartedComponents } from '../src/playgrounds/components/guides/getting-started';
import { componentsCatalog } from '../src/playgrounds/components/catalog';
import { guidesEnglish } from '../src/playgrounds/components/locales/guides.en';

// Node에서는 DOMParser가 필요한 구문 강조를 제외하고 가이드 본문과 번역을 검증합니다.
vi.mock('../src/features/code/HighlightedCode', () => ({
  HighlightedCode: ({ html }: { readonly html: string }) => <code>{html}</code>,
}));

afterEach(async () => {
  await i18next.changeLanguage('ko');
});

describe('Components getting started', () => {
  it('renders a translated guide with installed dependency ranges and locale-preserving links', async () => {
    const guide = componentsCatalog.find((entry) => entry.kind === 'guide');
    if (!guide) throw new RangeError('Missing Components guide');
    const guideSource = await readFile(
      new URL('../src/playgrounds/components/guides/GettingStarted.tsx', import.meta.url),
      'utf8',
    );
    const literals = Array.from(
      guideSource.matchAll(/'([^'\n]*[가-힣][^'\n]*)'/g),
      (match) => match[1],
    );
    for (const language of ['ko', 'en']) {
      await i18next.changeLanguage(language);
      for (const text of literals) {
        if (!text) throw new RangeError('Missing guide translation key');
        expect(i18next.exists(text), text).toBe(true);
        if (language === 'en') expect(i18next.t(text), text).not.toBe(text);
      }
      const html = renderToStaticMarkup(<ComponentsGettingStarted example={guide} />);
      expect(html).toContain(language === 'en' ? 'Getting started' : '시작하기');
      expect(html).toContain(`@owp/components@${componentsManifest.version}`);
      for (const name of [
        'react',
        'react-dom',
        '@mui/material',
        '@mui/system',
        '@emotion/react',
        '@emotion/styled',
      ] as const) {
        expect(html).toContain(`${name}@${componentsManifest.peerDependencies[name]}`);
      }
      for (const sample of [
        'number-field',
        'hook-use-responsive-device',
        'util-split-selector-value',
      ]) {
        expect(html).toContain(`sample=${sample}&amp;lang=${language}`);
        expect(
          componentsCatalog.some((entry) => entry.kind === 'component' && entry.id === sample),
        ).toBe(true);
      }
      expect(html).toContain('id="components-mcp"');
    }
    for (const key of Object.keys(guidesEnglish)) expect(i18next.exists(key)).toBe(true);
  });

  it('renders the first number field without Playground providers or observers', async () => {
    for (const language of ['ko', 'en']) {
      await i18next.changeLanguage(language);
      const html = renderToStaticMarkup(<GettingStartedComponents />);
      expect(html).toContain('Quantity');
      expect(html).toContain('Enter a whole number.');
      expect(html).toContain('value="12"');
    }
  });

  it('uses installed named APIs in each documented public entry point', () => {
    expect(components.OwpNumberField).toBeDefined();
    expect(components.OwpTable).toBeDefined();
    expect(hooks.useConfirm).toBeTypeOf('function');
    expect(hooks.useResponsiveDevice).toBeTypeOf('function');
    expect(utils.splitSelectorValue).toBeTypeOf('function');
    expect(utils.mergeSx).toBeTypeOf('function');
  });
});
