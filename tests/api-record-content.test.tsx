import { createInstance } from 'i18next';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import { ApiDescription, ApiGuideBody, ApiMemberList } from '../src/features/api/ApiRecordContent';
import { ApiRelatedRecords } from '../src/features/api/ApiRelatedRecords';
import { type ApiRecord, recordsById } from '../src/features/api/model/knowledge';

function getRecord(id: string): ApiRecord {
  const record = recordsById.get(id);
  if (!record) throw new TypeError(`Missing API fixture: ${id}`);
  return record;
}

async function translation(language: string) {
  const i18n = createInstance();
  await i18n.init({
    lng: language,
    fallbackLng: language,
    defaultNS: 'owp',
    ns: ['owp'],
    keySeparator: false,
    nsSeparator: false,
    resources: { [language]: { owp: {} } },
    initAsync: false,
  });
  return i18n;
}

describe('API record rendering', () => {
  it('places the identifier and its linked type in the same member heading', async () => {
    const i18n = await translation('ko');
    const record = getRecord('@owp/charts:ChartDataLabelsContext.chart');
    const markup = renderToStaticMarkup(
      <I18nextProvider i18n={i18n}>
        <ApiMemberList records={[record]} />
      </I18nextProvider>,
    );
    const heading = markup.match(/<div class="api-member-heading">(.*?)<\/div>/)?.[1];
    expect(heading).toContain('>chart</a>');
    expect(heading).toContain('>Chart</a>');
    expect(heading).toContain('chart.js%3AChart');
    expect(heading).toContain('Required');
    expect(markup.match(/api-type-expression/g)).toHaveLength(1);
    expect(markup).toContain('chartjs-plugin-datalabels 원문');
    expect(markup).not.toContain('Chart.js 원문');
  });

  it('limits original-language badges to Korean UI while preserving the description', async () => {
    const record = getRecord('@owp/charts:ChartDataLabelsContext.chart');
    const i18n = await translation('en');
    const markup = renderToStaticMarkup(
      <I18nextProvider i18n={i18n}>
        <ApiDescription record={record} />
      </I18nextProvider>,
    );
    expect(markup).toContain('The associated chart.');
    expect(markup).not.toContain('api-description-source');
  });

  it('shows an unknown English origin without claiming an external package', async () => {
    const record = getRecord('@owp/charts:ChartDataLabelsContext');
    const i18n = await translation('ko');
    const markup = renderToStaticMarkup(
      <I18nextProvider i18n={i18n}>
        <ApiDescription record={record} />
      </I18nextProvider>,
    );
    expect(markup).toContain('영문 원문');
    expect(markup).not.toContain('chartjs-plugin-datalabels 원문');
  });

  it('uses titled native disclosures when sections exist and keeps paragraph fallback', () => {
    const base = getRecord('@owp/charts:ChartDataLabelsContext');
    const body = 'First paragraph.\n\nSecond paragraph.';
    const fallback = renderToStaticMarkup(<ApiGuideBody record={{ ...base, body }} />);
    expect(fallback).toContain('<p>First paragraph.</p><p>Second paragraph.</p>');
    const markup = renderToStaticMarkup(
      <ApiGuideBody
        record={{
          ...base,
          body,
          sections: [
            { title: 'First section', body: 'First paragraph.' },
            { title: 'Second section', body: 'Second paragraph.' },
          ],
        }}
      />,
    );
    expect(markup.match(/<details\b/g)).toHaveLength(2);
    expect(markup).toContain('<summary>First section</summary>');
    expect(markup.match(/First paragraph\./g)).toHaveLength(1);
    expect(markup).toContain('<details class="api-guide-section" open="">');
  });

  it('keeps grouped related records as real anchors alongside a labeled search field', async () => {
    const base = getRecord('@owp/charts:ChartDataLabelsContext');
    const guide = {
      ...base,
      id: 'guide-test',
      kind: 'guide',
      name: 'Guide entry',
    } satisfies ApiRecord;
    const i18n = await translation('ko');
    const markup = renderToStaticMarkup(
      <I18nextProvider i18n={i18n}>
        <ApiRelatedRecords records={[base, guide]} />
      </I18nextProvider>,
    );
    expect(markup.match(/<details\b/g)).toHaveLength(2);
    expect(markup).toContain('type="search"');
    expect(markup).toMatch(/<label for="[^"]+">관련 항목 검색<\/label>/);
    expect(markup).toContain('symbol=guide-test');
    expect(markup).toContain('symbol=%40owp%2Fcharts%3AChartDataLabelsContext');
    expect(markup).toContain('role="status"');
  });
});
