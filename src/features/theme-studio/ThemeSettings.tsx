import { useOwpTranslation } from '@owp/components/hooks';
import {
  Button,
  ListSubheader,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import { createGridTheme } from '../../shared/theme/themes';
import {
  colorModeSchema,
  createPreviewGridTheme,
  defaultPreviewTheme,
  getPreviewHeaderColor,
  getPreviewPalette,
  type PreviewThemeSettings,
  previewPresetDescriptions,
  previewPresetLabels,
  previewPresetSchema,
} from './model/preview';
import { dataGridThemeSchema } from './model/schemas';
import { ThemeField } from './ThemeField';

export function ThemeSettings({
  value,
  onChange,
  showHeader = true,
}: {
  readonly value: PreviewThemeSettings;
  readonly onChange: (next: PreviewThemeSettings) => void;
  readonly showHeader?: boolean;
}) {
  const { t } = useOwpTranslation();
  const appMode = useTheme().palette.mode;
  const mode = value.mui?.palette?.mode ?? (value.preset === 'inherit' ? appMode : value.mode);
  const headerColor =
    createPreviewGridTheme(value, mode).header?.backgroundColor ??
    getPreviewHeaderColor(value.preset, mode);
  const option = (preset: PreviewThemeSettings['preset']) => (
    <MenuItem key={preset} value={preset}>
      <span className="theme-preset-option">
        <span
          className="theme-swatch"
          style={{
            backgroundColor: getPreviewHeaderColor(preset, preset === 'inherit' ? appMode : mode),
          }}
          aria-hidden="true"
        />
        <span className="theme-preset-name">
          {preset === 'hankum' && (
            <img
              className="theme-preset-symbol"
              src={`${import.meta.env.BASE_URL}brand/hankum-symbol.png`}
              alt=""
              width={20}
              height={20}
            />
          )}
          {t(previewPresetLabels[preset])}
        </span>
      </span>
    </MenuItem>
  );
  return (
    <section className="theme-settings" aria-label={t('테마')}>
      <div className="theme-settings-heading">
        <h3>{t('테마')}</h3>
      </div>
      <Select
        value={value.preset}
        inputProps={{ 'aria-label': t('테마') }}
        fullWidth
        onChange={(event) => {
          const result = previewPresetSchema.safeParse(event.target.value);
          if (result.success)
            onChange({ preset: result.data, mode: value.mode, headerColor: null });
        }}
      >
        {[
          <ListSubheader key="themes">{t('일반 테마')}</ListSubheader>,
          ...previewPresetSchema.options.filter((preset) => preset !== 'hankum').map(option),
          <ListSubheader key="projects">{t('프로젝트')}</ListSubheader>,
          option('hankum'),
        ]}
      </Select>
      <p className="theme-preset-description">{t(previewPresetDescriptions[value.preset])}</p>
      <ToggleButtonGroup
        value={mode}
        exclusive
        fullWidth
        aria-label={t('밝기')}
        onChange={(_, next: unknown) => {
          const result = colorModeSchema.safeParse(next);
          if (result.success)
            onChange({
              preset: value.preset === 'inherit' ? 'carbon' : value.preset,
              mode: result.data,
              headerColor: null,
            });
        }}
      >
        <ToggleButton value="light">{t('밝게')}</ToggleButton>
        <ToggleButton value="dark">{t('어둡게')}</ToggleButton>
      </ToggleButtonGroup>
      {showHeader && (
        <ThemeField
          key="header-color"
          label={t('헤더 배경')}
          value={headerColor}
          onCommit={(next) => {
            const color = dataGridThemeSchema.safeParse({ header: { backgroundColor: next } });
            if (!color.success) return color;
            const automatic = createGridTheme(
              getPreviewPalette(value.preset, mode),
              typeof next === 'string' && /^(#|rgb|hsl)/i.test(next) ? next : null,
              mode,
            ).header;
            const parsed = dataGridThemeSchema.safeParse({
              ...value.grid,
              header: {
                ...value.grid?.header,
                backgroundColor: next,
                color: automatic?.color,
                sortIconColor: automatic?.sortIconColor,
              },
            });
            if (!parsed.success) return parsed;
            onChange({ ...value, grid: parsed.data });
            return { success: true };
          }}
        />
      )}
      <Button
        variant="text"
        onClick={() => onChange(defaultPreviewTheme)}
        disabled={
          value.preset === 'inherit' && !value.grid && !value.mui && value.radius === undefined
        }
      >
        {t('테마 초기화')}
      </Button>
    </section>
  );
}
