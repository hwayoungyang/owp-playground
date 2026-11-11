import '../src/app/i18n';
import { OwpDateRangePicker } from '@owp/date-picker';
import dayjs from '@owp/date-picker/dayjs';
import {
  formatKstDateTime,
  getKstCurrentDateTime,
  getKstDate,
  getKstDayStart,
  parseKstDateTime,
} from '@owp/date-picker/utils';
import { hasValue, isNilOrEmptyString } from '@owp/utils';
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Provider } from '../src/app/providers/Provider';

it('renders the installed Date Picker range with its public dayjs entrypoint', () => {
  const html = renderToString(
    <Provider mode="light">
      <OwpDateRangePicker label="날짜 범위" value="2026-10-01,2026-10-31" onChange={() => {}} />
    </Provider>,
  );
  expect(html).toContain('2026');
  expect(html).toContain('input');
  expect(dayjs('2026-10-29').format('YYYY-MM-DD')).toBe('2026-10-29');
});

it.each([
  [null, false],
  [undefined, false],
  ['', false],
  [0, true],
  [false, true],
  ['   ', true],
  [NaN, true],
] as const)('checks the original value %s without coercion', (value, expected) => {
  // Given / When
  const present = hasValue(value);
  // Then
  expect(present).toBe(expected);
  expect(present).toBe(!isNilOrEmptyString(value));
});

it('narrows filtered values while retaining numeric zero and boolean false', () => {
  // Given
  const input = [null, undefined, '', 0, false] as const;
  // When
  const filtered: (number | boolean)[] = input.filter(hasValue);
  // Then
  expect(filtered).toEqual([0, false]);
});

it('formats a fixed instant and returns the actual KST midnight epoch', () => {
  // Given
  const timestamp = 1769785200000;
  // When
  const result = {
    formatted: formatKstDateTime(timestamp, 'YYYY-MM-DD HH:mm:ss Z ZZ'),
    dateTime: getKstCurrentDateTime(undefined, timestamp),
    midnight: getKstDayStart(timestamp + 86399999),
  };
  // Then
  expect(result).toEqual({
    formatted: '2026-01-31 00:00:00 +09:00 +0900',
    dateTime: { date: '2026-01-31', time: '00:00:00' },
    midnight: timestamp,
  });
});

it.each([
  ['2026-01-31', { months: 1 }, '2026-02-28'],
  ['2026-01-31', { months: 1, days: 2, startOfMonth: true }, '2026-03-01'],
  ['2024-01-31', { months: 1 }, '2024-02-29'],
  ['2024-02-29', { days: 1 }, '2024-03-01'],
  ['2026-12-31', { months: 1, days: 1 }, '2027-02-01'],
] as const)('adjusts %s in KST with %j', (date, options, expected) => {
  // Given
  const timestamp = parseKstDateTime(date);
  if (timestamp === null) throw new TypeError('Invalid test date');
  // When
  const adjusted = getKstDate(options, timestamp);
  // Then
  expect(adjusted).toBe(expected);
});

it.each([
  '2026-01-31',
  '2026-01-31 00:00',
  '2026-01-30T15:00:00Z',
  '2026-01-31T00:00:00+09:00',
  '2026-01-31T00:00:00+0900',
  '2026-01-30T10:00:00-05:00',
  '2026-01-30T10:00:00-0500',
])('parses %s as the same instant', (input) => {
  // Given / When
  const timestamp = parseKstDateTime(input);
  // Then
  expect(timestamp).toBe(1769785200000);
});

it.each([
  '2026-02-30',
  '2026-01-31 24:00',
  '2026-01-31T00:00+24:00',
  '2026-01-31T00:00+09:60',
  '2026-01-31T00:00:00.1234',
  '2026-01-31T00:00.123',
  '2026-01-31t00:00',
  '2026-01-31T00:00z',
  '2026-01-31  00:00',
  '',
])('returns null for unsupported input %s', (input) => {
  // Given / When
  const timestamp = parseKstDateTime(input);
  // Then
  expect(timestamp).toBeNull();
});

it.each([
  ['1970-01-01T00:00:00Z', 0],
  ['2026-01-31T00:00:00.1', 1769785200100],
  ['2026-01-31T00:00:00.12', 1769785200120],
  ['2026-01-31T00:00:00.123', 1769785200123],
] as const)('preserves epoch and fractional milliseconds for %s', (input, expected) => {
  // Given / When
  const timestamp = parseKstDateTime(input);
  // Then
  expect(timestamp).toBe(expected);
});
