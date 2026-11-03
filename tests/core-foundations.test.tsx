import { renderToStaticMarkup } from 'react-dom/server';
import { i18next } from '@owp/core/i18n';
import { describe, expect, it, vi } from 'vitest';
import '../src/app/i18n';
import { coreCatalog } from '../src/playgrounds/core/catalog';
import { CoreGettingStarted } from '../src/playgrounds/core/guides/GettingStarted';
import { coreFoundations } from '../src/playgrounds/core/guides/foundation-content';
import {
  coreOwnershipIntroduction,
  coreOwnershipNotes,
  coreOwnershipUsageNote,
} from '../src/playgrounds/core/guides/package-ownership';
import { coreEnglish } from '../src/playgrounds/core/locales/en';
import { knowledge } from './fixtures/api-knowledge';

// 문서 선택과 번역을 검증하며 DOMParser가 필요한 구문 강조는 브라우저에서 확인합니다.
vi.mock('../src/features/code/HighlightedCode', () => ({
  HighlightedCode: ({ html }: { readonly html: string }) => <code>{html}</code>,
}));

describe('Core foundation guides', () => {
  it('renders restrained semantic emphasis in both getting-started languages', async () => {
    // Given
    const example = coreCatalog[0];
    try {
      for (const language of ['ko', 'en'] as const) {
        await i18next.changeLanguage(language);
        // When
        const html = renderToStaticMarkup(<CoreGettingStarted example={example} />);
        const responsibility = html
          .split('aria-labelledby="core-responsibility"')[1]
          ?.split('</section>')[0];
        const paragraphs = [...(responsibility?.matchAll(/<p>(.*?)<\/p>/g) ?? [])].map(
          (match) => match[1] ?? '',
        );
        // Then
        expect(paragraphs).toHaveLength(4);
        expect(
          paragraphs.map((paragraph) => [...paragraph.matchAll(/<strong>(.*?)<\/strong>/g)].length),
        ).toEqual([1, 0, 0, 1]);
        expect(responsibility).not.toContain('&lt;strong&gt;');
        if (language === 'en') expect(responsibility).not.toMatch(/[가-힣]/);
      }
    } finally {
      await i18next.changeLanguage('ko');
    }
  });

  it('explains the shared UI and Core policy differences without claiming identical props', () => {
    const example = coreCatalog[0];
    const html = renderToStaticMarkup(<CoreGettingStarted example={example} />);
    expect(html).toContain('패키지별 기능과 연동');
    expect(html).toContain('isRunning·isCanceling');
    expect(html).toContain('progressFilter');
    expect(html).toContain('useSearchAction');
    for (const text of [
      coreOwnershipIntroduction,
      coreOwnershipUsageNote,
      ...Object.values(coreOwnershipNotes).map((note) => note.body),
    ]) {
      expect(coreEnglish[text], text).toBeTruthy();
      expect(coreEnglish[text], text).not.toMatch(/[가-힣]/);
    }
    const guide = knowledge.records.find((record) => record.id === '@owp/core:guide.composition');
    expect(guide?.sections?.[0]?.title).toBe('패키지별 역할과 연결');
    expect(guide?.body).toContain('isRunning·isCanceling');
  });
  it('renders each foundation as its own setup guide with working source code', () => {
    for (const id of ['providers', 'state-management', 'api-setup', 'theme-settings']) {
      const example = coreCatalog.find((entry) => entry.id === id);
      if (!example || example.kind !== 'guide') throw new TypeError(`Missing guide: ${id}`);
      const html = renderToStaticMarkup(<CoreGettingStarted example={example} />);
      expect(html).toContain(i18next.t(example.title, { ns: 'owp' }));
      expect(html).toContain('설정 방법');
      expect(html).toContain('적용 결과');
      expect(html).toContain(example.source);
      expect(html).not.toContain('프로젝트 루트의 .npmrc');
    }
  });

  it('translates every foundation paragraph and heading through the existing app namespace', async () => {
    for (const guide of coreFoundations) {
      const strings = [
        guide.title,
        guide.introduction,
        ...guide.sections.flatMap((s) => [s.title, s.body]),
      ];
      for (const text of strings) {
        expect(coreEnglish[text], text).toBeTruthy();
        expect(coreEnglish[text], text).not.toMatch(/[가-힣]/);
      }
    }
    try {
      const example = coreCatalog.find((entry) => entry.id === 'providers');
      if (!example || example.kind !== 'guide') throw new TypeError('Missing provider guide');
      for (const language of ['ko', 'en']) {
        await i18next.changeLanguage(language);
        const html = renderToStaticMarkup(<CoreGettingStarted example={example} />);
        const introduction = html.split('class="guide-introduction">')[1]?.split('</p>')[0];
        expect(introduction).toBeDefined();
        expect(introduction).not.toContain('&lt;strong&gt;');
        const emphasized = [...(introduction?.matchAll(/<strong>(.*?)<\/strong>/g) ?? [])].map(
          (match) => match[1],
        );
        expect(emphasized.sort()).toEqual([
          'AppProviders',
          'OwpCoreProvider',
          'OwpStyleProvider',
          'OwpUiProvider',
          'RouterProvider',
        ]);
        if (language === 'en') {
          expect(html).toContain('Provider setup');
          expect(html).toContain('Expected behavior');
          expect(html).not.toContain('적용 결과');
        }
      }
    } finally {
      await i18next.changeLanguage('ko');
    }
  });

  it('publishes setup, effects, source links and runtime boundaries in Knowledge', () => {
    for (const [id, exampleId] of [
      ['@owp/core:guide.providers', 'providers'],
      ['@owp/core:guide.state', 'state-management'],
      ['@owp/core:guide.api', 'api-setup'],
      ['@owp/core:guide.theme', 'theme-settings'],
    ]) {
      const guide = knowledge.records.find((record) => record.id === id);
      expect(guide?.kind).toBe('guide');
      expect(guide?.packageVersion).toBe('10.3.0');
      expect(guide?.sections?.map((section) => section.title)).toContain('설정 방법');
      expect(guide?.sections?.map((section) => section.title)).toContain('설정 후 기대효과');
      expect(guide?.examples.some((example) => example.id === exampleId)).toBe(true);
      expect(guide?.source?.path).toBe('src/playgrounds/core/guides/foundation-content.ts');
    }
    expect(knowledge.records.find((r) => r.id === '@owp/core:guide.providers')?.body).toContain(
      'Data Router',
    );
    expect(knowledge.records.find((r) => r.id === '@owp/core:guide.state')?.body).toContain(
      'storage',
    );
    expect(knowledge.records.find((r) => r.id === '@owp/core:guide.api')?.body).toContain(
      'isServerErrorMessageEnabled=false',
    );
    expect(knowledge.records.find((r) => r.id === '@owp/core:guide.theme')?.body).toContain(
      '최초 설치 상태',
    );
  });
});
