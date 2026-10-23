import { FormControl, FormControlLabel, MenuItem, Select, Switch } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { useId } from 'react';

export function CoreChoice<T extends string | number>({
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
    <FormControl size="small" className="core-control-field">
      <span id={id} className="core-control-label">
        {t(label)}
      </span>
      <Select
        labelId={id}
        value={value}
        onChange={(event) => {
          const next = options.find((option) => String(option) === String(event.target.value));
          if (next !== undefined) onChange(next);
        }}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {t(String(option))}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function CoreToggle({
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
      label={t(label)}
      control={<Switch size="small" checked={value} onChange={(_, next) => onChange(next)} />}
    />
  );
}
