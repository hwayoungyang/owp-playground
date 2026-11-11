import { useEffect, useId, useMemo, useState } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import {
  formatKstDateTime,
  getKstToday,
  getKstCurrentTime,
  getKstCurrentDateTime,
  getKstDate,
  getKstDayStart,
  parseKstDateTime,
} from '@owp/date-picker/utils';
import type { KstDateOptions } from '@owp/date-picker/utils';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';
import { KstAdjustmentPanel } from './kst-adjustment-panel';
import { KstParsingPanel } from './kst-parsing-panel';

const timestampPresets = [
  { label: '월말 기준 시각', value: '1769785200000' },
  { label: '윤년 1월 말', value: '1706626800000' },
  { label: '연말 기준 시각', value: '1798642800000' },
  { label: 'Unix epoch', value: '0' },
] as const;

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const baseId = useId();
  const [timestampInput, setTimestampInput] = useState('1769785200000');
  const [format, setFormat] = useState('YYYY-MM-DD HH:mm:ss Z ZZ');
  const [monthsInput, setMonthsInput] = useState('1');
  const [daysInput, setDaysInput] = useState('1');
  const [startOfMonth, setStartOfMonth] = useState(false);
  const [parseInput, setParseInput] = useState('2026-01-31');
  const timestamp = Number(timestampInput);
  const validTimestamp =
    timestampInput.trim() !== '' &&
    Number.isFinite(timestamp) &&
    Number.isFinite(new Date(timestamp).valueOf()) &&
    Number.isFinite(new Date(timestamp + 9 * 60 * 60 * 1000).valueOf()) &&
    Number.isFinite(getKstDayStart(timestamp));
  const months = Number(monthsInput);
  const days = Number(daysInput);
  const validOptions =
    monthsInput.trim() !== '' &&
    daysInput.trim() !== '' &&
    Number.isSafeInteger(months) &&
    Number.isSafeInteger(days);

  const result = useMemo(() => {
    if (!validTimestamp) return null;
    const dayStart = getKstDayStart(timestamp);
    return {
      timestamp,
      utc: new Date(timestamp).toISOString(),
      defaultFormat: formatKstDateTime(timestamp),
      customFormat: formatKstDateTime(timestamp, format),
      date: getKstToday(undefined, timestamp),
      time: getKstCurrentTime(undefined, timestamp),
      dateTime: getKstCurrentDateTime(undefined, timestamp),
      dayStart,
      dayStartUtc: new Date(dayStart).toISOString(),
    };
  }, [timestamp, validTimestamp, format]);

  const adjustment = useMemo(() => {
    if (!validTimestamp || !validOptions) return null;
    const options: KstDateOptions = { months, days, startOfMonth };
    const monthOnly = getKstDate({ months }, timestamp);
    const monthAndDay = getKstDate({ months, days }, timestamp);
    const final = getKstDate(options, timestamp);
    if ([monthOnly, monthAndDay, final].some((value) => parseKstDateTime(value) === null))
      return null;
    return { options, monthOnly, monthAndDay, final };
  }, [timestamp, validTimestamp, validOptions, months, days, startOfMonth]);

  const parsed = useMemo(() => {
    const value = parseKstDateTime(parseInput);
    return {
      value,
      kst: value === null ? null : formatKstDateTime(value),
      utc: value === null ? null : new Date(value).toISOString(),
    };
  }, [parseInput]);

  useEffect(() => {
    onData({
      timestampInput,
      result,
      monthsInput,
      daysInput,
      startOfMonth,
      adjustment,
      parseInput,
      parsed,
    });
  }, [
    timestampInput,
    result,
    monthsInput,
    daysInput,
    startOfMonth,
    adjustment,
    parseInput,
    parsed,
    onData,
  ]);

  return (
    <section className="integration-demo" aria-label={t('KST 날짜·시간 유틸리티')}>
      <Typography variant="body2" color="text.secondary">
        {t(
          '같은 Unix 밀리초를 KST(+09:00)와 UTC로 비교합니다. 현재 시각은 버튼을 누를 때만 가져옵니다.',
        )}
      </Typography>
      <div className="integration-demo-controls">
        <FormControl size="small" className="integration-demo-select">
          <InputLabel id={`${baseId}-timestamp-label`}>{t('기준 시각 프리셋')}</InputLabel>
          <Select
            labelId={`${baseId}-timestamp-label`}
            label={t('기준 시각 프리셋')}
            value={
              timestampPresets.some((preset) => preset.value === timestampInput)
                ? timestampInput
                : 'custom'
            }
            onChange={(event) => {
              setTimestampInput(event.target.value);
              onRecord('kst.timestampPreset', event.target.value);
            }}
          >
            {timestampPresets.map((preset) => (
              <MenuItem key={preset.value} value={preset.value}>
                {t(preset.label)}
              </MenuItem>
            ))}
            <MenuItem value="custom" disabled>
              {t('직접 입력')}
            </MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            const now = String(Date.now());
            setTimestampInput(now);
            onRecord('kst.now', now);
          }}
        >
          {t('현재 시각 가져오기')}
        </Button>
      </div>
      <div className="components-example-grid">
        <TextField
          size="small"
          label={t('Unix 밀리초')}
          value={timestampInput}
          error={!validTimestamp}
          helperText={!validTimestamp ? t('유효한 Unix 밀리초를 입력해 주세요.') : undefined}
          onChange={(event) => setTimestampInput(event.target.value)}
        />
        <TextField
          size="small"
          label={t('KST 사용자 지정 포맷')}
          value={format}
          helperText={t('Z는 +09:00, ZZ는 +0900으로 표시합니다.')}
          onChange={(event) => setFormat(event.target.value)}
        />
      </div>
      {result && (
        <DemoResultTable
          label={t('KST 포맷 결과')}
          rows={[
            { label: t('Unix 밀리초'), value: result.timestamp },
            { label: t('UTC ISO 시각'), value: result.utc },
            {
              label: t('기본 날짜·시간 포맷'),
              api: 'formatKstDateTime',
              value: result.defaultFormat,
            },
            { label: t('사용자 지정 포맷'), api: 'formatKstDateTime', value: result.customFormat },
            { label: t('KST 날짜'), api: 'getKstToday', value: result.date },
            { label: t('KST 시간'), api: 'getKstCurrentTime', value: result.time },
            {
              label: t('날짜·시간 객체'),
              api: 'getKstCurrentDateTime',
              value: JSON.stringify(result.dateTime),
            },
            { label: t('KST 자정의 Unix 밀리초'), api: 'getKstDayStart', value: result.dayStart },
            { label: t('KST 자정의 UTC ISO 시각'), value: result.dayStartUtc },
          ]}
        />
      )}
      <KstAdjustmentPanel
        monthsInput={monthsInput}
        daysInput={daysInput}
        startOfMonth={startOfMonth}
        setMonthsInput={setMonthsInput}
        setDaysInput={setDaysInput}
        setStartOfMonth={setStartOfMonth}
        adjustment={adjustment}
      />
      <KstParsingPanel
        baseId={baseId}
        parseInput={parseInput}
        setParseInput={setParseInput}
        parsed={parsed}
        onRecord={onRecord}
      />
    </section>
  );
}
