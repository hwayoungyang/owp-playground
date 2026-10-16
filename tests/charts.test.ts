import '../src/app/i18n';
import { access } from 'node:fs/promises';
import i18next from 'i18next';
import { describe, expect, it } from 'vitest';
import { chartCatalog, chartCategories, findChartSample } from '../src/playgrounds/charts/catalog';
import { chartEnglish } from '../src/playgrounds/charts/locales/en';
import { hankumChartCoverage } from '../src/playgrounds/charts/model/coverage';
import {
  createHistogram,
  createMeasurements,
  downsampleMinMax,
} from '../src/playgrounds/charts/model/data';
import { readPlaygroundRoute } from '../src/playgrounds/registry';

describe('charts catalog and shared routes', () => {
  it('translates the package box plot statistics in the OWP namespace', () => {
    const t = i18next.getFixedT('en', 'owp');
    expect(
      [
        'Label.최솟값',
        'Label.1사분위수',
        'Label.중앙값',
        'Label.3사분위수',
        'Label.최댓값',
        'Label.수염',
        'Label.이상치',
      ].map((key) => t(key)),
    ).toEqual([
      'Minimum',
      'First quartile (Q1)',
      'Median',
      'Third quartile (Q3)',
      'Maximum',
      'Whiskers',
      'Outliers',
    ]);
  });
  it('provides 94 executable examples and one guide, with usable sources and English labels', async () => {
    expect(chartCatalog.filter((sample) => sample.kind === 'chart')).toHaveLength(94);
    expect(chartCatalog.filter((sample) => sample.kind === 'guide')).toHaveLength(1);
    expect(new Set(chartCatalog.map((sample) => sample.id)).size).toBe(95);
    expect(
      chartCategories.map(
        ({ id }) =>
          chartCatalog.filter((sample) => sample.kind === 'chart' && sample.category === id).length,
      ),
    ).toEqual([32, 13, 4, 7, 5, 7, 10, 5, 2, 9]);
    expect(chartCategories.at(-1)?.id).toBe('business');
    expect(findChartSample('gauge').category).toBe('basic');
    expect(findChartSample('live').kind).toBe('chart');
    expect(chartCatalog.at(-1)?.category).toBe('business');
    for (const sample of chartCatalog) {
      await access(new URL(`../src/playgrounds/charts/${sample.source}`, import.meta.url));
      if (sample.kind === 'chart') {
        expect(chartEnglish[sample.title], sample.id).toBeTruthy();
        expect(chartEnglish[sample.description], sample.id).toBeTruthy();
      }
    }
  });
  it('maps every reviewed Hankum renderer to an executable example', () => {
    expect(Object.keys(hankumChartCoverage)).toHaveLength(15);
    for (const examples of Object.values(hankumChartCoverage)) {
      for (const id of examples) expect(findChartSample(id).kind, id).toBe('chart');
    }
  });
  it('keeps identical sample names in their owning package and defaults within charts', () => {
    const chart = readPlaygroundRoute('?package=%40owp%2Fcharts&sample=detail-chart');
    expect(chart.playground.id).toBe('charts');
    expect(chart.sample?.id).toBe('detail-chart');
    for (const sample of ['unknown', 'editing', '']) {
      expect(readPlaygroundRoute(`?package=charts&sample=${sample}`).sample?.id).toBe(
        'getting-started',
      );
    }
    expect(readPlaygroundRoute('?sample=editing').playground.id).toBe('datagrid');
    expect(readPlaygroundRoute('?package=datagrid&sample=line').sample?.id).toBe('getting-started');
    for (const [previous, current] of [
      ['linear-gradient', 'line'],
      ['radial-gradient', 'doughnut'],
      ['integer-axis', 'axis-step'],
      ['decimal-axis', 'tick-style'],
      ['long-labels', 'horizontal-bar'],
      ['animation-progress', 'line'],
      ['animation-delay', 'bar'],
      ['animation-drop', 'bar'],
      ['animation-loop', 'line'],
      ['progressive-line', 'line'],
      ['progressive-easing', 'line'],
    ]) {
      expect(readPlaygroundRoute(`?package=charts&sample=${previous}`).sample?.id).toBe(current);
      expect(chartCatalog.some((sample) => sample.id === previous)).toBe(false);
    }
  });
});

describe('example data processing', () => {
  it('retains endpoints, spikes, time order and the display bound when downsampling', () => {
    const points = createMeasurements(10_000);
    const reduced = downsampleMinMax(points, 600);
    expect(reduced.length).toBeLessThanOrEqual(600);
    expect(reduced[0]).toBe(points[0]);
    expect(reduced.at(-1)).toBe(points.at(-1));
    const maximum = points.reduce((left, right) => (left.value > right.value ? left : right));
    const minimum = points.reduce((left, right) => (left.value < right.value ? left : right));
    expect(reduced).toContain(maximum);
    expect(reduced).toContain(minimum);
    expect(
      reduced.every(
        (point, index) => index === 0 || point.timestamp > (reduced[index - 1]?.timestamp ?? 0),
      ),
    ).toBe(true);
    expect(downsampleMinMax(points, 5).length).toBeLessThanOrEqual(5);
    expect(downsampleMinMax([], 4)).toEqual([]);
    expect(downsampleMinMax(points.slice(0, 3), 4)).toEqual(points.slice(0, 3));
    expect(() => downsampleMinMax(points, 3)).toThrow(RangeError);
  });
  it('counts every finite measurement once, including the last boundary and constant input', () => {
    const bins = createHistogram(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, Number.NaN, Number.POSITIVE_INFINITY],
      5,
    );
    expect(bins.map((bin) => bin.frequency)).toEqual([2, 2, 2, 2, 3]);
    expect(createHistogram([5, 5, 5], 4).map((bin) => bin.frequency)).toEqual([3, 0, 0, 0]);
    expect(createHistogram([], 5)).toEqual([]);
    expect(() => createHistogram([1], 0)).toThrow(RangeError);
    expect(() => createHistogram([1], 2.5)).toThrow(RangeError);
  });
});
