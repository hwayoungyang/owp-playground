import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Box, Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import {
  OwpDatePicker,
  OwpDatePickerStyleScope,
  OwpTimePicker,
  OwpTimeWheel,
} from '@owp/date-picker';
import dayjs from '@owp/date-picker/dayjs';
import { getOwpTimeWheelSx, parseTimePickerInput } from '@owp/date-picker/utils';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

type TimeValues = {
  readonly time: string;
  readonly dateTime: string;
  readonly accepted: string;
};

type ModeId = '24h' | '12h';
type ViewId = 'time' | 'dateTime' | 'wheel';

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const baseId = useId();
  const scope = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef<number | null>(null);

  const [activeView, setActiveView] = useState<ViewId>('time');
  const [activeMode, setActiveMode] = useState<ModeId>('24h');

  const [values, setValues] = useState<Readonly<Record<ModeId, TimeValues>>>({
    '24h': { time: '14:15:00', dateTime: '2026-11-06 14:15:00', accepted: '' },
    '12h': { time: '14:15:00', dateTime: '2026-11-06 14:15:00', accepted: '' },
  });

  const saveScrollPosition = () => {
    scrollPosition.current = scope.current?.closest('main')?.scrollTop ?? null;
  };

  const updateValues = (modeId: ModeId, next: Partial<TimeValues>) => {
    saveScrollPosition();
    setValues((previous) => ({
      ...previous,
      [modeId]: { ...previous[modeId], ...next },
    }));
  };

  useEffect(() => {
    onData(values);
  }, [values, onData]);

  useLayoutEffect(() => {
    // 단독 휠의 선택 항목 정렬이나 탭/모드 전환이 바깥 메인 화면까지 스크롤하지 않게 합니다.
    if (scrollPosition.current === null) return;
    scope.current?.closest('main')?.scrollTo({ top: scrollPosition.current, behavior: 'instant' });
    scrollPosition.current = null;
  }, [values, activeView, activeMode]);

  const currentValues = values[activeMode];
  const useAmPm = activeMode === '12h';
  const parsed = parseTimePickerInput(currentValues.time, true);
  const wheelWidth = useAmPm ? 256 : 192;

  const tabs: readonly { id: ViewId; label: string }[] = [
    { id: 'time', label: t('시간') },
    { id: 'dateTime', label: t('날짜·시간') },
    { id: 'wheel', label: t('휠') },
  ];

  function displayValue(mode: ModeId): string {
    const value = activeView === 'dateTime' ? values[mode].dateTime : values[mode].time;
    if (!value) return '—';
    if (mode === '24h') return value;
    const date =
      activeView === 'dateTime' ? dayjs(value) : parseTimePickerInput(value, true).dateValue;
    if (!date.isValid()) return value;
    const time = t('{{period}} {{time}}', {
      period: t(date.hour() < 12 ? '오전' : '오후'),
      time: date.format('hh:mm:ss'),
    });
    return activeView === 'dateTime'
      ? t('{{date}} {{time}}', { date: date.format('YYYY-MM-DD'), time })
      : time;
  }

  return (
    <OwpDatePickerStyleScope ref={scope}>
      <div className="integration-demo">
        <div className="integration-demo-toolbar">
          <Tabs
            value={activeView}
            onChange={(_, next: ViewId) => {
              saveScrollPosition();
              setActiveView(next);
            }}
            aria-label={t('시간·일시 선택')}
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

          <ToggleButtonGroup
            exclusive
            size="small"
            value={activeMode}
            onChange={(_, next: ModeId | null) => {
              if (next !== null) {
                saveScrollPosition();
                setActiveMode(next);
              }
            }}
            aria-label={t('시간 형식')}
            className="integration-choice"
          >
            <ToggleButton value="24h" aria-label={t('24시간 형식')}>
              24h
            </ToggleButton>
            <ToggleButton value="12h" aria-label={t('12시간 형식')}>
              12h
            </ToggleButton>
          </ToggleButtonGroup>
        </div>

        {activeView === 'time' && (
          <div id={`${baseId}-panel-time`} role="tabpanel" aria-labelledby={`${baseId}-tab-time`}>
            <div className="integration-demo-picker">
              <div>
                <OwpTimePicker
                  fullWidth
                  clearable
                  useAmPm={useAmPm}
                  label={t('시간 ({{mode}})', { mode: activeMode })}
                  value={currentValues.time}
                  format={useAmPm ? 'hh:mm:ss A' : 'HH:mm:ss'}
                  timeSteps={{ minutes: 5, seconds: 15 }}
                  variant="outlined"
                  textFieldProps={{ size: 'small' }}
                  onChange={(next = '') => {
                    updateValues(activeMode, { time: next });
                    onRecord('timePicker.' + activeMode, next || '(empty)');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeView === 'dateTime' && (
          <div
            id={`${baseId}-panel-dateTime`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-dateTime`}
          >
            <div className="integration-demo-picker">
              <div>
                <OwpDatePicker
                  fullWidth
                  clearable
                  showTimePicker
                  useAmPm={useAmPm}
                  datetimeFormat="YYYY-MM-DD HH:mm:ss"
                  label={t('날짜·시간')}
                  value={currentValues.dateTime}
                  variant="outlined"
                  textFieldProps={{ size: 'small' }}
                  onChange={(next) => {
                    const dateTime =
                      typeof next === 'string'
                        ? next
                        : next
                          ? dayjs(next).format('YYYY-MM-DD HH:mm:ss')
                          : '';
                    updateValues(activeMode, { dateTime });
                    onRecord('dateTimePicker.' + activeMode + '.change', dateTime || '(empty)');
                  }}
                  onAccept={(accepted) => {
                    updateValues(activeMode, { accepted });
                    onRecord('dateTimePicker.' + activeMode + '.accept', accepted);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeView === 'wheel' && (
          <div id={`${baseId}-panel-wheel`} role="tabpanel" aria-labelledby={`${baseId}-tab-wheel`}>
            <div className="integration-demo-picker">
              <div>
                <Box
                  role="group"
                  aria-label={t('{{mode}} 시간 휠', { mode: activeMode })}
                  sx={{ maxWidth: '100%' }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(' + (useAmPm ? 4 : 3) + ', 64px)',
                      mb: 1,
                    }}
                  >
                    {['시', '분', '초', ...(useAmPm ? ['오전/오후'] : [])].map((part) => (
                      <Typography
                        key={part}
                        variant="caption"
                        sx={{ textAlign: 'center', color: 'text.secondary' }}
                      >
                        {t(part)}
                      </Typography>
                    ))}
                  </Box>
                  <OwpTimeWheel
                    value={parsed.dateValue}
                    useAmPm={useAmPm}
                    hasSeconds
                    minuteStep={5}
                    secondStep={15}
                    meridiemLabels={{ am: t('오전'), pm: t('오후') }}
                    sx={[
                      getOwpTimeWheelSx(wheelWidth),
                      {
                        maxWidth: '100%',
                        boxShadow: 'none',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                      },
                    ]}
                    onChange={(next, view) => {
                      const wheel = next.format('HH:mm:ss');
                      updateValues(activeMode, { time: wheel });
                      onRecord('timeWheel.' + activeMode, wheel + ' (' + view + ')');
                    }}
                  />
                </Box>
              </div>
            </div>
          </div>
        )}
        {activeView === 'dateTime' && useAmPm && (
          <Typography variant="body2" color="text.secondary">
            {t('입력과 반환값은 24h입니다. 선택창은 오전·오후로 표시합니다.')}
          </Typography>
        )}
        <DemoResultTable
          label={t(activeView === 'dateTime' ? '선택한 날짜·시간' : '선택한 시간')}
          rows={(['24h', '12h'] as const).map((mode) => ({
            label: mode,
            display: displayValue(mode),
            value: (activeView === 'dateTime' ? values[mode].dateTime : values[mode].time) || '—',
          }))}
        />
      </div>
    </OwpDatePickerStyleScope>
  );
}
