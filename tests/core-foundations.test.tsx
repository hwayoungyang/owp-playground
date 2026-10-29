import { renderToStaticMarkup } from 'react-dom/server';
import i18next from 'i18next';
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
    const copy = {
      ko: [
        'Core는 프로바이더·상태 관리·API·테마를 연결하는 앱의 기반입니다. 프로바이더는 공유 실행 환경을 만들고, 상태 hook은 사용자·메뉴·설정을, API hook은 요청과 캐시를, 테마 설정은 앱의 공통 스타일을 관리합니다.',
        '문서 메뉴의 프로바이더 구성 → 상태 관리 → API 설정 → 테마와 설정 순서로 각 기능의 역할·설정 방법·기대효과를 확인하세요. 아래에서는 설치와 전체 진입 코드를 확인할 수 있습니다.',
        '참조 프로젝트의 AppProviders·App·api/index.ts·configs/theme/settings.ts 구성을 기준으로 업무별 값은 줄이고 공통 연결 방법을 설명합니다. 실행 예제에서는 API 응답·권한·설정·페이지 정책의 실제 변화를 확인합니다.',
        '공통 UI는 Components가 제공하고, Core는 그 UI에 앱 설정·인증·페이지 이탈·요청 취소 같은 정책을 연결합니다. 같은 패키지별 역할에는 이미 적용된 정책을 중복 연결하지 않습니다.',
      ],
      en: [
        'Core connects the app foundation: providers, state management, APIs, and themes. Providers create a shared runtime; state hooks manage users, menus, and settings; API hooks manage requests and caches; theme settings manage shared styles.',
        'Read Provider setup → State management → API setup → Themes and settings for each feature’s purpose, configuration, and expected behavior. Installation and the complete entry code follow below.',
        'The guides follow the reference project’s AppProviders, App, api/index.ts, and configs/theme/settings.ts, replacing business-specific values with shared setup patterns. Executable examples demonstrate API responses, permissions, settings, and page policies.',
        'Components provides shared UI, and Core connects app settings, authentication, page-leave protection, and request cancellation to that UI. Do not duplicate policies already applied by the package that owns them.',
      ],
    } as const;
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
        expect(paragraphs.map((paragraph) => paragraph.replace(/<\/?strong>/g, ''))).toEqual(
          copy[language],
        );
        expect(
          paragraphs.map((paragraph) =>
            [...paragraph.matchAll(/<strong>(.*?)<\/strong>/g)].map((match) => match[1]),
          ),
        ).toEqual([
          [language === 'ko' ? '공유 실행 환경' : 'shared runtime'],
          [],
          [],
          [language === 'ko' ? '정책을 중복 연결하지 않습니다' : 'Do not duplicate policies'],
        ]);
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
    expect(html).toContain('패키지별 역할과 연결');
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
      expect(html).toContain(example.title);
      expect(html).toContain('설정 방법');
      expect(html).toContain('설정 후 기대효과');
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
    await i18next.changeLanguage('en');
    try {
      const example = coreCatalog.find((entry) => entry.id === 'providers');
      if (!example || example.kind !== 'guide') throw new TypeError('Missing provider guide');
      const html = renderToStaticMarkup(<CoreGettingStarted example={example} />);
      expect(html).toContain('Provider setup');
      expect(html).toContain('Expected behavior');
      expect(html).not.toContain('설정 후 기대효과');
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
