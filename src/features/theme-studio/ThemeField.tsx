import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import { PaletteIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorPalette } from './ColorPalette';
import {
  type ThemeFieldCommitResult,
  type ThemeFieldMessage,
  themeFieldMessage,
} from './model/validation';

export function ThemeField({
  label,
  value,
  onCommit,
}: {
  readonly label: string;
  readonly value: string | number;
  readonly onCommit: (value: string | number) => ThemeFieldCommitResult;
}) {
  const { t } = useTranslation('app');
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState<ThemeFieldMessage>();
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    setDraft(String(value));
    setError(undefined);
  }, [value]);
  const commit = (next: string) => {
    if (String(value) === next) {
      setError(undefined);
      return;
    }
    if (next.trim() === '') {
      setError({ key: '값을 입력해 주세요.' });
      return;
    }
    const parsed = typeof value === 'number' || /^\d+(?:\.\d+)?$/.test(next) ? Number(next) : next;
    const result = onCommit(parsed);
    setError(result.success ? undefined : themeFieldMessage(result.error));
  };
  const isColor =
    typeof value === 'string' &&
    /^(#|rgb|hsl|transparent|currentColor|(?:primary|secondary|error|warning|info|success)\.)/i.test(
      value,
    );
  const isHexColor = typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
  return (
    <>
      <TextField
        fullWidth
        label={label}
        value={draft}
        error={error !== undefined}
        helperText={error ? t(error.key, error.options) : undefined}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(undefined);
        }}
        onBlur={() => commit(draft)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.querySelector('input')?.blur();
        }}
        slotProps={{
          input: {
            startAdornment: isHexColor ? (
              <InputAdornment position="start">
                <input
                  type="color"
                  className="theme-color-input"
                  aria-label={`${label} ${t('색상 선택')}`}
                  value={value}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    commit(event.target.value);
                  }}
                />
              </InputAdornment>
            ) : undefined,
            endAdornment: isColor ? (
              <InputAdornment position="end">
                <Tooltip title={t('MUI 색상 선택')}>
                  <IconButton
                    aria-label={`${label} ${t('MUI 색상 선택')}`}
                    onClick={() => setPaletteOpen(true)}
                  >
                    <PaletteIcon size={18} />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : undefined,
          },
        }}
      />
      {paletteOpen && (
        <ColorPalette
          label={label}
          value={draft}
          onClose={() => setPaletteOpen(false)}
          onSelect={(color) => {
            setDraft(color);
            commit(color);
            setPaletteOpen(false);
          }}
        />
      )}
    </>
  );
}
