import { FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import type { IntegrationExampleProps } from '../../integrations/catalog';
import { useOwpTranslation } from '@owp/components/hooks';
import { DemoResultTable } from '../../integrations/DemoResultTable';

const parsingPresets = [
  '2026-01-31',
  '2024-02-29',
  '2026-01-31 00:00:00',
  '2026-01-30T15:00:00Z',
  '2026-01-31T00:00:00+09:00',
  '2026-01-31T00:00:00+0900',
  '2026-01-30T10:00:00-05:00',
  '2026-01-30T10:00:00-0500',
  '1970-01-01T00:00:00Z',
  '2026-02-30',
  '2026-01-31 24:00',
  '2026-01-31T00:00:00+24:00',
  '2026-01-31T00:00:00+09:60',
  '2026-01-31T00:00:00.1234',
  '',
] as const;

type KstParsingPanelProps = {
  readonly baseId: string;
  readonly parseInput: string;
  readonly setParseInput: (value: string) => void;
  readonly onRecord: IntegrationExampleProps['onRecord'];
  readonly parsed: {
    readonly value: number | null;
    readonly kst: string | null;
    readonly utc: string | null;
  };
};

export function KstParsingPanel({
  baseId,
  parseInput,
  setParseInput,
  parsed,
  onRecord,
}: KstParsingPanelProps) {
  const { t } = useOwpTranslation();
  return (
    <>
      <Typography variant="body2" color="text.secondary">
        {t(
          '앞뒤 공백은 제거합니다. 날짜만 입력하면 KST 자정, 시간대 없는 일시는 KST로 해석합니다.',
        )}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t(
          'YYYY-MM-DD 뒤에 공백 하나 또는 대문자 T와 HH:mm을 사용합니다. :ss는 선택이며, 소수 초 1~3자리는 초 뒤에만 붙입니다.',
        )}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t(
          '시간 뒤에는 대문자 Z 또는 ±HH:mm·±HHmm을 붙일 수 있습니다. offset은 시 00~23·분 00~59이며, 잘못된 날짜나 지원하지 않는 형식은 null입니다.',
        )}
      </Typography>
      <div className="components-example-grid">
        <FormControl size="small" className="integration-demo-select">
          <InputLabel id={`${baseId}-parse-label`}>{t('파싱 입력 프리셋')}</InputLabel>
          <Select
            labelId={`${baseId}-parse-label`}
            label={t('파싱 입력 프리셋')}
            value={
              parsingPresets.some((preset) => preset === parseInput)
                ? String(parsingPresets.findIndex((preset) => preset === parseInput))
                : 'custom'
            }
            onChange={(event) => {
              const next = parsingPresets[Number(event.target.value)];
              if (next === undefined) return;
              setParseInput(next);
              onRecord('kst.parsePreset', next);
            }}
          >
            {parsingPresets.map((value, index) => (
              <MenuItem key={value} value={String(index)}>
                {value || t('빈 문자열')}
              </MenuItem>
            ))}
            <MenuItem value="custom" disabled>
              {t('직접 입력')}
            </MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label={t('파싱할 날짜·시간')}
          value={parseInput}
          onChange={(event) => setParseInput(event.target.value)}
        />
      </div>
      <DemoResultTable
        label={t('KST 파싱 결과')}
        rows={[
          { label: t('원본 입력값'), value: JSON.stringify(parseInput) },
          {
            label: t('반환 Unix 밀리초 또는 null'),
            api: 'parseKstDateTime',
            value: String(parsed.value),
          },
          {
            label: t('반환값의 KST 날짜·시간'),
            api: 'formatKstDateTime',
            value: parsed.kst ?? 'null',
          },
          { label: t('반환값의 UTC ISO 시각'), value: parsed.utc ?? 'null' },
        ]}
      />
    </>
  );
}
