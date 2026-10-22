import { Button, FormControl, FormControlLabel, MenuItem, Select, Switch } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { type ReactNode, useId } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';

export function Controls({ children }: { readonly children: ReactNode }) {
  return (
    <PreviewActions>
      <div className="chart-controls">{children}</div>
    </PreviewActions>
  );
}
export function Toggle({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
}) {
  const { t } = useOwpTranslation();
  return (
    <FormControlLabel
      control={<Switch size="small" checked={value} onChange={(_, checked) => onChange(checked)} />}
      label={t(label)}
    />
  );
}
export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly onChange: (value: number) => void;
}) {
  const { t } = useOwpTranslation();
  return (
    <label className="chart-range chart-control-field">
      <span>
        {t(label)} <span className="chart-range-value">{value}</span>
      </span>
      <input
        type="range"
        aria-label={t(label)}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
    </label>
  );
}
export function UpdateButton({ onClick }: { readonly onClick: () => void }) {
  const { t } = useOwpTranslation();
  return (
    <Button variant="outlined" onClick={onClick}>
      {t('데이터 갱신')}
    </Button>
  );
}

export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: T;
  readonly options: readonly T[];
  readonly onChange: (value: T) => void;
}) {
  const { t } = useOwpTranslation();
  const id = useId();
  return (
    <FormControl size="small" className="chart-choice chart-control-field">
      <span id={id} className="chart-control-label">
        {t(label)}
      </span>
      <Select
        labelId={id}
        value={value}
        onChange={(event) => {
          const selected = options.find((option) => option === event.target.value);
          if (selected !== undefined) onChange(selected);
        }}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {t(option)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
