import type { ApiDataSource, ApiRow } from '../../../features/code/api-data';
import { translate } from '../../../shared/i18n/translate';
import type { ChartSnapshot } from './types';

/** 점을 포함한 API 키를 배열 인덱스별 category·series 값으로 변환합니다. */
export function chartFromApi(
  rows: readonly ApiRow[],
  seriesNames: readonly string[],
): ChartSnapshot {
  return {
    labels: rows.map((row) => {
      const label = row['OWP_DATA.DATA1'];
      if (typeof label !== 'string') throw new TypeError('Expected OWP_DATA.DATA1 string');
      return label;
    }),
    series: seriesNames.map((label, index) => ({
      label,
      values: rows.map((row) => {
        const value = row[`OWP_DATA.DATA${index + 2}`];
        if (value === null || value === undefined) return null;
        if (typeof value !== 'string') throw new TypeError('Expected numeric string or null');
        if (value.trim() === '') return null;
        const number = Number(value);
        if (!Number.isFinite(number)) throw new TypeError(`Invalid chart value: ${value}`);
        return number;
      }),
    })),
  };
}

export function chartApiDocument(
  snapshot: ChartSnapshot,
  exampleId: string,
  localize: typeof translate = translate,
): ApiDataSource {
  const coordinate = ['scatter', 'scatter-clusters', 'bubble'].includes(exampleId);
  return {
    totalRows: snapshot.labels.length,
    fields: [
      {
        key: 'OWP_DATA.DATA1',
        description: localize(
          coordinate
            ? 'X 좌표. 다른 series도 같은 X 값을 참조합니다.'
            : '분류·시각 라벨. 같은 행의 DATA2 이후 값과 대응합니다.',
        ),
      },
      ...snapshot.series.map((series, index) => ({
        key: `OWP_DATA.DATA${index + 2}` as const,
        description: localize(
          '값: {{name}}. 숫자 문자열이며 null은 해당 위치의 데이터가 없음을 뜻합니다.',
          { name: series.label },
        ),
      })),
    ],
    getRows: (start, end) =>
      snapshot.labels
        .slice(start, end)
        .map((label, offset) =>
          Object.fromEntries([
            ['OWP_DATA.DATA1', label],
            ...snapshot.series.map((series, seriesIndex) => [
              `OWP_DATA.DATA${seriesIndex + 2}`,
              series.values[start + offset] === null || series.values[start + offset] === undefined
                ? null
                : String(series.values[start + offset]),
            ]),
          ]),
        ),
  };
}
