import '../src/app/i18n';
import { readFile } from 'node:fs/promises';
import { i18next } from '@owp/core/i18n';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ComponentsApiReference } from '../src/playgrounds/components/api/ComponentsApiReference';
import { ApiProps } from '../src/playgrounds/components/api/ApiProps';
import { filterComponentsApiEntries } from '../src/playgrounds/components/api/navigation';
import { componentsApiEnglish } from '../src/playgrounds/components/locales/api.en';
import { componentsApiUiFixture } from './fixtures/components-api-ui';

vi.mock('virtual:components-api-data', async () => ({
  componentsApiData: (await import('./fixtures/components-api-ui')).componentsApiUiFixture,
}));
// Node의 SSR 검사는 DOMParser 경계를 제외하고 실제 코드 영역과 복사 UI를 렌더링합니다.
vi.mock('../src/features/code/highlight', () => ({ highlightSource: (code: string) => code }));
vi.mock('../src/features/code/HighlightedCode', () => ({
  HighlightedCode: ({ html }: { readonly html: string }) => <code>{html}</code>,
}));

afterEach(async () => {
  await i18next.changeLanguage('ko');
});

describe('Components API index', () => {
  it('opens components first with category filters and real symbol links', () => {
    const html = renderToStaticMarkup(<ComponentsApiReference symbol={null} />);
    for (const group of ['입력·선택', 'Hooks', 'Utils'])
      expect(html).toContain(`>${group}</button>`);
    expect(html).toContain('class="api-index-list"');
    for (const entry of componentsApiUiFixture.entries.filter(
      (entry) => entry.group === 'components',
    )) {
      expect(html).toContain(`symbol=${entry.id}&amp;lang=ko`);
      expect(html).toContain(entry.name);
    }
    expect(html).toContain('aria-pressed="true">입력·선택</button>');
    expect(html).toContain('전체 4개 중 1개 API');
    expect(html).toContain('API 검색');
    expect(html).not.toContain('Props 표');
  });

  it('searches names, original descriptions and imports across every group', () => {
    const entries = componentsApiUiFixture.entries;
    expect(filterComponentsApiEntries(entries, ' NUMberFIELD ').map((entry) => entry.id)).toEqual([
      'OwpNumberField',
    ]);
    expect(filterComponentsApiEntries(entries, '숫자 입력').map((entry) => entry.id)).toEqual([
      'OwpNumberField',
    ]);
    expect(filterComponentsApiEntries(entries, '/hooks').map((entry) => entry.id)).toEqual([
      'useExample',
    ]);
    expect(filterComponentsApiEntries(entries, 'combines style').map((entry) => entry.id)).toEqual([
      'mergeExample',
    ]);
    expect(filterComponentsApiEntries(entries, '/utils')).toHaveLength(2);
    expect(filterComponentsApiEntries(entries, 'unknown')).toEqual([]);
    expect(filterComponentsApiEntries(entries, '   ')).toEqual(entries);
  });
});

