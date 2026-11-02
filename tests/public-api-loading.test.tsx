import '../src/app/i18n';
import i18next from 'i18next';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream, renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PublicApiWorkspace } from '../src/features/public-api/PublicApiWorkspace';
import { WorkspaceLoading } from '../src/shared/ui/WorkspaceLoading';

const { loadEntry } = vi.hoisted(() => ({ loadEntry: vi.fn() }));
vi.mock('../src/features/public-api/loader', () => ({ loadPublicApiEntry: loadEntry }));
vi.mock('../src/features/public-api/PublicApiEntry', () => ({
  PublicApiEntry: ({ entry }: { readonly entry: { readonly name: string } }) => (
    <p>{`${entry.name} details`}</p>
  ),
}));
vi.mock('virtual:public-api/index', () => ({
  default: [
    {
      id: 'components',
      version: '4.0.1',
      entries: [
        {
          id: '@owp/components:OwpNumberField',
          name: 'OwpNumberField',
          packageId: 'components',
          kind: 'component',
          group: 'components',
          modules: ['@owp/components'],
          description: '',
        },
      ],
    },
  ],
}));

afterEach(async () => {
  vi.clearAllMocks();
  await i18next.changeLanguage('ko');
});

describe('API loading boundaries', () => {
  it('renders the searchable summary immediately without loading package details', () => {
    const html = renderToStaticMarkup(<PublicApiWorkspace packageId="components" symbol={null} />);
    expect(html).toContain('OwpNumberField');
    expect(html).toContain('API 검색');
    expect(html).toContain('aria-pressed="true">입력·선택</button>');
    expect(html).not.toContain('workspace-loading');
    expect(loadEntry).not.toHaveBeenCalled();
  });

  it('shows centered page feedback while loading only the requested API', () => {
    loadEntry.mockReturnValue(new Promise(() => {}));
    const html = renderToStaticMarkup(
      <PublicApiWorkspace packageId="components" symbol="@owp/components:OwpNumberField" />,
    );
    expect(loadEntry).toHaveBeenCalledExactlyOnceWith(
      'components',
      '@owp/components:OwpNumberField',
    );
    expect(html).toContain('data-scope="page"');
    expect(html).toContain('API를 불러오는 중…');
  });

  it('replaces loading feedback with the requested detail after the cached request resolves', async () => {
    loadEntry.mockResolvedValue({
      id: '@owp/components:OwpDialog',
      name: 'OwpDialog',
      packageId: 'components',
      kind: 'component',
      group: 'components',
      modules: ['@owp/components'],
      description: '',
      owner: '@owp/components',
      imports: [],
      declaration: '',
      propsVariants: [],
      signatures: [],
      valueType: null,
      examples: [],
      usage: '',
      usageKind: 'component',
    });
    const html = await renderReady(
      <PublicApiWorkspace packageId="components" symbol="@owp/components:OwpDialog" />,
    );
    expect(html).toContain('OwpDialog details');
    expect(html).not.toContain('workspace-loading');
    expect(loadEntry).toHaveBeenCalledExactlyOnceWith('components', '@owp/components:OwpDialog');
  });
});

function renderReady(element: ReactNode): Promise<string> {
  return new Promise((resolve, reject) => {
    const sink = new PassThrough();
    sink.setEncoding('utf8');
    let html = '';
    sink.on('data', (chunk: string) => {
      html += chunk;
    });
    sink.on('end', () => resolve(html));
    sink.on('error', reject);
    const stream = renderToPipeableStream(element, {
      onAllReady: () => stream.pipe(sink),
      onError: reject,
    });
  });
}

describe('shared loading feedback', () => {
  it.each([
    ['ko', '예제를 불러오는 중…'],
    ['en', 'Loading example…'],
  ])('announces one %s status without inventing a percentage', async (language, label) => {
    await i18next.changeLanguage(language);
    const html = renderToStaticMarkup(<WorkspaceLoading />);
    expect(html).toContain(label);
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).toContain('MuiCircularProgress-root');
    expect(html).toContain('MuiLinearProgress-root');
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(2);
    expect(html).not.toContain('aria-valuenow');
  });
});
