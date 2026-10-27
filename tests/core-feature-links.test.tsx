import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import '../src/app/i18n';
import { coreCatalog } from '../src/playgrounds/core/catalog';
import { CoreFeaturesGuide } from '../src/playgrounds/core/guides/core-features';
import { coreFeatureCoverage } from '../src/playgrounds/core/model/featureCoverage';

describe('Core feature API links', () => {
  it('keeps explicit API owners when linking supporting package APIs', () => {
    // Given
    const example = coreCatalog.find((entry) => entry.id === 'core-features');
    if (!example || example.kind !== 'guide') throw new TypeError('Missing feature guide');

    // When
    const html = renderToStaticMarkup(<CoreFeaturesGuide example={example} />);
    const symbols = [...html.matchAll(/href="([^"]+)"/g)].flatMap(([, href]) => {
      if (!href) return [];
      const params = new URLSearchParams(href.replaceAll('&amp;', '&').slice(1));
      return params.get('view') === 'api' ? [params.get('symbol')] : [];
    });

    // Then
    expect(symbols).toEqual(
      coreFeatureCoverage.flatMap((group) =>
        group.api.map((name) => (name.includes(':') ? name : `@owp/core:${name}`)),
      ),
    );
    expect(symbols).toContain('@owp/core:usePageLeaveGuard');
    expect(symbols).toContain('@owp/components:OwpPageCarded');
    expect(symbols.some((symbol) => symbol?.startsWith('@owp/core:@owp/'))).toBe(false);
  });
});
