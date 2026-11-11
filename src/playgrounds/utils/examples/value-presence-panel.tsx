import { FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { hasValue } from '@owp/utils';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

export const presencePresets = [
  { id: 'null', value: null },
  { id: 'undefined', value: undefined },
  { id: 'empty', value: '' },
  { id: 'zero', value: 0 },
  { id: 'false', value: false },
  { id: 'spaces', value: '   ' },
  { id: 'nan', value: Number.NaN },
  { id: 'string-zero', value: '0' },
  { id: 'string-false', value: 'false' },
] as const;

export function describeValue(value: unknown): string {
  if (value === null) return 'null (null)';
  const literal = typeof value === 'string' ? JSON.stringify(value) : String(value);
  return `${literal} (${typeof value})`;
}

type PresencePanelProps = {
  readonly baseId: string;
  readonly presenceKey: string;
  readonly setPresenceKey: (value: string) => void;
  readonly presenceInput: string;
  readonly setPresenceInput: (value: string) => void;
  readonly onRecord: IntegrationExampleProps['onRecord'];
  readonly presence: {
    readonly original: string;
    readonly hasValue: boolean;
    readonly isNilOrEmptyString: boolean;
    readonly trimmed: string | null;
    readonly input: readonly string[];
    readonly filtered: readonly string[];
  };
};

export function ValuePresencePanel({
  baseId,
  presenceKey,
  setPresenceKey,
  presenceInput,
  setPresenceInput,
  presence,
  onRecord,
}: PresencePanelProps) {
  const { t } = useOwpTranslation();
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-presence`}
      aria-labelledby={`${baseId}-tab-presence`}
      className="integration-demo"
    >
      <Typography variant="body2" color="text.secondary">
        {t(
          'hasValue는 null·undefined·빈 문자열만 제외합니다. 0·false·공백 문자열·NaN은 유지합니다.',
        )}
      </Typography>
      <div className="components-example-grid">
        <FormControl size="small" className="integration-demo-select">
          <InputLabel id={`${baseId}-presence-label`}>{t('타입이 있는 입력 예시')}</InputLabel>
          <Select
            labelId={`${baseId}-presence-label`}
            label={t('타입이 있는 입력 예시')}
            value={presenceKey}
            onChange={(event) => {
              setPresenceKey(event.target.value);
              onRecord('utils.presencePreset', event.target.value);
            }}
          >
            {presencePresets.map((preset) => (
              <MenuItem key={preset.id} value={preset.id}>
                {describeValue(preset.value)}
              </MenuItem>
            ))}
            <MenuItem value="custom">{t('직접 입력 (문자열)')}</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label={t('직접 입력 (문자열)')}
          value={presenceInput}
          onChange={(event) => {
            setPresenceInput(event.target.value);
            setPresenceKey('custom');
            onRecord('utils.presenceInput', event.target.value);
          }}
        />
      </div>
      <DemoResultTable
        label={t('값 존재 여부 비교')}
        rows={[
          { label: t('원본 값과 타입'), value: presence.original },
          { label: t('값 존재 여부'), api: 'hasValue', value: String(presence.hasValue) },
          {
            label: t('원본의 빈 값 여부'),
            api: 'isNilOrEmptyString',
            value: String(presence.isNilOrEmptyString),
          },
          {
            label: t('원본에서 두 판정은 반대입니다.'),
            value: String(presence.hasValue === !presence.isNilOrEmptyString),
          },
          {
            label: t('문자열 공백 제거 결과'),
            api: 'getTrimmedValue',
            value:
              presence.trimmed === null
                ? t('문자열에만 적용합니다.')
                : describeValue(presence.trimmed),
          },
          {
            label: t('공백 제거 후 값 존재 여부'),
            api: 'hasValue',
            value:
              presence.trimmed === null
                ? t('문자열에만 적용합니다.')
                : String(hasValue(presence.trimmed)),
          },
          { label: t('필터 입력 (예시 + 현재 값)'), value: presence.input.join(', ') },
          {
            label: t('필터 결과 (0과 false 유지)'),
            api: 'array.filter(hasValue)',
            value: presence.filtered.join(', '),
          },
        ]}
      />
    </div>
  );
}
