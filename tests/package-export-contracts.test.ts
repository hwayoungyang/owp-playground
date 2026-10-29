import { describe, expect, it } from 'vitest';
import { knowledge, packageDataset, recordsById } from './fixtures/api-knowledge';
import { completedPlaygroundPackages } from '../src/playgrounds/packages';

describe('installed package export contracts', () => {
  it('keeps the OWP QueryKey and the TanStack reexport distinct', () => {
    // Given / When
    const local = recordsById.get('@owp/core:QueryKey');
    const reexport = recordsById.get('@owp/core:query/QueryKey');
    const core = packageDataset('core');
    // Then
    expect(local?.imports).toEqual(['@owp/core/hooks']);
    expect(local?.typeParameters?.map((parameter) => parameter.name)).toEqual([
      'Paths',
      'Method',
      'Path',
    ]);
    expect(reexport).toMatchObject({
      packageVersion: '10.3.0',
      name: 'QueryKey',
      owner: 'query/QueryKey',
      path: '',
      imports: ['@owp/core/query'],
      signature: 'export { type QueryKey } from "@tanstack/react-query";',
    });
    expect(core.membersByOwner.get('@owp/core:QueryKey') ?? []).toEqual([]);
    expect(core.membersByOwner.get('@owp/core:query/QueryKey') ?? []).toEqual([]);
  });

  it('exposes the query and i18n facade without expanding supported packages', () => {
    // Given / When
    const core = knowledge.records.filter((record) => record.package === '@owp/core');
    // Then
    expect(core.filter((record) => record.imports.includes('@owp/core/query'))).toHaveLength(70);
    expect(recordsById.get('@owp/core:useQuery')).toMatchObject({
      imports: ['@owp/core/query'],
      signature: 'export { useQuery } from "@tanstack/react-query";',
      typeParameters: [],
      related: [],
    });
    expect(recordsById.get('@owp/core:useQuery')?.docTags).toEqual([]);
    expect(recordsById.get('@owp/core:i18next')?.signature).toBe(
      'export { default as i18next } from "i18next";',
    );
    expect(recordsById.get('@owp/core:useTranslation')?.imports).toEqual(['@owp/core/i18n']);
    expect(recordsById.get('@owp/core:OwpI18nOptions')?.imports).toEqual([
      '@owp/core/i18n',
      '@owp/core/types',
    ]);
    expect(completedPlaygroundPackages.map((entry) => entry.id)).toEqual([
      'datagrid',
      'charts',
      'core',
    ]);
  });

  it('links Charts public aliases to the original native records', () => {
    // Given / When
    const chartData = recordsById.get('@owp/charts:ChartData');
    const nativeData = recordsById.get('chart.js:ChartData');
    const helper = recordsById.get('@owp/charts:getDatasetAtEvent');
    // Then
    expect(chartData).toMatchObject({
      kind: 'type',
      package: '@owp/charts',
      packageVersion: '6.1.0',
      signature: 'export { type ChartData } from "chart.js";',
    });
    expect(chartData?.imports).toContain('@owp/charts/chartjs/types');
    expect(chartData?.related).toContain('chart.js:ChartData');
    expect(nativeData?.package).toBe('chart.js');
    expect(nativeData?.packageVersion).toBe('4.5.1');
    expect(helper?.imports).toEqual([
      '@owp/charts/chartjs',
      '@owp/charts/chartjs/utils',
      '@owp/charts/utils',
    ]);
    expect(helper?.related).toContain('react-chartjs-2:getDatasetAtEvent');
    for (const name of [
      'ChartExternalTooltipContext',
      'ChartDataLabelsPluginOptions',
      'ChartZoomPluginOptions',
    ]) {
      expect(recordsById.has(`@owp/charts:${name}`)).toBe(true);
    }
  });
});
