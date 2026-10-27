import { useEffect, useState } from 'react';
import { Button, Typography } from '@mui/material';
import { OwpDateRangePicker } from '@owp/date-picker';
import dayjs from '@owp/date-picker/dayjs';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { createDateRangeSearchParams, createJsonBody, createJsonString } from '@owp/core/utils';
import { requestJsonInput } from '../model/request-parameters';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice, CoreToggle } from '../runtime/Controls';
import { CoreResultTable } from '../runtime/CoreResultTable';

type RequestPreview = {
  readonly dates: ReturnType<typeof createDateRangeSearchParams>;
  readonly body: typeof requestJsonInput;
  readonly json: string;
};

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const [mode, setMode] = useState<'query' | 'form'>('query');
  const [dateRange, setDateRange] = useState('2026-10-01,2026-10-31');
  const [fromDate = '', toDate = ''] = dateRange.split(',');
  const [prefix, setPrefix] = useState<'없음' | 'ITEM'>('없음');
  const [forceRebuildAll, setForceRebuildAll] = useState(false);
  const [forceRebuildNull, setForceRebuildNull] = useState(false);
  const [result, setResult] = useState<RequestPreview | null>(null);
  const dateValues =
    mode === 'query'
      ? { DT: dateRange, STATUS: 'ACTIVE' }
      : { FR_DATE: fromDate, TO_DATE: toDate, STATUS: 'ACTIVE' };

  useEffect(() => {
    onData({
      mode,
      dateRange,
      fromDate,
      toDate,
      prefix,
      forceRebuildAll,
      forceRebuildNull,
      result,
    });
  }, [
    mode,
    dateRange,
    fromDate,
    toDate,
    prefix,
    forceRebuildAll,
    forceRebuildNull,
    result,
    onData,
  ]);

  const formatValue = (value: unknown) => (
    <pre className="core-json-value">
      <code>{JSON.stringify(value, null, 2)}</code>
    </pre>
  );

  return (
    <CoreDemo
      controls={
        <>
          <CoreChoice
            label="날짜 변환 방향"
            value={mode}
            options={['query', 'form'] as const}
            onChange={(value) => {
              setMode(value);
              setResult(null);
            }}
          />
          <CoreChoice
            label="JSON key 접두사"
            value={prefix}
            options={['없음', 'ITEM'] as const}
            onChange={(value) => {
              setPrefix(value);
              setResult(null);
            }}
          />
          <CoreToggle
            label="STATUS에도 접두사 적용"
            value={forceRebuildAll}
            onChange={(value) => {
              setForceRebuildAll(value);
              setResult(null);
            }}
          />
          <CoreToggle
            label="null 유지"
            value={forceRebuildNull}
            onChange={(value) => {
              setForceRebuildNull(value);
              setResult(null);
            }}
          />
        </>
      }
    >
      <DemoSection description="query는 DT를 FR_DATE·TO_DATE로 나누고, form은 두 날짜를 DT로 합칩니다. JSON 변환은 숫자·boolean을 문자열로 바꾸며, 이 예제는 요청 로그 필드를 제외합니다.">
        <div className="core-control-field core-date-range-field">
          <OwpDateRangePicker
            label={t('날짜 범위')}
            value={dateRange}
            fullWidth
            clearable
            variant="outlined"
            textFieldProps={{ size: 'small' }}
            onChange={(value) => {
              setDateRange(
                typeof value === 'string' ? value : value ? dayjs(value).format('YYYY-MM-DD') : '',
              );
              setResult(null);
            }}
          />
        </div>
        <Typography variant="body2" color="text.secondary">
          {t('날짜 범위를 선택하고 변환 버튼을 눌러 입력과 각 함수의 출력을 비교합니다.')}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => {
            const keyPrefix = prefix === '없음' ? undefined : prefix;
            const options = { forceRebuildAll, forceRebuildNull, includeLogPayload: false };
            const next = {
              dates: createDateRangeSearchParams(dateValues, ['STATUS'], mode),
              body: createJsonBody(requestJsonInput, keyPrefix, options),
              json: createJsonString(requestJsonInput, keyPrefix, options),
            };
            setResult(next);
            onRecord('parameters.transform', JSON.stringify(next));
          }}
        >
          {t('변환')}
        </Button>
        <div className="core-result-comparison">
          <CoreResultTable
            headers={{ api: 'API', input: t('입력'), output: t('출력') }}
            rows={
              result
                ? [
                    {
                      api: 'createDateRangeSearchParams',
                      input: formatValue(dateValues),
                      output: formatValue(result.dates),
                    },
                    {
                      api: 'createJsonBody',
                      input: formatValue(requestJsonInput),
                      output: formatValue(result.body),
                    },
                    {
                      api: 'createJsonString',
                      input: formatValue(requestJsonInput),
                      output: formatValue(JSON.parse(result.json)),
                    },
                  ]
                : []
            }
            state={result ? undefined : { kind: 'idle', message: t('변환 버튼을 눌러 주세요.') }}
          />
        </div>
      </DemoSection>
    </CoreDemo>
  );
}
