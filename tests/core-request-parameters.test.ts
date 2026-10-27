import { describe, expect, it } from 'vitest';
import { createDateRangeSearchParams, createJsonBody, createJsonString } from '@owp/core/utils';
import { requestJsonInput } from '../src/playgrounds/core/model/request-parameters';

const defaultOptions = {
  forceRebuildAll: false,
  forceRebuildNull: false,
  includeLogPayload: false,
} as const;

describe('Core request parameter public functions', () => {
  it('splits a range into query fields and preserves only selected shared fields', () => {
    const result = createDateRangeSearchParams(
      { DT: ' 2026-10-01 , 2026-10-31 ', STATUS: 'ACTIVE', ignored: 'value' },
      ['STATUS'],
      'query',
    );
    expect(result).toEqual({
      FR_DATE: '2026-10-01',
      TO_DATE: '2026-10-31',
      STATUS: 'ACTIVE',
    });
  });

  it('joins separate dates in form mode and leaves missing shared fields empty', () => {
    const result = createDateRangeSearchParams(
      { FR_DATE: ' 2026-10-01 ', TO_DATE: ' 2026-10-31 ' },
      ['STATUS'],
      'form',
    );
    expect(result).toEqual({ DT: '2026-10-01,2026-10-31', STATUS: '' });
    expect(createDateRangeSearchParams({ FR_DATE: '2026-10-01' }, [], 'form')).toEqual({
      DT: '2026-10-01',
    });
  });

  it('supports the public date field mapping without adding validation', () => {
    expect(
      createDateRangeSearchParams({ period: 'start,end' }, [], 'query', {
        dateRangeKey: 'period',
        fromDateKey: 'from',
        toDateKey: 'to',
      }),
    ).toEqual({ from: 'start', to: 'end' });
  });

  it('transforms JSON bodies and serializes the same values', () => {
    const expected = {
      STATUS: 'U',
      quantity: '3',
      enabled: 'true',
      remarks: '',
      lines: [{ id: '1', quantity: '2' }],
    };
    expect(createJsonBody(requestJsonInput, undefined, defaultOptions)).toEqual(expected);
    expect(createJsonString(requestJsonInput, undefined, defaultOptions)).toBe(
      JSON.stringify(expected),
    );
    expect(requestJsonInput.quantity).toBe(3);
    expect(requestJsonInput.remarks).toBeNull();
  });

  it('prefixes nested keys, keeps STATUS by default, and preserves null on request', () => {
    const body = createJsonBody(requestJsonInput, 'ITEM', {
      forceRebuildAll: false,
      forceRebuildNull: true,
    });
    expect(body).toEqual({
      STATUS: 'U',
      'ITEM.quantity': '3',
      'ITEM.enabled': 'true',
      'ITEM.remarks': null,
      'ITEM.lines': [{ 'ITEM.id': '1', 'ITEM.quantity': '2' }],
    });
    const forced = createJsonString(requestJsonInput, 'ITEM', {
      forceRebuildAll: true,
      forceRebuildNull: false,
    });
    expect(JSON.parse(forced)['ITEM.STATUS']).toBe('U');
    expect(JSON.parse(forced)).not.toHaveProperty('STATUS');
  });
});
