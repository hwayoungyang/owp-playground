import '../src/app/i18n';
import { i18next } from '@owp/core/i18n';
import type { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Provider } from '../src/app/providers/Provider';
import { componentsCatalog } from '../src/playgrounds/components/catalog';
import type { ComponentsExampleProps } from '../src/playgrounds/components/model/types';
import { componentsEnglish } from '../src/playgrounds/components/locales/en';

const modules = import.meta.glob<{ ComponentsExample: ComponentType<ComponentsExampleProps> }>(
  '../src/playgrounds/components/examples/*.tsx',
);
const observers: ComponentsExampleProps = { onData: () => {}, onRecord: () => {} };

// 서버 렌더링에서는 본문과 번역을 검사하고 실제 구문 강조는 브라우저에서 확인합니다.
vi.mock('../src/features/code/HighlightedCode', () => ({
  HighlightedCode: ({ html }: { readonly html: string }) => <code>{html}</code>,
}));

afterEach(async () => {
  await i18next.changeLanguage('ko');
});

describe('Components executable sources', () => {
  it('has translations for every description and renders every menu entry in both themes and languages', async () => {
    for (const example of componentsCatalog) {
      expect(componentsEnglish, example.id).toHaveProperty(example.description);
      if (example.kind === 'guide') continue;
      const load = modules[`../src/playgrounds/components/${example.source}`];
      if (!load) throw new RangeError(`Missing source: ${example.source}`);
      const { ComponentsExample } = await load();
      for (const language of ['ko', 'en']) {
        await i18next.changeLanguage(language);
        for (const mode of ['light', 'dark'] as const) {
          const html = renderToString(
            <Provider mode={mode}>
              <ComponentsExample {...observers} />
            </Provider>,
          );
          expect(html.length, `${example.id}/${language}/${mode}`).toBeGreaterThan(0);
          if (
            example.category.startsWith('component-') ||
            ['components', 'hooks', 'utils'].includes(example.category)
          ) {
            const sections = html.match(/class="components-example-section"/g) ?? [];
            expect(
              sections.length,
              `${example.id}: multiple independent demonstrations`,
            ).toBeGreaterThanOrEqual(2);
          }
        }
      }
    }
  }, 60000);
});
