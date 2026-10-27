import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { highlightSource } from '../src/features/code/highlight';
import { gridCatalog } from '../src/playgrounds/datagrid/catalog';

function sourceText(html: string) {
  return html.replace(/<\/?span\b[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#x27);/g, (entity) => {
    switch (entity) {
      case '&amp;':
        return '&';
      case '&lt;':
        return '<';
      case '&gt;':
        return '>';
      case '&quot;':
        return '"';
      case '&#x27;':
        return "'";
      default:
        return entity;
    }
  });
}

describe('TSX source highlighting', () => {
  it('colors component tags and their props within a JSX return block', () => {
    const source = 'return <div><OwpDataGrid rows={rows} radius={true} height="100%" /></div>;';
    const html = highlightSource(source, 'typescript');
    expect(html).toContain('<span class="hljs-name">OwpDataGrid</span>');
    expect(html).toContain('<span class="hljs-attr">rows</span>');
    expect(html).toContain('<span class="hljs-literal">true</span>');
    expect(html).toContain('<span class="hljs-string">&quot;100%&quot;</span>');
  });
  it('highlights the actual grid tag in every executing sample', async () => {
    for (const example of gridCatalog.filter((entry) => entry.kind === 'grid')) {
      const source = await readFile(
        new URL(`../src/playgrounds/datagrid/${example.source}`, import.meta.url),
        'utf8',
      );
      const html = highlightSource(source, 'typescript');
      expect(html, example.id).toContain('<span class="hljs-name">OwpDataGrid</span>');
      expect(sourceText(html), example.id).toBe(source);
    }
  });
  it('keeps tag, prop and string scopes after nested JSX props in a fixed page-content fixture', () => {
    // Given
    // 예제의 소유권 변경과 분리해 Core 9.0.0의 중첩 JSX 경계를 검증합니다.
    const source = `import { OwpPageContent, OwpTable } from '@owp/components';
import { OwpCoreResponsiveLayoutGlobalStyles, OwpExportDataToExcelButton } from '@owp/core';
function PageContentFixture({ loading, responsive, rows }) {
  return (
    <CoreDemo controls={<><CoreToggle label="헤더 로딩" value={loading} /></>}>
      <OwpPageContent
        loading={loading}
        responsiveLayout={responsive}
        slots={{ responsiveLayoutGlobalStyles: OwpCoreResponsiveLayoutGlobalStyles }}
        actions={
          <OwpExportDataToExcelButton
            exportName="core-items"
            header={[{ key: 'A1', value: '항목명' }]}
            columnMappers={[{ key: 'name' }]} data={rows}
          >
            다운로드
          </OwpExportDataToExcelButton>
        }
      >
        <OwpTable headers={{ name: '항목명' }} rows={rows} />
      </OwpPageContent>
    </CoreDemo>
  );
}`;
    // When
    const html = highlightSource(source, 'typescript');
    // Then
    for (const name of ['CoreToggle', 'OwpPageContent', 'OwpExportDataToExcelButton', 'OwpTable'])
      expect(html).toContain(`<span class="hljs-name">${name}</span>`);
    for (const prop of ['loading', 'responsiveLayout', 'slots', 'actions', 'exportName', 'headers'])
      expect(html).toContain(`<span class="hljs-attr">${prop}</span>`);
    expect(html).toContain('<span class="hljs-string">&quot;헤더 로딩&quot;</span>');
    expect(html).toContain('<span class="hljs-string">&quot;core-items&quot;</span>');
    expect(sourceText(html)).toBe(source);
  });
  it.each([
    'return <><Box options={{ nested: { enabled: true, text: "}" } }} title="한글" /></>;',
    'return <Box render={() => <Button title="확인" />} title="한글" enabled={true} />;',
    'const identity = <T,>(value: T) => value; return <Box title="한글" enabled={true} />;',
    'const identity = <T extends { name: string }>(value: T) => value; return <Box title="한글" enabled={true} />;',
  ])('preserves TSX text and useful scopes for %s', (source) => {
    // When
    const html = highlightSource(source, 'typescript');
    // Then
    expect(html).toContain('<span class="hljs-name">Box</span>');
    expect(html).toContain('<span class="hljs-attr">title</span>');
    expect(html).toContain('<span class="hljs-string">&quot;한글&quot;</span>');
    expect(html).toContain('<span class="hljs-literal">true</span>');
    expect(html).not.toContain('<span class="hljs-name">T</span>');
    expect(sourceText(html)).toBe(source);
  });
  it('escapes source markup while preserving multiline fragments and string contents', () => {
    // Given
    const source = `return <>\n  <Box title="&lt;script&gt;" data={{ text: '<script>alert("한글")</script>' }} />\n</>;`;
    // When
    const html = highlightSource(source, 'typescript');
    // Then
    expect(html).toContain('<span class="hljs-tag">&lt;&gt;</span>');
    expect(html).toContain('<span class="hljs-tag">&lt;/&gt;</span>');
    expect(html).not.toContain('<script>');
    expect(sourceText(html)).toBe(source);
  });
});
