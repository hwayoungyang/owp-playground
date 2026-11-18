import { useOwpTranslation } from '@owp/components/hooks';
import {
  OwpDatePicker,
  OwpDatePickerStyleScope,
  OwpDateRangePicker,
  OwpWeekDatePicker,
} from '@owp/date-picker';
import dayjs from '@owp/date-picker/dayjs';
import type {
  OwpDatePickerProps,
  OwpDateRangePickerProps,
  OwpWeekDatePickerProps,
} from '@owp/date-picker/types';
import {
  formatDate,
  formatToday,
  VALUE_DATE_FORMAT,
  VALUE_MONTH_FORMAT,
} from '@owp/date-picker/utils';
import {
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useEffect, useId, useState } from 'react';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

type DatePickerTab = 'date' | 'range' | 'month' | 'monthRange' | 'week' | 'timeZone';

type DateValueTimeZone = NonNullable<OwpDatePickerProps['dateValueTimeZone']>;

// UTC 2026-11-05 15:30은 KST(+09:00)에서 2026-11-06 00:30입니다.
const utcDateBoundary = new Date('2026-11-05T15:30:00.000Z');
const timeZoneModes: readonly DateValueTimeZone[] = ['local', 'utc'];
const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function stringifyPickerValue(value: string | Date | undefined, format: string): string {
  if (!value) return '';
  return typeof value === 'string' ? value : formatDate(value, format);
}


