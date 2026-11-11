import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { IntegrationExampleProps } from '../../integrations/catalog';

export const defaultFormTarget = {
  code: 'LINE-DEFAULT',
  quantity: 10,
  manager: '미지정',
};

export const serverPayloadPresets = {
  prefixed: {
    label: '점(.) 경로 키 병합',
    payload: {
      'order.code': 'LINE-A200',
      'order.quantity': 85,
      'order.ignoredKey': '제외됨',
    },
  },
  partial: {
    label: '일부 필드만 전달',
    payload: {
      code: 'LINE-B310',
    },
  },
} as const;

type FormDefaultsPanelProps = {
  readonly baseId: string;
  readonly payloadKey: keyof typeof serverPayloadPresets;
  readonly setPayloadKey: (value: keyof typeof serverPayloadPresets) => void;
  readonly mergedFormValues: Readonly<typeof defaultFormTarget>;
  readonly onRecord: IntegrationExampleProps['onRecord'];
};

export function FormDefaultsPanel({
  baseId,
  payloadKey,
  setPayloadKey,
  mergedFormValues,
  onRecord,
}: FormDefaultsPanelProps) {
  const { t } = useOwpTranslation();
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-form`}
      aria-labelledby={`${baseId}-tab-form`}
      className="integration-demo"
    >
      <FormControl size="small" className="integration-demo-select">
        <InputLabel id={`${baseId}-form-preset-label`}>{t('입력 예시')}</InputLabel>
        <Select
          labelId={`${baseId}-form-preset-label`}
          label={t('입력 예시')}
          value={payloadKey}
          onChange={(event) => {
            const next = event.target.value;
            if (next !== 'prefixed' && next !== 'partial') return;
            setPayloadKey(next);
            onRecord('utils.formDefaultPreset', next);
          }}
        >
          {(['prefixed', 'partial'] as const).map((key) => (
            <MenuItem key={key} value={key}>
              {t(serverPayloadPresets[key].label)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <div className="integration-result-table">
        <OwpTable
          sx={{ '& th, & td': { textAlign: 'left' } }}
          size="small"
          aria-label={t('폼 기본값 병합 결과')}
          headers={{
            field: t('필드 키'),
            defaultValue: t('기본값'),
            mergedValue: t('병합된 값'),
          }}
          rows={(['code', 'quantity', 'manager'] as const).map((fieldKey) => ({
            field: <code>{fieldKey}</code>,
            defaultValue: String(defaultFormTarget[fieldKey]),
            mergedValue: String(mergedFormValues[fieldKey]),
          }))}
        />
      </div>
    </div>
  );
}
