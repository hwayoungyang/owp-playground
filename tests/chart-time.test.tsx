import '../src/app/i18n';
import { execFileSync } from 'node:child_process';
import { registerChartTime } from '@owp/charts/chartjs/time';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { nativeSnapshot } from '../src/playgrounds/charts/model/nativeSnapshot';
import {
  createTimeOptions,
  equipmentReadings,
  hourInMilliseconds,
  productionReadings,
  sensorGapReadings,
} from '../src/playgrounds/charts/model/timeScaleData';
import { TimeChart } from '../src/playgrounds/charts/runtime/TimeChart';

vi.mock('@owp/charts/chartjs/time', () => ({ registerChartTime: vi.fn() }));

it('renders the initial loading status without mounting child content during SSR', () => {
  const markup = renderToString(
    <TimeChart>
      <canvas id="chart-child" />
    </TimeChart>,
  );
  expect(markup).toContain('role="status"');
  expect(markup).toContain('시간축을 불러오는 중입니다.');
  expect(markup).not.toContain('chart-child');
  expect(registerChartTime).not.toHaveBeenCalled();
});

describe('time scale observations', () => {
  it('uses sorted numeric epoch milliseconds and genuinely irregular intervals', () => {
    for (const readings of [equipmentReadings, productionReadings, sensorGapReadings]) {
      expect(readings.every((point) => Number.isFinite(point.x))).toBe(true);
      expect(
        readings.every((point, index) => index === 0 || point.x > (readings[index - 1]?.x ?? 0)),
      ).toBe(true);
    }
    const intervals = equipmentReadings
      .slice(1)
      .map((point, index) => point.x - (equipmentReadings[index]?.x ?? 0));
    expect(new Set(intervals).size).toBeGreaterThan(3);
  });

  it('retains null readings and ISO timestamps in the Data tab snapshot', () => {
    const labels = sensorGapReadings.map((point) => new Date(point.x).toISOString());
    const snapshot = nativeSnapshot({
      labels,
      datasets: [{ id: 'sensor', label: 'sensor', data: sensorGapReadings }],
    });
    expect(snapshot.labels).toEqual(labels);
    expect(snapshot.series[0]?.values).toEqual(sensorGapReadings.map((point) => point.y));
    expect(snapshot.series[0]?.values.filter((value) => value === null)).toHaveLength(2);
    const gaps = sensorGapReadings
      .slice(1)
      .map((point, index) => point.x - (sensorGapReadings[index]?.x ?? 0));
    expect(gaps).toContain(3 * hourInMilliseconds);
    expect(gaps).toContain(8 * hourInMilliseconds);
  });

  it.each(['ko', 'en'])(
    'configures native time scales and UTC adapter locale for %s',
    (language) => {
      for (const type of ['time', 'timeseries'] as const) {
        const options = createTimeOptions(language, type);
        expect(options.parsing).toBe(false);
        expect(options.locale).toBe(language);
        expect(options.scales?.x).toMatchObject({
          type,
          adapters: { date: { zone: 'UTC', locale: language } },
        });
      }
    },
  );

  it('applies native numeric spanGaps thresholds while explicit null readings remain gaps', () => {
    const script = `
      import { createRequire } from 'node:module';
      const requireCharts = createRequire(import.meta.resolve('@owp/charts'));
      const { LineController, LineElement } = requireCharts('chart.js');
      const readings = JSON.parse(process.argv[1]);
      const results = [3600000, 14400000, 28800000, true].map((spanGaps) => {
        const points = readings.map(() => ({}));
        const controller = Object.assign(Object.create(LineController.prototype), {
          _cachedMeta: {
            iScale: { axis: 'x', getPixelForValue: (x) => x },
            vScale: { axis: 'y', getPixelForValue: (y) => y, getBasePixel: () => 0 },
          },
          _getSharedOptions: () => ({ sharedOptions: {}, includeOptions: true }),
          options: { spanGaps },
          chart: { _animationsDisabled: true },
          getParsed: (index) => readings[index],
        });
        controller.updateElements(points, 0, points.length, 'none');
        const line = new LineElement({ points, options: { spanGaps } });
        return line.segments.map(({ start, end }) => [start, end]);
      });
      process.stdout.write(JSON.stringify(results));
    `;
    const output = execFileSync(
      process.execPath,
      ['--input-type=module', '-e', script, JSON.stringify(sensorGapReadings)],
      { encoding: 'utf8' },
    );
    const segments = z.array(z.array(z.tuple([z.number(), z.number()]))).parse(JSON.parse(output));
    expect(segments).toEqual([
      [
        [0, 2],
        [4, 5],
        [6, 7],
        [9, 9],
        [10, 11],
      ],
      [
        [0, 2],
        [4, 7],
        [9, 9],
        [10, 11],
      ],
      [
        [0, 2],
        [4, 7],
        [9, 11],
      ],
      [[0, 11]],
    ]);
  });
});
