import '../src/app/i18n';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ApiIndexList, filterApiIndex } from '../src/shared/ui/ApiIndexList';
import type { ApiIndexItem } from '../src/shared/ui/ApiIndexList';
import { WorkspaceTabs, resolveWorkspaceTab } from '../src/shared/ui/WorkspaceTabs';
import { WorkspaceApiPanels } from '../src/features/public-api/WorkspaceApiPanels';
import { findGridEntry } from '../src/playgrounds/datagrid/catalog';

const items: readonly ApiIndexItem[] = [
  {
    id: 'one',
    name: 'OwpDatePickerCalendarHeader',
    description: '달력 헤더',
    group: 'components',
    kind: 'Component',
    href: '?symbol=one',
    searchTerms: ['OwpDatePickerCalendarHeader', '달력 헤더', '@owp/date-picker'],
  },
  {
    id: 'two',
    name: 'usePicker',
    description: '팝업 상태',
    group: 'hooks',
    kind: 'Hook',
    href: '?symbol=two',
    searchTerms: ['usePicker', '팝업 상태', '@owp/date-picker/hooks'],
  },
];

describe('aligned API navigation', () => {
  it('starts with components while keeping complete names, descriptions and symbol links', () => {
    // Given / When
    const html = renderToStaticMarkup(
      <ApiIndexList
        items={items}
        groups={[
          { id: 'components', label: '컴포넌트' },
          { id: 'hooks', label: 'Hooks' },
        ]}
      />,
    );
    // Then
    expect(html.match(/class="api-index-row"/g)).toHaveLength(1);
    expect(html).toContain('aria-pressed="true">컴포넌트</button>');
    expect(html).toContain('aria-pressed="false">전체</button>');
    expect(html).toContain('OwpDatePickerCalendarHeader');
    expect(html).toContain('달력 헤더');
    expect(html).toContain('href="?symbol=one"');
    expect(html).not.toContain('href="?symbol=two"');
    expect(html).toContain('전체 2개 중 1개 API');
    expect(html).not.toContain('components-api-index-list');
  });

  it.each([
    ['hooks', 'Hooks'],
    ['utils', 'Utils'],
  ])('starts with %s when there are no components', (group, label) => {
    const html = renderToStaticMarkup(
      <ApiIndexList
        items={items.map((item) => ({ ...item, group }))}
        groups={[
          { id: 'components', label: '컴포넌트' },
          { id: 'hooks', label: 'Hooks' },
          { id: 'utils', label: 'Utils' },
        ]}
      />,
    );
    expect(html).toContain(`aria-pressed="true">${label}</button>`);
    expect(html).not.toContain('>컴포넌트</button>');
    expect(html.match(/class="api-index-row"/g)).toHaveLength(2);
  });

  it('keeps the empty index usable when no API categories are available', () => {
    const html = renderToStaticMarkup(
      <ApiIndexList items={[]} groups={[{ id: 'components', label: '컴포넌트' }]} />,
    );
    expect(html).toContain('aria-pressed="true">전체</button>');
    expect(html).toContain('전체 0개 중 0개 API');
    expect(html).toContain('검색 결과가 없습니다.');
  });

  it('combines category selection with trimmed, case-insensitive metadata search', () => {
    // Given / When / Then
    expect(filterApiIndex({ items, group: 'hooks', query: ' @OWP/DATE-PICKER ' })).toEqual([
      items[1],
    ]);
    expect(filterApiIndex({ items, group: 'all', query: '달력' })).toEqual([items[0]]);
    expect(filterApiIndex({ items, group: 'components', query: '팝업' })).toEqual([]);
  });
});

describe('single-row example tabs', () => {
  const example = findGridEntry('selection');
  it('groups available contracts under one API tab and preserves event counts', () => {
    // Given / When
    const html = renderToStaticMarkup(
      <WorkspaceTabs
        api={example}
        idPrefix="test"
        value="params"
        eventCount={3}
        onChange={vi.fn()}
      />,
    );
    // Then
    expect(html.match(/role="tab"/g)).toHaveLength(5);
    expect(html).toMatch(/aria-selected="true"[^>]*id="test-tab-api"/);
    expect(html).toContain('aria-label="이벤트 3"');
    expect(html).toContain('aria-controls="test-panel-api"');
    expect(html).not.toContain('workspace-tab-group-label');
    expect(html).not.toContain('id="test-tab-params"');
  });

  it('keeps legacy contract URL values and nested tab/panel relationships', () => {
    // Given / When
    const html = renderToStaticMarkup(
      <WorkspaceApiPanels example={example} prefix="test" tab="params" onTabChange={vi.fn()} />,
    );
    // Then
    expect(resolveWorkspaceTab(example, 'params')).toBe('params');
    expect(html).toContain('id="test-panel-api"');
    expect(html).toContain('aria-labelledby="test-tab-api"');
    expect(html).toContain('id="test-tab-params"');
    expect(html).toContain('id="test-panel-params"');
    expect(html).toContain('aria-labelledby="test-tab-params"');
  });
});
