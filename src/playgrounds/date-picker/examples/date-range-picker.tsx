import { useOwpTranslation } from '@owp/components/hooks';
import {
  OwpDatePicker,
  OwpDatePickerStyleScope,
  OwpDateRangePicker,
  OwpWeekDatePicker,
} from '@owp/date-picker';
import dayjs from '@owp/date-picker/dayjs';
import {
  formatDateToYmd,
  getTodayYmd,
  VALUE_DATE_FORMATTER,
  VALUE_MONTH_FORMATTER,
} from '@owp/date-picker/utils';
import { Button, FormControl, InputLabel, MenuItem, Select, Tab, Tabs } from '@mui/material';
import { useEffect, useId, useState } from 'react';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

type DatePickerTab = 'date' | 'range' | 'month' | 'monthRange' | 'week';

function stringifyPickerValue(value: string | Date | undefined, format: string): string {
  if (!value) return '';
  return typeof value === 'string' ? value : formatDateToYmd(value, format);
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
        </div>

        {activeTab === 'date' && (
          <div id={`${baseId}-panel-date`} role="tabpanel" aria-labelledby={`${baseId}-tab-date`}>
            <div className="integration-demo-picker">
              <div>
                <OwpDatePicker
                  fullWidth
                  clearable
                  showWeekNumbers
                  label={t('날짜')}
                  value={singleDate}
                  variant="outlined"
                  textFieldProps={{ size: 'small' }}
                  onChange={(next) => {
                    const resolved = stringifyPickerValue(next, VALUE_DATE_FORMATTER);
                    setSingleDate(resolved);
                    onRecord('datePicker.singleDate', resolved || '(empty)');
                  }}
                />
                <div className="integration-demo-controls" style={{ marginTop: 12 }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => {
                      const today = getTodayYmd(VALUE_DATE_FORMATTER);
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
                  label={t('기간')}
                  value={dateRange}
                  variant="outlined"
                  textFieldProps={{ size: 'small' }}
                  onChange={(next) => {
                    const resolved = stringifyPickerValue(next, VALUE_DATE_FORMATTER);
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
                    const resolved = stringifyPickerValue(next, VALUE_MONTH_FORMATTER);
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
                    const resolved = stringifyPickerValue(next, VALUE_MONTH_FORMATTER);
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
                  useYearWeekValue={useYearWeekValue}
                  label={t('주차')}
                  value={weekValue}
                  variant="outlined"
                  textFieldProps={{ size: 'small' }}
                  onChange={(next) => {
                    const resolved = stringifyPickerValue(next, VALUE_DATE_FORMATTER);
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
