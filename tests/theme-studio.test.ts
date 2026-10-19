import { getContrastRatio } from '@mui/material';
import { resolveOwpGridTheme } from '@owp/theme';
import { describe, expect, it } from 'vitest';
import {
  createPreviewGridTheme,
  defaultPreviewTheme,
  generalPreviewPresets,
  getPreviewHeaderColor,
  getPreviewPalette,
  previewPresetDescriptions,
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
  it('keeps moved handles contrasting against panel, selection and hover in every preset', () => {
    for (const preset of previewPresetSchema.options) {
      for (const mode of ['light', 'dark'] as const) {
        const theme = resolveOwpGridTheme(
          createPreviewGridTheme({ preset, mode, headerColor: null }, mode),
        );
        const backgrounds = {
          panel: theme.panel.backgroundColor,
          selectedCell: theme.state.selectedCellBackgroundColor,
          selectedRow: theme.state.selectedRowBackgroundColor,
          hoveredRow: theme.state.hoverRowBackgroundColor,
          hoveredCell: theme.state.hoverCellBackgroundColor,
          focusedRow: theme.state.focusedRowBackgroundColor,
        };
        for (const [surface, background] of Object.entries(backgrounds)) {
          expect(
            getContrastRatio(theme.drag.handleActiveColor, background),
            `${preset}/${mode}/${surface}/movedHandle`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it.each(generalPreviewPresets)(
    'keeps %s text readable across interactive and semantic surfaces in both modes',
    (preset) => {
      for (const mode of ['light', 'dark'] as const) {
        const palette = getPreviewPalette(preset, mode);
        const theme = resolveOwpGridTheme(
          createPreviewGridTheme({ preset, mode, headerColor: null }, mode),
        );
        const pairs = {
          header: [theme.header.color, theme.header.backgroundColor],
          body: [theme.body.color, theme.body.backgroundColor],
          hover: [theme.body.color, theme.state.hoverRowBackgroundColor],
          selection: [theme.body.color, theme.state.selectedRowBackgroundColor],
          focus: [theme.body.color, theme.state.focusedCellBackgroundColor],
          editable: [theme.body.color, theme.editable.backgroundColor],
          changed: [theme.changed.color, theme.changed.backgroundColor],
          filter: [theme.filter.color, theme.filter.backgroundColor],
          menuHover: [theme.filter.color, theme.filter.menuHoverBackgroundColor],
          menuSelection: [theme.filter.color, theme.filter.menuSelectedBackgroundColor],
          menuOperatorHover: [theme.filter.operatorColor, theme.filter.menuHoverBackgroundColor],
          menuOperatorSelection: [
            theme.filter.operatorColor,
            theme.filter.menuSelectedBackgroundColor,
          ],
          enumSelection: [theme.body.color, theme.enumMenu.selectedBackgroundColor],
          panel: [theme.panel.color, theme.panel.backgroundColor],
          muted: [palette.muted, palette.canvas],
          blue: [palette.blue, palette['blue-wash']],
        } as const;
        for (const [surface, [text, background]] of Object.entries(pairs)) {
          expect(
            getContrastRatio(text, background),
            `${preset}/${mode}/${surface}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
        expect(theme.header.backgroundColor).toBe(getPreviewHeaderColor(preset, mode));
        expect(theme.state.selectedRowBackgroundColor).not.toBe(
          theme.state.hoverRowBackgroundColor,
        );
      }
    },
  );

  it('uses body backgrounds for panels and filters without changing the native delete color', () => {
    const nativeDeleteColor = resolveOwpGridTheme().panel.deleteColor;
    for (const preset of previewPresetSchema.options) {
      for (const mode of ['light', 'dark'] as const) {
        const theme = resolveOwpGridTheme(
          createPreviewGridTheme({ preset, mode, headerColor: null }, mode),
        );
        expect(theme.panel.backgroundColor, `${preset}/${mode}`).toBe(theme.body.backgroundColor);
        expect(theme.filter.backgroundColor, `${preset}/${mode}`).toBe(theme.body.backgroundColor);
        expect(theme.panel.deleteColor, `${preset}/${mode}`).toBe(nativeDeleteColor);
        expect(theme.filter.bottomBorderWidth, `${preset}/${mode}`).toBe(2);
      }
    }
  });

  it.each([0, 1, 2, 3])(
    'preserves a %spx filter border through editing and file round trips',
    (width) => {
      const settings = {
        ...defaultPreviewTheme,
        grid: { filter: { bottomBorderWidth: width } },
      };
      const restored = importTheme(exportTheme(settings, 'light'));
      expect(restored.grid?.filter?.bottomBorderWidth).toBe(width);
      expect(
        resolveOwpGridTheme(createPreviewGridTheme(restored, 'light')).filter.bottomBorderWidth,
      ).toBe(width);
    },
  );

  it('validates numeric filter border widths without accepting units or non-finite values', () => {
    for (const width of [-1, Number.NaN, Number.POSITIVE_INFINITY, '2px']) {
      expect(dataGridThemeSchema.safeParse({ filter: { bottomBorderWidth: width } }).success).toBe(
        false,
      );
    }
  });

  it('loads older v1 theme files without a filter border width', () => {
    const file = JSON.parse(exportTheme(defaultPreviewTheme, 'light'));
    delete file.dataGrid.filter.bottomBorderWidth;
    const restored = importTheme(JSON.stringify(file));
    expect(
      resolveOwpGridTheme(createPreviewGridTheme(restored, 'light')).filter.bottomBorderWidth,
    ).toBe(2);
  });

  it.each(['light', 'dark'] as const)(
    'keeps high contrast neutral text above 7:1 in %s mode',
    (mode) => {
      const theme = resolveOwpGridTheme(
        createPreviewGridTheme({ preset: 'contrast', mode, headerColor: null }, mode),
      );
      for (const [text, background] of [
        [theme.header.color, theme.header.backgroundColor],
        [theme.body.color, theme.body.backgroundColor],
        [theme.body.color, theme.state.selectedRowBackgroundColor],
        [theme.panel.color, theme.panel.backgroundColor],
      ] as const)
        expect(getContrastRatio(text, background)).toBeGreaterThanOrEqual(7);
    },
  );

  it.each([
    ['neutral', 'carbon'],
    ['quartz', 'carbon'],
    ['alpine', 'carbon'],
    ['balham', 'sand'],
    ['material', 'industrial'],
    ['slate', 'industrial'],
    ['blue', 'industrial'],
    ['mint', 'carbon'],
    ['nord', 'industrial'],
  ] as const)(
    'imports legacy %s files as %s while preserving their explicit colors',
    (legacy, preset) => {
      const file = JSON.parse(
        exportTheme({ preset: 'carbon', mode: 'light', headerColor: '#456789' }, 'light'),
      );
      const restored = importTheme(JSON.stringify({ ...file, preset: legacy }));
      expect(restored.preset).toBe(preset);
      expect(restored.grid).toEqual(file.dataGrid);
      expect(restored.mui).toEqual(file.mui);
      expect(previewPresetSchema.safeParse(legacy).success).toBe(false);
    },
  );

  it.each(['carbon', 'owp-navy', 'owp-teal', 'owp-plum'] as const)(
    'preserves custom header and state overrides over %s preset defaults',
    (preset) => {
      const theme = resolveOwpGridTheme(
        createPreviewGridTheme(
          {
            preset,
            mode: 'light',
            headerColor: '#345678',
            grid: {
              header: { height: 48 },
              body: { backgroundColor: '#fafaf9' },
              panel: { backgroundColor: '#e9eee8', deleteColor: '#b91234' },
              filter: { backgroundColor: '#dde4ed' },
              state: {
                selectedRowBackgroundColor: '#cbdabc',
                focusedCellBorderColor: '#654321',
                editingCellBorderColor: '#123456',
              },
            },
          },
          'light',
        ),
      );
      expect(theme.header.backgroundColor).toBe('#345678');
      expect(
        getContrastRatio(theme.header.color, theme.header.backgroundColor),
      ).toBeGreaterThanOrEqual(4.5);
      expect(theme.header.height).toBe(48);
      expect(theme.body.backgroundColor).toBe('#fafaf9');
      expect(theme.panel.backgroundColor).toBe('#e9eee8');
      expect(theme.filter.backgroundColor).toBe('#dde4ed');
      expect(theme.panel.deleteColor).toBe('#b91234');
      expect(theme.state.selectedRowBackgroundColor).toBe('#cbdabc');
      expect(theme.state.focusedCellBorderColor).toBe('#654321');
      expect(theme.state.editingCellBorderColor).toBe('#123456');
    },
  );

  it('keeps dark menu text and editable cell boundaries distinguishable in every preset', () => {
    for (const preset of previewPresetSchema.options) {
      const theme = resolveOwpGridTheme(
        createPreviewGridTheme({ preset, mode: 'dark', headerColor: null }, 'dark'),
      );
      for (const background of [
        theme.filter.menuHoverBackgroundColor,
        theme.filter.menuSelectedBackgroundColor,
      ]) {
        expect(getContrastRatio(theme.filter.color, background), preset).toBeGreaterThanOrEqual(
          4.5,
        );
      }
      expect(
        getContrastRatio(theme.cell.borderColor, theme.editable.backgroundColor),
        preset,
      ).toBeGreaterThanOrEqual(2);
    }
  });

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
    for (const labels of [
      themeGroupLabels,
      themeFieldLabels,
      muiPaletteLabels,
      muiColorLabels,
      previewPresetDescriptions,
    ]) {
      for (const label of Object.values(labels)) expect(appEnglish[label], label).toBeTruthy();
    }
    for (const [group, fields] of Object.entries(resolveOwpGridTheme())) {
      expect(themeGroupLabels[group], group).toBeTruthy();
      for (const field of Object.keys(fields).filter((field) => field !== 'focusedRowBorderColor'))
        expect(themeFieldLabels[field], field).toBeTruthy();
    }
  });
});
