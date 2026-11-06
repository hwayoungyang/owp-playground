import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import {
  formatNumber,
  getDisplayValue,
  getFormDefaultValues,
  getTrimmedValue,
  isNilOrEmptyString,
  toFiniteNumber,
} from '@owp/utils';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
} from '@mui/material';
import { useEffect, useId, useMemo, useState } from 'react';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

const inputPresets = [
  { id: 'decimal', label: '소수 포함', raw: '  1284500.456  ' },
  { id: 'integer', label: '천 단위', raw: '48,200' },
  { id: 'empty', label: '빈 값', raw: '' },
  { id: 'invalid', label: '비숫자', raw: '  N/A  ' },
] as const;

const defaultFormTarget = {
  code: 'LINE-DEFAULT',
  quantity: 10,
  manager: '미지정',
};

const serverPayloadPresets = {
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

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const baseId = useId();
  const [view, setView] = useState<'format' | 'form'>('format');
  const [rawInput, setRawInput] = useState('  1284500.456  ');
  const [fractionDigits, setFractionDigits] = useState<0 | 2 | 3>(2);
  const [emptyFallback, setEmptyFallback] = useState('-');
  const [payloadKey, setPayloadKey] = useState<keyof typeof serverPayloadPresets>('prefixed');

  const trimmed = getTrimmedValue(rawInput);
  const nilOrEmpty = isNilOrEmptyString(trimmed);
  const finiteNumber = toFiniteNumber(rawInput, 0);
  const formattedNumber = formatNumber(trimmed, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  const displayText = getDisplayValue(formattedNumber || trimmed, emptyFallback);

  const mergedFormValues = useMemo(
    () => getFormDefaultValues(defaultFormTarget, serverPayloadPresets[payloadKey].payload),
    [payloadKey],
  );

  useEffect(() => {
    onData({
      rawInput,
      trimmed,
      nilOrEmpty,
      finiteNumber,
      fractionDigits,
      formattedNumber,
      displayText,
      payloadKey,
      mergedFormValues,
    });
  }, [
    rawInput,
    trimmed,
    nilOrEmpty,
    finiteNumber,
    fractionDigits,
    formattedNumber,
    displayText,
    payloadKey,
    mergedFormValues,
    onData,
  ]);

  return (
    <section className="integration-demo" aria-label={t('숫자·문자열 포맷과 공백·빈 값 처리')}>
      <Tabs
        value={view}
        onChange={(_, next: 'format' | 'form') => setView(next)}
        aria-label={t('값 변환 예제')}
      >
        <Tab
          value="format"
          label={t('숫자·문자열')}
          id={`${baseId}-tab-format`}
          aria-controls={`${baseId}-panel-format`}
        />
        <Tab
          value="form"
          label={t('폼 기본값')}
          id={`${baseId}-tab-form`}
          aria-controls={`${baseId}-panel-form`}
        />
      </Tabs>
      {view === 'format' ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-format`}
          aria-labelledby={`${baseId}-tab-format`}
          className="integration-demo"
        >
          <div className="integration-demo-controls">
            <FormControl size="small" className="integration-demo-select">
              <InputLabel id={`${baseId}-preset-label`}>{t('입력 예시')}</InputLabel>
              <Select
                labelId={`${baseId}-preset-label`}
                label={t('입력 예시')}
                value={inputPresets.find((preset) => preset.raw === rawInput)?.id ?? 'custom'}
                onChange={(event) => {
                  const preset = inputPresets.find((item) => item.id === event.target.value);
                  if (!preset) return;
                  setRawInput(preset.raw);
                  onRecord('utils.inputPreset', preset.id);
                }}
              >
                {inputPresets.map((preset) => (
                  <MenuItem key={preset.id} value={preset.id}>
                    {t(preset.label)}
                  </MenuItem>
                ))}
                <MenuItem value="custom" disabled>
                  {t('직접 입력')}
                </MenuItem>
              </Select>
            </FormControl>
            <ToggleButtonGroup
              className="integration-choice"
              size="small"
              exclusive
              value={fractionDigits}
              aria-label={t('소수 자릿수')}
              onChange={(_, next: 0 | 2 | 3 | null) => {
                if (next === null) return;
                setFractionDigits(next);
                onRecord('utils.fractionDigits', String(next));
              }}
            >
              {([0, 2, 3] as const).map((digits) => (
                <ToggleButton key={digits} value={digits}>
                  {t('{{digits}}자리', { digits })}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>
          <div className="components-example-grid">
            <TextField
              size="small"
              label={t('원본 입력값')}
              value={rawInput}
              onChange={(event) => {
                setRawInput(event.target.value);
                onRecord('utils.rawInput', event.target.value || '(empty)');
              }}
            />
            <TextField
              size="small"
              label={t('빈 값 대체 표시 문자')}
              value={emptyFallback}
              onChange={(event) => {
                setEmptyFallback(event.target.value);
                onRecord('utils.emptyFallback', event.target.value);
              }}
            />
          </div>
          <DemoResultTable
            label={t('숫자·문자열 변환 결과')}
            rows={[
              { label: t('공백 제거'), api: 'getTrimmedValue', value: JSON.stringify(trimmed) },
              { label: t('빈 값 여부'), api: 'isNilOrEmptyString', value: String(nilOrEmpty) },
              { label: t('숫자 변환'), api: 'toFiniteNumber', value: finiteNumber },
              { label: t('숫자 포맷'), api: 'formatNumber', value: formattedNumber || '—' },
              { label: t('표시값'), api: 'getDisplayValue', value: displayText },
            ]}
          />
        </div>
      ) : (
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
              {(Object.keys(serverPayloadPresets) as Array<keyof typeof serverPayloadPresets>).map(
                (key) => (
                  <MenuItem key={key} value={key}>
                    {t(serverPayloadPresets[key].label)}
                  </MenuItem>
                ),
              )}
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
              rows={(Object.keys(defaultFormTarget) as Array<keyof typeof defaultFormTarget>).map(
                (fieldKey) => ({
                  field: <code>{fieldKey}</code>,
                  defaultValue: String(defaultFormTarget[fieldKey]),
                  mergedValue: String(mergedFormValues[fieldKey]),
                }),
              )}
            />
          </div>
        </div>
      )}
    </section>
  );
}
