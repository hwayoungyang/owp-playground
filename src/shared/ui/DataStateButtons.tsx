import { Button } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';

const states = [
  { value: 'ready', label: '데이터 있음' },
  { value: 'loading', label: '로딩 중' },
  { value: 'empty', label: '데이터 없음' },
  { value: 'error', label: '조회 실패' },
] as const;

export type DataState = (typeof states)[number]['value'];

export function DataStateButtons({
  state,
  onChange,
}: {
  readonly state: DataState;
  readonly onChange: (state: DataState) => void;
}) {
  const { t } = useOwpTranslation();
  return states.map(({ value, label }) => (
    <Button
      key={value}
      variant={state === value ? 'contained' : 'outlined'}
      aria-pressed={state === value}
      onClick={() => onChange(value)}
    >
      {t(label)}
    </Button>
  ));
}
