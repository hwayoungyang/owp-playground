import { coreCatalog } from '../src/playgrounds/core/catalog.ts';
import { coreFoundations } from '../src/playgrounds/core/guides/foundation-content.ts';

const examplesByGuide = {
  providers: ['getting-started', 'page-carded', 'loading'],
  'state-management': ['user-permissions', 'app-settings', 'language-switcher'],
  'api-setup': ['api-query', 'query-selector', 'common-code', 'search-filter'],
  'theme-settings': ['app-settings'],
};

export const coreFoundationGuides = coreFoundations.map((guide) => {
  const example = coreCatalog.find((entry) => entry.id === guide.id);
  if (!example) throw new ReferenceError(`Core 기반 가이드의 예제가 없습니다: ${guide.id}`);
  return {
    id: guide.knowledgeId,
    packageId: 'core',
    title: guide.title,
    description: example.description,
    api: example.api,
    examples: [guide.id, ...examplesByGuide[guide.id]],
    body: [guide.introduction, ...guide.sections.map((section) => section.body)].join('\n\n'),
    sourcePath: 'src/playgrounds/core/guides/foundation-content.ts',
  };
});
