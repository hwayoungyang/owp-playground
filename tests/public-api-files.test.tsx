import '../src/app/i18n';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { buildNavigationModel } from '../src/app/layout/navigation';
import { PublicApiPackageView } from '../src/features/public-api/PublicApiWorkspace';
import type { PublicApiEntry, PublicApiPackageData } from '../src/features/public-api/types';
import { corePackage } from '../src/playgrounds/packages';

vi.mock('virtual:playground-source-graph', () => ({ default: {} }));
vi.mock('../src/features/code/highlight', () => ({ highlightSource: (code: string) => code }));
vi.mock('../src/features/code/HighlightedCode', () => ({
  HighlightedCode: ({ html }: { readonly html: string }) => <code>{html}</code>,
}));

function fileEntry(name: string): PublicApiEntry {
  return {
    id: `@owp/core:entrypoint:./${name}`,
    name: `@owp/core/${name}`,
    packageId: 'core',
    kind: 'asset',
    group: 'assets',
    modules: [`@owp/core/${name}`],
    description: '',
    owner: '@owp/core',
    imports: [],
    declaration: `"./${name}"`,
    propsVariants: [],
    signatures: [],
    valueType: null,
    examples: [],
    usage: `import '@owp/core/${name}';`,
    usageKind: 'asset',
  };
}

const entries = [fileEntry('owp-app.css'), fileEntry('package.json')];
const data: PublicApiPackageData = {
  id: 'core',
  version: corePackage.version,
  entries,
  entrypoints: [],
};

it('lists the stylesheet without package metadata in API navigation and counts', () => {
  // Given: the package exports a stylesheet and its own manifest.
  // When
  const model = buildNavigationModel({
    playground: corePackage,
    examples: [],
    categories: [],
    currentId: 'exports',
    isApi: false,
    getExampleUrl: (id) => `?sample=${encodeURIComponent(id)}`,
    publicEntries: entries,
  });
  // Then
  const reference = model.groups.find((group) => group.id === 'reference');
  if (reference?.type !== 'examples') throw new TypeError('Missing API navigation');
  expect(reference.categories.map((category) => category.label)).toEqual(['Styles']);
  expect(
    reference.categories.flatMap((category) => category.items.map((item) => item.title)),
  ).toEqual(['@owp/core/owp-app.css']);
  expect(model.publicApiCount).toBe(1);
});

it('keeps metadata out of the API index while listing usable CSS', () => {
  // Given / When
  const html = renderToStaticMarkup(<PublicApiPackageView data={data} symbol={null} />);
  // Then
  expect(html).toContain('>Styles</button>');
  expect(html).toContain('class="api-index-row"');
  expect(html).toContain('@owp/core/owp-app.css');
  expect(html).toContain('CSS 파일');
  expect(html).not.toContain('@owp/core/package.json');
});

it('omits the Styles group when the package has no stylesheet', () => {
  // Given
  const metadataOnly = { ...data, entries: [fileEntry('package.json')] };
  // When
  const html = renderToStaticMarkup(<PublicApiPackageView data={metadataOnly} symbol={null} />);
  // Then
  expect(html).not.toContain('>Styles</button>');
  expect(html).not.toContain('@owp/core/package.json');
});

it('keeps an existing direct link to package metadata usable', () => {
  // Given / When
  const html = renderToStaticMarkup(
    <PublicApiPackageView data={data} symbol="@owp/core:entrypoint:./package.json" />,
  );
  // Then
  expect(html).toContain('@owp/core/package.json');
  expect(html).not.toContain('공개 API 항목을 찾을 수 없습니다.');
});
