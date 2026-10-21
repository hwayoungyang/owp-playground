import '../src/app/i18n';
import { access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { findGridEntry, gridCatalog } from '../src/playgrounds/datagrid/catalog';
import { getGridConfiguration } from '../src/playgrounds/datagrid/model/gridConfiguration';

describe('sample resources', () => {
  it('places the installation guide first and preserves its source resource', async () => {
    const guide = gridCatalog[0];
    expect(guide.id).toBe('getting-started');
    expect(guide.kind).toBe('guide');
    expect(guide.category).toBe('start');
    await access(new URL(`../src/playgrounds/datagrid/${guide.source}`, import.meta.url));
    expect(gridCatalog.filter((example) => example.kind === 'grid')).toHaveLength(50);
  });
  it('resolves every grid entry to its executable source and stable row IDs', async () => {
    for (const example of gridCatalog.filter((entry) => entry.kind === 'grid')) {
      await access(new URL(`../src/playgrounds/datagrid/${example.source}`, import.meta.url));
      const configuration = getGridConfiguration(example.id);
      const ids = configuration.rows.map(configuration.getRowId);
      expect(new Set(ids).size, example.id).toBe(ids.length);
      expect(configuration.columns.length, example.id).toBeGreaterThan(0);
    }
  });
  it('returns a usable default for an unknown or missing shared URL', () => {
    expect(findGridEntry('unregistered-component').id).toBe('getting-started');
    expect(findGridEntry(null).id).toBe('getting-started');
  });
  it('opens the row selection example with single selection by default', () => {
    expect(findGridEntry('selection')).toMatchObject({
      id: 'selection',
      category: 'interaction',
      source: 'examples/selection.tsx',
    });
    expect(getGridConfiguration('selection').rowSelectionMode).toBe('single');
  });
  it('exposes server saving separately while preserving the legacy change-management link', () => {
    const example = findGridEntry('save-changes');

    const configuration = getGridConfiguration('save-changes');

    expect(example).toMatchObject({
      id: 'save-changes',
      source: 'examples/server-save.tsx',
      api: expect.arrayContaining(['applyServerRows', 'submittedRow']),
    });
    expect(configuration.rowDeletion).toBe(true);
    expect(configuration.layout?.rowPanel?.allowAddedRowSelection).toBe(true);
    expect(findGridEntry('server-save').id).toBe('ref-changes');
  });
  it('keeps selection and totals in the fixed row example and resolves merged links', () => {
    const overview = getGridConfiguration('overview');
    expect(overview.visibleRowCount).toBe(10);
    expect(overview.rows).toHaveLength(10);
    expect(overview.rowSelectionMode).toBe('multiple');
    expect(overview.summaryRows?.length).toBeGreaterThan(0);
    expect(findGridEntry('visible-rows').id).toBe('overview');
    expect(findGridEntry('minimal').id).toBe('overview');
    for (const legacy of ['loading', 'empty', 'error']) {
      expect(findGridEntry(legacy).id).toBe('states');
    }
    expect(getGridConfiguration('states').rows).toHaveLength(12);
    expect(getGridConfiguration('states').loading).toBeFalsy();
  });
  it('gives every sample and nested grid column a positive relative width', () => {
    for (const example of gridCatalog.filter((entry) => entry.kind === 'grid')) {
      const configuration = getGridConfiguration(example.id);
      const columns = [
        ...configuration.columns,
        ...(configuration.detailPanel?.gridProps?.columns ?? []),
      ];
      for (const column of columns) {
        expect(column.relWidth, `${example.id}/${column.id}`).toBeGreaterThan(0);
      }
    }
  });
});
