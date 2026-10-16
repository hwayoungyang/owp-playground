import { resolveOwpGridTheme } from '@owp/theme';
import { describe, expect, it } from 'vitest';
import {
  createPreviewGridTheme,
  defaultPreviewTheme,
  previewPresetSchema,
} from '../src/features/theme-studio/model/preview';
import { dataGridThemeSchema } from '../src/features/theme-studio/model/schemas';
import {
  createPreviewMuiTheme,
  exportTheme,
  importTheme,
  supportsThemeStudio,
} from '../src/features/theme-studio/model/studio';
import {
  muiColorLabels,
  muiPaletteLabels,
  themeFieldLabels,
  themeGroupLabels,
} from '../src/features/theme-studio/model/studioLabels';
import { packageCatalog } from '../src/playgrounds/registry';
import { appEnglish } from '../src/shared/i18n/app.en';

describe('project theme files', () => {
  it('round trips every preset in both modes through native theme resolution', () => {
    for (const preset of previewPresetSchema.options) {
      for (const mode of ['light', 'dark'] as const) {
        const settings = { preset, mode, headerColor: null, radius: 0.6 };
        const source = exportTheme(settings, mode);
        const restored = importTheme(source);
        expect(resolveOwpGridTheme(createPreviewGridTheme(restored, mode))).toEqual(
          resolveOwpGridTheme(createPreviewGridTheme(settings, mode)),
        );
        expect(restored.radius).toBe(0.6);
        expect(exportTheme(restored, mode)).toBe(source);
        expect(source).not.toMatch(/fontFamily|dataGridSx/);
      }
    }
  });
  it('preserves independent field overrides, native units, state colors and radius', () => {
    const settings = {
      ...defaultPreviewTheme,
      radius: 0.75,
      grid: {
        header: { fontSize: '1rem', height: 44 },
        cell: { fontSize: 16 },
        state: { selectedRowBackgroundColor: '#e3f2fd' },
        filter: { disabledOpacity: 0.25 },
        motion: { enabled: false },
      },
    };
    const restored = importTheme(exportTheme(settings, 'light'));
    expect(restored.grid?.header?.fontSize).toBe('1rem');
    expect(restored.grid?.header?.height).toBe(44);
    expect(restored.grid?.cell?.fontSize).toBe(16);
    expect(restored.grid?.state?.selectedRowBackgroundColor).toBe('#e3f2fd');
    expect(restored.grid?.motion?.enabled).toBe(false);
    expect(restored.radius).toBe(0.75);
  });
  it('rejects unsupported versions, unexpected fields and malformed colors before applying', () => {
    const config = JSON.parse(exportTheme(defaultPreviewTheme, 'light'));
    const invalid = [
      { ...config, version: 2 },
      { ...config, extra: 'unexpected' },
      { ...config, dataGrid: { header: { height: -10 } } },
      { ...config, dataGrid: { header: { backgroundColor: '#12345' } } },
      { ...config, dataGrid: { header: { backgroundColor: 'rgb(12)' } } },
      { ...config, dataGrid: { header: { backgroundColor: 'rgb(256, 0, 0)' } } },
      { ...config, dataGrid: { filter: { disabledOpacity: 2 } } },
      { ...config, dataGridProps: { radius: -1 } },
      {
        ...config,
        mui: {
          ...config.mui,
          palette: { ...config.mui.palette, primary: { main: 'primary.main' } },
        },
      },
    ];
    for (const value of invalid) expect(() => importTheme(JSON.stringify(value))).toThrow();
    expect(() => importTheme('{invalid')).toThrow();
    expect(defaultPreviewTheme).toEqual({ preset: 'inherit', mode: 'light', headerColor: null });
  });
  it('accepts native color formats and restricts palette paths to native overlay fields', () => {
    expect(
      dataGridThemeSchema.safeParse({
        body: { backgroundColor: 'rgba(0, 0, 0, 0.14)' },
        header: { color: '#fff' },
        panel: { backgroundColor: 'transparent' },
        overlay: { loadingProgressColor: 'secondary.main' },
      }).success,
    ).toBe(true);
    expect(
      dataGridThemeSchema.safeParse({ header: { backgroundColor: 'secondary.main' } }).success,
    ).toBe(false);
  });
  it('recalculates MUI font metrics from the selected font size', () => {
    const theme = createPreviewMuiTheme(
      { ...defaultPreviewTheme, mui: { typography: { fontSize: 21 }, shape: { borderRadius: 8 } } },
      'light',
      'Select row',
    );
    expect(theme.typography.fontSize).toBe(21);
    expect(theme.typography.body1.fontSize).toBe('1.5rem');
    expect(theme.shape.borderRadius).toBe(8);
  });
  it('only enables the studio for packages with supported theme controls', () => {
    expect(packageCatalog.filter(supportsThemeStudio).map((entry) => entry.id)).toEqual([
      'datagrid',
      'components',
    ]);
  });
  it('provides locale entries for every supported group and field label', () => {
    for (const labels of [themeGroupLabels, themeFieldLabels, muiPaletteLabels, muiColorLabels]) {
      for (const label of Object.values(labels)) expect(appEnglish[label], label).toBeTruthy();
    }
    for (const [group, fields] of Object.entries(resolveOwpGridTheme())) {
      expect(themeGroupLabels[group], group).toBeTruthy();
      for (const field of Object.keys(fields).filter((field) => field !== 'focusedRowBorderColor'))
        expect(themeFieldLabels[field], field).toBeTruthy();
    }
  });
});
