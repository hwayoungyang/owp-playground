export { packageIntroductions } from '../shared/i18n/package-introductions.ts';

export const standaloneGuidePackageIds = ['date-picker', 'excel', 'pdf', 'theme', 'utils'] as const;
export type StandaloneGuidePackageId = (typeof standaloneGuidePackageIds)[number];

export function hasStandaloneGuide(id: string): id is StandaloneGuidePackageId {
  return standaloneGuidePackageIds.some((candidate) => candidate === id);
}

export function packageGuideEntry(playground: { readonly id: string; readonly name: string }) {
  return {
    id: 'getting-started',
    title: '시작하기',
    kind: 'guide',
    category: 'docs',
    package: playground.name,
    description: '패키지를 설치하고 MCP 연결과 공개 API 사용 방법을 확인합니다.',
    api: [],
    source: '',
  } as const;
}