export function formatWeekValue(value: string, toYearWeek: boolean): string {
  if (!value) return '';
  if (toYearWeek) {
    const [week, dateText] = value.split(' ');
    if (!week || !dateText) return value;
    const date = dayjs(dateText);
    const weekYear = date.add(4 - (date.day() || 7), 'day').year();
    return `${weekYear}-${week.padStart(2, '0')}`;
  }
  const [year, week] = value.split('-');
  if (!year || !week) return value;
  const january4 = dayjs(`${year}-01-04`);
  const monday = january4
    .subtract((january4.day() + 6) % 7, 'day')
    .add((Number(week) - 1) * 7, 'day');
  return `${Number(week)} ${monday.format('YYYY-MM-DD')}`;
}

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const baseId = useId();
  const [activeTab, setActiveTab] = useState<DatePickerTab>('date');
  const [singleDate, setSingleDate] = useState('2026-11-06');
  const [singleMonth, setSingleMonth] = useState('2026-11');
  const [dateRange, setDateRange] = useState('2026-11-01,2026-11-15');
  const [monthRange, setMonthRange] = useState('2026-09,2026-11');
  const [weekValue, setWeekValue] = useState('2026-45');
  const [useYearWeekValue, setUseYearWeekValue] = useState(true);
  const [disableFuture, setDisableFuture] = useState(false);
  const rangeOptions = { disableFuture } satisfies Pick<OwpDateRangePickerProps, 'disableFuture'>;
  const weekOptions = { useYearWeekValue } satisfies Pick<OwpWeekDatePickerProps, 'useYearWeekValue'>;

  const [rangeStart = '', rangeEnd = ''] = dateRange.split(',');
  const [monthStart = '', monthEnd = ''] = monthRange.split(',');

  useEffect(() => {
    onData({
      singleDate,
      singleMonth,
      dateRange,
      rangeStart,
      rangeEnd,
      monthRange,
      monthStart,
      monthEnd,
      weekValue,
      useYearWeekValue,
    });
  }, [
    singleDate,
    singleMonth,
    dateRange,
    rangeStart,
    rangeEnd,
    monthRange,
    monthStart,
    monthEnd,
    weekValue,
    useYearWeekValue,
    onData,
  ]);

  const tabs: readonly { id: DatePickerTab; label: string }[] = [
    { id: 'date', label: t('날짜') },
    { id: 'range', label: t('기간') },
    { id: 'month', label: t('월') },
    { id: 'monthRange', label: t('월 범위') },
    { id: 'week', label: t('주차') },
    { id: 'timeZone', label: t('날짜 시간대') },
  ];

  return (
    <OwpDatePickerStyleScope>
      <div className="integration-demo">
        <div className="integration-demo-toolbar">
          <Tabs
            value={activeTab}
            onChange={(_, next: DatePickerTab) => setActiveTab(next)}
            aria-label={t('날짜·기간 선택')}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                id={`${baseId}-tab-${tab.id}`}
                aria-controls={`${baseId}-panel-${tab.id}`}
                value={tab.id}
                label={tab.label}
              />
            ))}
          </Tabs>
          {(activeTab === 'date' || activeTab === 'range') && (
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={disableFuture}
                  onChange={(event) => {
                    setDisableFuture(event.target.checked);
                    onRecord('datePicker.disableFuture', String(event.target.checked));
                  }}
                />
              }
              label={t('미래 날짜 비활성화')}
            />
          )}
        </div>

        {disableFuture && (activeTab === 'date' || activeTab === 'range') && (
          <Typography variant="body2" color="text.secondary">
            {t('내일 날짜 {{date}}를 입력하거나 달력에서 선택해 보세요. 미래 날짜는 확정할 수 없습니다.', {
              date: dayjs().add(1, 'day').format(VALUE_DATE_FORMAT),
            })}
          </Typography>
        )}

        {activeTab === 'date' && (
          <div id={`${baseId}-panel-date`} role="tabpanel" aria-labelledby={`${baseId}-tab-date`}>
            <div className="integration-demo-picker">
              <div>
                <OwpDatePicker
                  fullWidth
                  clearable
                  showWeekNumbers
                  disableFuture={disableFuture}
                  label={t('날짜')}
                  value={singleDate}
                  variant="outlined"
                  textFieldProps={{ size: 'small' }}
                  onChange={(next) => {
                    const resolved = stringifyPickerValue(next, VALUE_DATE_FORMAT);
                    setSingleDate(resolved);
                    onRecord('datePicker.singleDate', resolved || '(empty)');
                  }}
                />
                <div className="integration-demo-controls" style={{ marginTop: 12 }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => {
                      const today = formatToday(VALUE_DATE_FORMAT);
                      setSingleDate(today);
                      onRecord('datePicker.fillToday', today);
                    }}
                  >
                    {t('오늘 날짜')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'range' && (
          <div id={`${baseId}-panel-range`} role="tabpanel" aria-labelledby={`${baseId}-tab-range`}>
            <div className="integration-demo-picker">
              <div>
                <OwpDateRangePicker
                  fullWidth
                  clearable
                  showWeekNumbers
                  {...rangeOptions}
                  label={t('기간')}
                  value={dateRange}
                  variant="outlined"
                  textFieldProps={{ size: 'small' }}
                  onChange={(next) => {
                    const resolved = stringifyPickerValue(next, VALUE_DATE_FORMAT);
                    setDateRange(resolved);
                    onRecord('dateRangePicker.dateRange', resolved || '(empty)');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'month' && (
          <div id={`${baseId}-panel-month`} role="tabpanel" aria-labelledby={`${baseId}-tab-month`}>
            <div className="integration-demo-picker">
              <div>
                <OwpDatePicker
                  fullWidth
                  clearable
                  showMonthPicker
                  label={t('월')}
                  value={singleMonth}
                  variant="outlined"
                  textFieldProps={{ size: 'small' }}
                  onChange={(next) => {
                    const resolved = stringifyPickerValue(next, VALUE_MONTH_FORMAT);
                    setSingleMonth(resolved);
                    onRecord('datePicker.singleMonth', resolved || '(empty)');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monthRange' && (
          <div
            id={`${baseId}-panel-monthRange`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-monthRange`}
          >
            <div className="integration-demo-picker">
              <div>
                <OwpDateRangePicker
                  fullWidth
                  clearable
                  showMonthPicker
                  label={t('월 범위')}
                  value={monthRange}
                  variant="outlined"
                  textFieldProps={{ size: 'small' }}
                  onChange={(next) => {
                    const resolved = stringifyPickerValue(next, VALUE_MONTH_FORMAT);
                    setMonthRange(resolved);
                    onRecord('dateRangePicker.monthRange', resolved || '(empty)');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'week' && (
          <div id={`${baseId}-panel-week`} role="tabpanel" aria-labelledby={`${baseId}-tab-week`}>
            <div className="integration-demo-picker">
              <div>
                <OwpWeekDatePicker
                  fullWidth
                  clearable
                  showWeekNumbers
                  {...weekOptions}
                  label={t('주차')}
                  value={weekValue}
                  variant="outlined"
                  textFieldProps={{ size: 'small' }}
                  onChange={(next) => {
                    const resolved = stringifyPickerValue(next, VALUE_DATE_FORMAT);
                    setWeekValue(resolved);
                    onRecord('weekDatePicker.change', resolved || '(empty)');
                  }}
                />
                <div className="integration-demo-controls" style={{ marginTop: 12 }}>
                  <FormControl size="small" className="integration-demo-select">
                    <InputLabel id={`${baseId}-select-week-mode-label`}>
                      {t('반환 형식')}
                    </InputLabel>
                    <Select
                      labelId={`${baseId}-select-week-mode-label`}
                      value={useYearWeekValue ? 'yearWeek' : 'weekDate'}
                      label={t('반환 형식')}
                      onChange={(e) => {
                        const isYearWeek = e.target.value === 'yearWeek';
                        if (isYearWeek === useYearWeekValue) return;
                        setUseYearWeekValue(isYearWeek);
                        setWeekValue(formatWeekValue(weekValue, isYearWeek));
                        onRecord('weekDatePicker.mode', isYearWeek ? 'YYYY-WW' : 'WW YYYY-MM-DD');
                      }}
                    >
                      <MenuItem value="yearWeek">YYYY-WW</MenuItem>
                      <MenuItem value="weekDate">WW YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'timeZone' && (
          <div
            id={`${baseId}-panel-timeZone`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-timeZone`}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t(
                '같은 Date 값을 날짜와 기간 picker에 전달합니다. 기간 picker는 같은 날짜를 양쪽에 표시합니다. 브라우저의 로컬 날짜가 UTC 날짜와 같으면 두 결과도 같습니다.',
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p">
              {t('브라우저 시간대: {{timeZone}}', { timeZone: browserTimeZone })}
              {' · '}
              {t('고정 값(UTC): {{iso}}', { iso: utcDateBoundary.toISOString() })}
            </Typography>
            <div className="integration-demo-picker">
              {timeZoneModes.map((mode) => {
                const dateProps = { value: utcDateBoundary, dateValueTimeZone: mode } as const;
                return (
                  <div key={mode} className="integration-demo">
                    <OwpDatePicker
                      {...dateProps}
                      fullWidth
                      readOnly
                      label={t('날짜 ({{mode}})', { mode })}
                      variant="outlined"
                      textFieldProps={{ size: 'small' }}
                    />
                    <OwpDateRangePicker
                      {...dateProps}
                      fullWidth
                      readOnly
                      label={t('기간 ({{mode}})', { mode })}
                      variant="outlined"
                      textFieldProps={{ size: 'small' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <DemoResultTable
          label={t('날짜 선택 결과')}
          rows={[
            { label: t('날짜'), api: 'OwpDatePicker', value: singleDate || '—' },
            {
              label: t('기간'),
              api: 'OwpDateRangePicker',
              value: dateRange ? `${rangeStart || '—'} ~ ${rangeEnd || '—'}` : '—',
            },
            { label: t('월'), api: 'OwpDatePicker', value: singleMonth || '—' },
            {
              label: t('월 범위'),
              api: 'OwpDateRangePicker',
              value: monthRange ? `${monthStart || '—'} ~ ${monthEnd || '—'}` : '—',
            },
            { label: t('주차'), api: 'OwpWeekDatePicker', value: weekValue || '—' },
          ]}
        />
      </div>
    </OwpDatePickerStyleScope>
  );
}
