import { FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import type { KstDateOptions } from '@owp/date-picker/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { DemoResultTable } from '../../integrations/DemoResultTable';

type KstAdjustmentPanelProps = {
  readonly monthsInput: string;
  readonly daysInput: string;
  readonly startOfMonth: boolean;
  readonly setMonthsInput: (value: string) => void;
  readonly setDaysInput: (value: string) => void;
  readonly setStartOfMonth: (value: boolean) => void;
  readonly adjustment: {
    readonly options: KstDateOptions;
    readonly monthOnly: string;
    readonly monthAndDay: string;
    readonly final: string;
  } | null;
};

export function KstAdjustmentPanel({
  monthsInput,
  daysInput,
  startOfMonth,
  setMonthsInput,
  setDaysInput,
  setStartOfMonth,
  adjustment,
}: KstAdjustmentPanelProps) {
  const { t } = useOwpTranslation();
  const months = Number(monthsInput);
  const days = Number(daysInput);
  return (
    <>
      <Typography variant="body2" color="text.secondary">
        {t(
          '월 이동 → 일 이동 → 월초 지정 순서로 계산합니다. 월 이동은 대상 월의 마지막 날짜로 보정합니다.',
        )}
      </Typography>
      <div className="components-example-grid">
        <TextField
          size="small"
          label={t('이동할 개월 수')}
          value={monthsInput}
          error={monthsInput.trim() === '' || !Number.isSafeInteger(months)}
          onChange={(event) => setMonthsInput(event.target.value)}
        />
        <TextField
          size="small"
          label={t('이동할 일수')}
          value={daysInput}
          error={daysInput.trim() === '' || !Number.isSafeInteger(days)}
          onChange={(event) => setDaysInput(event.target.value)}
        />
        <FormControlLabel
          label={t('마지막에 월초 지정')}
          control={
            <Switch checked={startOfMonth} onChange={(_, checked) => setStartOfMonth(checked)} />
          }
        />
      </div>
      {!adjustment && (
        <Typography variant="body2" color="error" role="status">
          {t(
            '기준 시각과 이동할 정수를 확인해 주세요. 계산 결과도 지원 날짜 범위 안에 있어야 합니다.',
          )}
        </Typography>
      )}
      {adjustment && (
        <DemoResultTable
          label={t('KST 날짜 조정 단계')}
          rows={[
            {
              label: t('적용 옵션'),
              api: 'KstDateOptions',
              value: JSON.stringify(adjustment.options),
            },
            {
              label: t('1. 월 이동과 말일 보정'),
              api: 'getKstDate({ months }, timestamp)',
              value: adjustment.monthOnly,
            },
            {
              label: t('2. 일 이동'),
              api: 'getKstDate({ months, days }, timestamp)',
              value: adjustment.monthAndDay,
            },
            { label: t('3. 월초 지정과 최종 날짜'), api: 'getKstDate', value: adjustment.final },
          ]}
        />
      )}
    </>
  );
}
