import '../src/app/i18n';
import { access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { findSample, sampleCatalog } from '../src/playgrounds/datagrid/catalog';
import { getDefinition } from '../src/playgrounds/datagrid/model/definitions';

describe('sample resources', () => {
  it('places the installation guide first and preserves its source resource', async () => {
    const guide = sampleCatalog[0];
    expect(guide.id).toBe('getting-started');
    expect(guide.kind).toBe('guide');
    expect(guide.category).toBe('start');
    await access(new URL(`../src/playgrounds/datagrid/${guide.source}`, import.meta.url));
    expect(sampleCatalog.filter((sample) => sample.kind === 'grid')).toHaveLength(47);
  });
  it('resolves every grid entry to its executable source and stable row IDs', async () => {
    for (const sample of sampleCatalog.filter((entry) => entry.kind === 'grid')) {
      await access(new URL(`../src/playgrounds/datagrid/${sample.source}`, import.meta.url));
      const definition = getDefinition(sample.id);
      const ids = definition.rows.map(definition.getRowId);
      expect(new Set(ids).size, sample.id).toBe(ids.length);
      expect(definition.columns.length, sample.id).toBeGreaterThan(0);
    }
  });
  it('returns a usable default for an unknown or missing shared URL', () => {
    expect(findSample('unregistered-component').id).toBe('getting-started');
    expect(findSample(null).id).toBe('getting-started');
  });
  it('keeps selection and totals in the fixed row example and resolves merged links', () => {
    const overview = getDefinition('overview');
    expect(overview.visibleRowCount).toBe(10);
    expect(overview.rows).toHaveLength(10);
    expect(overview.rowSelectionMode).toBe('multiple');
    expect(overview.summaryRows?.length).toBeGreaterThan(0);
    expect(findSample('visible-rows').id).toBe('overview');
    expect(findSample('minimal').id).toBe('overview');
    expect(findSample('loading').id).toBe('empty');
    expect(getDefinition('empty').rows).toHaveLength(0);
    expect(getDefinition('empty').loading).toBeFalsy();
  });
  it('gives every sample and nested grid column a positive relative width', () => {
    for (const sample of sampleCatalog.filter((entry) => entry.kind === 'grid')) {
      const definition = getDefinition(sample.id);
      const columns = [
        ...definition.columns,
        ...(definition.detailPanel?.gridProps?.columns ?? []),
      ];
      for (const column of columns) {
        expect(column.relWidth, `${sample.id}/${column.id}`).toBeGreaterThan(0);
      }
    }
  });
});
