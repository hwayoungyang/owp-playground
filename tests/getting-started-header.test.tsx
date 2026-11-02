import '../src/app/i18n';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { GettingStartedHeader } from '../src/shared/ui/GettingStartedHeader';

it('uses a shared opening with one introduction and no catalogue summary for every package', () => {
  const packages = [
    'core',
    'components',
    'charts',
    'datagrid',
    'date-picker',
    'excel',
    'pdf',
    'theme',
    'utils',
  ] as const;
  for (const packageId of packages) {
    const html = renderToStaticMarkup(
      <GettingStartedHeader
        packageId={packageId}
        example={{
          id: 'getting-started',
          title: '시작하기',
          package: `@owp/${packageId}`,
          category: 'docs',
          description: 'catalog-summary-marker',
          api: [],
          source: '',
        }}
      />,
    );
    expect(html.match(/class="guide-introduction"/g)).toHaveLength(1);
    expect(html.match(/<h1>/g)).toHaveLength(1);
    expect(html).toContain('class="getting-started-header"');
    expect(html).not.toContain('catalog-summary-marker');
  }
});