describe('Components API detail', () => {
  it('translates usage variants and avoids a redundant disclosure for a single Props table', async () => {
    await i18next.changeLanguage('en');
    const html = renderToStaticMarkup(
      <ApiProps
        variants={[
          {
            label: '외부 데이터 연결 (controlled)',
            declaration: '(props: ControlledProps): Element',
            props: [],
          },
          {
            label: '데이터 누적 (append)',
            declaration: '(props: AppendProps): Element',
            props: [],
          },
        ]}
      />,
    );
    expect(html).toContain('Controlled data');
    expect(html).toContain('Append data');
    expect(html).not.toContain('외부 데이터 연결');
    const single = renderToStaticMarkup(
      <ApiProps variants={[{ label: 'Props', declaration: '(): Element', props: [] }]} />,
    );
    expect(single).not.toContain('<summary>');
  });

  it('explains components whose public call signature accepts no props', async () => {
    for (const language of ['ko', 'en']) {
      await i18next.changeLanguage(language);
      const html = renderToStaticMarkup(<ApiProps variants={[]} />);
      expect(html).toContain(
        language === 'en' ? 'This declaration has no props.' : '이 타입 선언에는 Props가 없습니다.',
      );
      expect(html).not.toContain('<table>');
    }
  });

  it('preserves variant types, prop origins and actual callback/ref data', async () => {
    await i18next.changeLanguage('en');
    const html = renderToStaticMarkup(<ComponentsApiReference symbol="OwpNumberField" />);
    expect(html).toContain('OwpNumberField API');
    expect(html).toContain('숫자 입력의 원문 설명입니다.');
    expect(html).toContain('Original value description.');
    expect(html).toContain('<code>string</code>');
    expect(html).toContain('<code>string[]</code>');
    expect(html).toContain('<code>never</code>');
    expect(html).toContain('Not available in this variant');
    expect(html).toContain('Conditional');
    expect(html).toContain('Inherited props (1)');
    expect(html).toContain('@mui/material');
    expect(html).toContain('Required');
    expect(html).toContain('Optional');
    expect(html.match(/>Callback<\/span>/g)).toHaveLength(1);
    expect(html).toContain('<code>ref</code>');
    expect(html).toContain('<code>onLabel</code>');
    expect(html).toContain('symbol=NumberFieldInfo&amp;lang=en');
    expect(html).toContain('sample=number-field&amp;lang=en');
    expect(html).toContain('sample=number-field&amp;lang=en&amp;tab=code');
    expect(html).toContain('view=api&amp;lang=en');
    expect(html).toContain('role="region" aria-label="Props table" tabindex="0"');
  });

  it('renders every hook overload, optional parameters and original return documentation', async () => {
    await i18next.changeLanguage('en');
    const html = renderToStaticMarkup(<ComponentsApiReference symbol="useExample" />);
    for (const text of [
      'Signature 1',
      'Signature 2',
      'Parameters',
      'Optional',
      'Returns',
      'Original parameter description.',
      'Original return description.',
      'There are no parameters.',
    ])
      expect(html).toContain(text);
    expect(html).toContain('useExample(options?: Options): Result');
    expect(html).not.toContain('Props table');
    expect(html).not.toContain('<code>ref</code>');
  });

  it('identifies rest parameters on functions and shows values without fabricated function sections', async () => {
    await i18next.changeLanguage('en');
    const fn = renderToStaticMarkup(<ComponentsApiReference symbol="mergeExample" />);
    expect(fn).toContain('...styles');
    expect(fn).toContain('Rest parameter');
    const value = renderToStaticMarkup(<ComponentsApiReference symbol="responsiveLayoutStyles" />);
    expect(value).toContain('Readonly&lt;LayoutStyles&gt;');
    expect(value).toContain('declare const responsiveLayoutStyles: Readonly&lt;LayoutStyles&gt;;');
    for (const text of ['Parameters', 'Returns', 'Props table']) expect(value).not.toContain(text);
  });

  it('opens supporting types without inventing an import and reports unregistered symbols', async () => {
    await i18next.changeLanguage('en');
    const type = renderToStaticMarkup(<ComponentsApiReference symbol="NumberFieldInfo" />);
    expect(type).toContain('Original supporting type description.');
    expect(type).toContain('No public import was verified in the declarations.');
    expect(type).toContain('source: &quot;event&quot; | &quot;prop&quot;');
    const missing = renderToStaticMarkup(<ComponentsApiReference symbol="NotRegistered" />);
    expect(missing).toContain('API not found.');
    expect(missing).toContain('NotRegistered is not in the registered Components APIs.');
    expect(missing).toContain('view=api&amp;lang=en');
    expect(missing).not.toContain('OwpNumberField API');
  });

  it('registers visible UI strings for Korean and English while preserving source descriptions', async () => {
    const paths = [
      'ComponentsApiReference.tsx',
      'ComponentsApiIndex.tsx',
      'ApiDeclaration.tsx',
      'ApiProps.tsx',
      'ApiSignatures.tsx',
    ];
    const sources = await Promise.all(
      paths.map((path) =>
        readFile(new URL(`../src/playgrounds/components/api/${path}`, import.meta.url), 'utf8'),
      ),
    );
    const literals = sources.flatMap((source) =>
      Array.from(source.matchAll(/'([^'\n]*[가-힣][^'\n]*)'/g), (match) => match[1]),
    );
    for (const language of ['ko', 'en']) {
      await i18next.changeLanguage(language);
      for (const key of [...Object.keys(componentsApiEnglish), ...literals]) {
        if (!key) throw new RangeError('Missing API translation key');
        expect(i18next.exists(key), key).toBe(true);
        if (language === 'en' && /[가-힣]/.test(key)) expect(i18next.t(key), key).not.toBe(key);
      }
      const html = renderToStaticMarkup(<ComponentsApiReference symbol={null} />);
      expect(html).toContain(`symbol=OwpNumberField&amp;lang=${language}`);
      expect(html).toContain(language === 'en' ? 'Search APIs' : 'API 검색');
      const hook = renderToStaticMarkup(<ComponentsApiReference symbol="useExample" />);
      expect(hook).toContain('Signature');
      expect(hook).toContain(language === 'en' ? 'Parameters' : '매개변수');
      const detail = renderToStaticMarkup(<ComponentsApiReference symbol="OwpNumberField" />);
      for (const label of [
        'Name',
        'Type',
        'Requirement',
        'Default',
        'Description',
        'Required',
        'Optional',
        'Conditional',
        'Not specified',
        'Not available in this variant',
      ])
        expect(detail).toContain(label);
      expect(detail).toContain('숫자 입력의 원문 설명입니다.');
    }
  });
});
