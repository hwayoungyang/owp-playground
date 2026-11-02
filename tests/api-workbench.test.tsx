import '../src/app/i18n';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PropsTable } from '../src/playgrounds/components/api/ApiProps';
import type { ComponentsApiMember } from '../src/playgrounds/components/api/types';
import { ParametersTable } from '../src/features/public-api/ParametersTable';
import { PublicApiEntry } from '../src/features/public-api/PublicApiEntry';
import type {
  PublicApiEntry as EntryData,
  PublicApiSignature,
} from '../src/features/public-api/types';

// SSR에서는 브라우저 DOMParser만 제외하고 실제 UI와 계약 데이터를 렌더링합니다.
vi.mock('../src/features/code/highlight', () => ({ highlightSource: (code: string) => code }));
vi.mock('../src/features/code/HighlightedCode', () => ({
  HighlightedCode: ({ html }: { readonly html: string }) => <code>{html}</code>,
}));
vi.mock('../src/features/code/CodeViewer', () => ({
  CodeViewer: ({ example }: { readonly example: { readonly id: string } }) => (
    <pre data-example-id={example.id} />
  ),
}));
afterEach(() => vi.unstubAllGlobals());

const member: ComponentsApiMember = {
  name: 'value',
  type: 'string | undefined',
  requirement: 'optional',
  source: '@owp/components',
  defaultValue: null,
  description: '',
  isCallback: false,
};
const signature: PublicApiSignature = {
  declaration: 'createExample(options?: Options): Result',
  parameters: [
    { name: 'options', type: 'Options | undefined', optional: true, rest: false, description: '' },
  ],
  returnType: 'Result',
  returnDescription: '',
  parameterMembers: [],
  returnMembers: [],
};
const entry: EntryData = {
  id: '@owp/core:createExample',
  name: 'createExample',
  packageId: 'core',
  kind: 'function',
  group: 'utils',
  modules: ['@owp/core/utils'],
  description: '',
  owner: '@owp/core',
  imports: ["import { createExample } from '@owp/core/utils';"],
  declaration: signature.declaration,
  propsVariants: [],
  signatures: [signature],
  valueType: null,
  examples: [],
  usage: 'const result = createExample();',
  usageKind: 'documented',
};
function columns(html: string): number {
  return html.match(/<thead>([\s\S]*?)<\/thead>/)?.[1]?.match(/scope="col"/g)?.length ?? 0;
}

describe('API contract table density', () => {
  it('omits empty optional columns without removing parameter types', () => {
    // Given / When
    const html = renderToStaticMarkup(<ParametersTable signature={signature} javascript={false} />);
    // Then
    expect(columns(html)).toBe(3);
    expect(html).toContain('Options | undefined');
  });

  it('retains the description column when any parameter documents a value', () => {
    // Given
    const documented = {
      ...signature,
      parameters: [
        { name: 'name', type: 'string', optional: false, rest: false, description: 'Unique name' },
        ...signature.parameters,
      ],
    };
    // When
    const html = renderToStaticMarkup(
      <ParametersTable signature={documented} javascript={false} />,
    );
    // Then
    expect(columns(html)).toBe(4);
    expect(html).toContain('Unique name');
    expect(html).toContain('Options | undefined');
  });

  it('keeps a falsy default value and source documentation visible', () => {
    // Given
    const members = [{ ...member, defaultValue: '0', description: 'Zero is supported.' }, member];
    // When
    const html = renderToStaticMarkup(<PropsTable members={members} />);
    // Then
    expect(columns(html)).toBe(5);
    expect(html).toContain('<code>0</code>');
    expect(html).toContain('Zero is supported.');
    expect(html).toContain('@owp/components');
  });

  it('omits empty default and description columns from Props', () => {
    // Given / When
    const html = renderToStaticMarkup(<PropsTable members={[member]} />);
    // Then
    expect(columns(html)).toBe(3);
    expect(html).toContain('string | undefined');
  });
});

describe('API workbench routing', () => {
  it.each(['params', 'returns', 'code'] as const)('honors the shared %s URL', (tab) => {
    // Given
    vi.stubGlobal('location', { search: `?tab=${tab}` });
    // When
    const html = renderToStaticMarkup(<PublicApiEntry entry={entry} />);
    // Then
    expect(html).toMatch(new RegExp(`aria-selected="true"[^>]*id="[^"]*-tab-${tab}"`));
    expect(html).toContain(`data-active="${tab === 'code' ? 'code' : 'content'}"`);
    expect(html).toContain(`data-mode="${tab === 'code' ? 'code' : 'split'}"`);
  });

  it('exposes a related example link before the API tabs', () => {
    // Given
    const linked = {
      ...entry,
      examples: [
        {
          packageId: 'core',
          id: 'request-parameters',
          title: '요청 파라미터',
          source: 'playgrounds/core/examples/request-parameters.tsx',
        },
      ],
    };
    // When
    const html = renderToStaticMarkup(<PublicApiEntry entry={linked} />);
    // Then
    expect(html).toContain('package=core&amp;sample=request-parameters&amp;lang=ko');
    expect(html.indexOf('sample=request-parameters')).toBeLessThan(html.indexOf('role="tablist"'));
    expect(html).toContain('aria-controls=');
  });
});
