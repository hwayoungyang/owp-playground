import { FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
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
  numericString: {
    label: '숫자 기본값에 문자열 전달',
    payload: {
      'order.quantity': '85',
      'order.ignoredKey': '제외됨',
    },
  },
} as const;

export type FormDefaultTypeRow = {
  readonly api: string;
  readonly runtime: string;
  readonly type: string;
  readonly example: string;
};

export type PayloadKey = keyof typeof serverPayloadPresets;
export const payloadKeys = ['prefixed', 'partial', 'numericString'] as const;

type FormDefaultsPanelProps = {
  readonly baseId: string;
  readonly payloadKey: PayloadKey;
  readonly setPayloadKey: (value: PayloadKey) => void;
  readonly mergedFormValues: Readonly<typeof defaultFormTarget>;
  readonly typedFormValues: Readonly<Record<string, unknown>>;
  readonly typeRows: readonly FormDefaultTypeRow[];
  readonly onRecord: IntegrationExampleProps['onRecord'];
};

export function FormDefaultsPanel({
  baseId,
  payloadKey,
  setPayloadKey,
  mergedFormValues,
  typedFormValues,
  typeRows,
  onRecord,
}: FormDefaultsPanelProps) {
  const { t } = useOwpTranslation();
  const legacyFormValues: Readonly<Record<string, unknown>> = mergedFormValues;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-form`}
      aria-labelledby={`${baseId}-tab-form`}
      className="integration-demo"
    >
      <Typography variant="body2" color="text.secondary">
        {t(
          '같은 입력으로 getFormDefaultValues와 getTypedFormDefaultValues를 비교합니다. 점(.) 키는 마지막 이름이 기본값에 있는 필드만 병합합니다.',
        )}
      </Typography>
      <FormControl size="small" className="integration-demo-select">
        <InputLabel id={`${baseId}-form-preset-label`}>{t('입력 예시')}</InputLabel>
        <Select
          labelId={`${baseId}-form-preset-label`}
          label={t('입력 예시')}
          value={payloadKey}
          onChange={(event) => {
            const nextKey = payloadKeys.find((key) => key === event.target.value);
            if (!nextKey) return;
            setPayloadKey(nextKey);
            onRecord('utils.formDefaultPreset', nextKey);
          }}
        >
          {payloadKeys.map((key) => (
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
            typedValue: t('Typed 병합 값'),
            same: t('런타임 결과 동일'),
          }}
          rows={(['code', 'quantity', 'manager'] as const).map((fieldKey) => ({
            field: <code>{fieldKey}</code>,
            defaultValue: String(defaultFormTarget[fieldKey]),
            mergedValue: String(legacyFormValues[fieldKey]),
            typedValue: String(typedFormValues[fieldKey]),
            same: String(Object.is(legacyFormValues[fieldKey], typedFormValues[fieldKey])),
          }))}
        />
      </div>
      {payloadKey === 'numericString' && (
        <>
          <Typography variant="body2" color="text.secondary">
            {t(
              '숫자 기본값 quantity에 문자열 "85"를 넣어도 런타임 결과는 같고, 반환 타입의 후보만 다릅니다.',
            )}
          </Typography>
          <div className="integration-result-table">
            <OwpTable
              sx={{ '& th, & td': { textAlign: 'left' } }}
              size="small"
              aria-label={t('반환 타입 비교')}
              headers={{
                api: t('함수'),
                runtime: t('typeof 런타임 값'),
                type: t('typeof result.quantity 타입'),
                example: t('타입이 받는 값 예시'),
              }}
              rows={typeRows.map((row) => ({
                api: <code>{row.api}</code>,
                runtime: row.runtime,
                type: row.type,
                example: row.example,
              }))}
            />
          </div>
        </>
      )}
    </div>
  );
}
