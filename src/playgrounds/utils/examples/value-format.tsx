import { useOwpTranslation } from '@owp/components/hooks';
import {
  formatNumber,
  getDisplayValue,
  getFormDefaultValues,
  getTrimmedValue,
  hasValue,
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
import { describeValue, presencePresets, ValuePresencePanel } from './value-presence-panel';
import {
  defaultFormTarget,
  serverPayloadPresets,
  FormDefaultsPanel,
} from './form-default-values-panel';

const inputPresets = [
  { id: 'decimal', label: '소수 포함', raw: '  1284500.456  ' },
  { id: 'integer', label: '천 단위', raw: '48,200' },
  { id: 'empty', label: '빈 값', raw: '' },
  { id: 'invalid', label: '비숫자', raw: '  N/A  ' },
] as const;

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const baseId = useId();
  const [view, setView] = useState<'format' | 'form' | 'presence'>('format');
  const [rawInput, setRawInput] = useState('  1284500.456  ');
  const [fractionDigits, setFractionDigits] = useState<0 | 2 | 3>(2);
  const [emptyFallback, setEmptyFallback] = useState('-');
  const [payloadKey, setPayloadKey] = useState<keyof typeof serverPayloadPresets>('prefixed');
  const [presenceKey, setPresenceKey] = useState('null');
  const [presenceInput, setPresenceInput] = useState('');
  const originalValue =
    presenceKey === 'custom'
      ? presenceInput
      : presencePresets.find((preset) => preset.id === presenceKey)?.value;
  const presence = useMemo(() => {
    const values = [...presencePresets.map((preset) => preset.value), originalValue];
    return {
      original: describeValue(originalValue),
      hasValue: hasValue(originalValue),
      isNilOrEmptyString: isNilOrEmptyString(originalValue),
      trimmed: typeof originalValue === 'string' ? getTrimmedValue(originalValue) : null,
      input: values.map(describeValue),
      filtered: values.filter(hasValue).map(describeValue),
    };
  }, [originalValue]);

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
      presence,
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
    presence,
  ]);

  return (
    <section className="integration-demo" aria-label={t('숫자·문자열 포맷과 공백·빈 값 처리')}>
      <Tabs
        value={view}
        onChange={(_, next: 'format' | 'form' | 'presence') => setView(next)}
        aria-label={t('값 변환 예제')}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab
          value="format"
          label={t('숫자·문자열')}
          id={`${baseId}-tab-format`}
          aria-controls={`${baseId}-panel-format`}
        />
        <Tab
          value="presence"
          label={t('값 존재 여부')}
          id={`${baseId}-tab-presence`}
          aria-controls={`${baseId}-panel-presence`}
        />
        <Tab
          value="form"
          label={t('폼 기본값')}
          id={`${baseId}-tab-form`}
          aria-controls={`${baseId}-panel-form`}
        />
      </Tabs>
      {view === 'format' && (
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
      )}
      {view === 'presence' && (
        <ValuePresencePanel
          baseId={baseId}
          presenceKey={presenceKey}
          setPresenceKey={setPresenceKey}
          presenceInput={presenceInput}
          setPresenceInput={setPresenceInput}
          presence={presence}
          onRecord={onRecord}
        />
      )}
      {view === 'form' && (
        <FormDefaultsPanel
          baseId={baseId}
          payloadKey={payloadKey}
          setPayloadKey={setPayloadKey}
          mergedFormValues={mergedFormValues}
          onRecord={onRecord}
        />
      )}
    </section>
  );
}
