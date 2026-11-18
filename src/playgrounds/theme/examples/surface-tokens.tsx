import { useOwpTranslation } from '@owp/components/hooks';
import {
  defaultStyledTableTheme,
  OwpThemeProvider,
  resolveOwpGridTheme,
  resolveOwpTableTheme,
  useDatePickerThemeConfig,
  useGridTheme,
  useTableThemeConfig,
} from '@owp/theme';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

const surfacePresets = {
  ocean: {
    label: '오션 블루',
    headerBackground: '#0c4a6e',
    headerColor: '#ffffff',
    rowHoverBackground: '#f0f9ff',
    borderRadius: '10px',
    pickerSelectedBackground: '#0284c7',
    sortIconInactiveOpacity: undefined,
    sortIconColor: undefined,
  },
  slate: {
    label: '슬레이트 그레이',
    headerBackground: '#334155',
    headerColor: '#ffffff',
    rowHoverBackground: '#f8fafc',
    borderRadius: '6px',
    pickerSelectedBackground: '#475569',
    sortIconInactiveOpacity: 0,
    sortIconColor: '',
  },
  teal: {
    label: '틸 그린',
    headerBackground: '#115e59',
    headerColor: '#ffffff',
    rowHoverBackground: '#f0fdfa',
    borderRadius: '12px',
    pickerSelectedBackground: '#0d9488',
    sortIconInactiveOpacity: 0.75,
    sortIconColor: '#f0fdfa',
  },
} as const;

function ScopedTokenConsumer() {
  const { t } = useOwpTranslation();
  const tableTheme = useTableThemeConfig();
  const gridTheme = useGridTheme('dataGrid');
  const pickerTheme = useDatePickerThemeConfig();
  const resolvedTable = resolveOwpTableTheme(tableTheme, defaultStyledTableTheme);
  const rowHoverBackground =
    tableTheme.row?.hoverBackgroundColor ?? resolvedTable.cell.backgroundColor;

  const colorValue = (background: string, foreground: string) => (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <Box
        component="span"
        sx={{
          width: 24,
          height: 24,
          borderRadius: '4px',
          bgcolor: background,
          color: foreground,
          display: 'inline-grid',
          placeItems: 'center',
          fontSize: 12,
        }}
      >
        A
      </Box>
      <code>{background}</code>
    </Box>
  );
  return (
    <Box
      sx={{
        '& thead th': {
          bgcolor: resolvedTable.header.backgroundColor,
          color: resolvedTable.header.color,
        },
        '& tbody tr:hover': { bgcolor: rowHoverBackground },
      }}
    >
      <DemoResultTable
        label={t('컴포넌트별 테마 설정 결과')}
        rows={[
          {
            label: t('Table 헤더'),
            api: 'useTableThemeConfig',
            value: colorValue(resolvedTable.header.backgroundColor, resolvedTable.header.color),
          },
          {
            label: t('DataGrid 헤더'),
            api: 'useGridTheme',
            value: colorValue(gridTheme.header.backgroundColor, gridTheme.header.color),
          },
          { label: 'sortIconInactiveOpacity', value: gridTheme.header.sortIconInactiveOpacity },
          { label: 'sortIconColor', value: JSON.stringify(gridTheme.header.sortIconColor) },
          {
            label: t('DatePicker 선택 배경'),
            api: 'useDatePickerThemeConfig',
            value: colorValue(
              pickerTheme.selectedBackground ?? '',
              pickerTheme.selectedColor ?? '',
            ),
          },
          { label: 'radius', api: 'useTableThemeConfig', value: tableTheme.borderRadius },
        ]}
      />
    </Box>
  );
}

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const [presetKey, setPresetKey] = useState<keyof typeof surfacePresets>('ocean');
  const preset = surfacePresets[presetKey];

  const gridConfig = useMemo(
    () => ({
      header: {
        backgroundColor: preset.headerBackground,
        color: preset.headerColor,
        sortIconInactiveOpacity: preset.sortIconInactiveOpacity,
        sortIconColor: preset.sortIconColor,
      },
      state: { hoverBackgroundColor: preset.rowHoverBackground },
    }),
    [preset],
  );
  const resolvedGridPreview = useMemo(() => resolveOwpGridTheme(gridConfig), [gridConfig]);

  useEffect(() => {
    onData({
      presetKey,
      preset,
      gridHeaderBackground: resolvedGridPreview.header.backgroundColor,
      gridHoverRowBackground: resolvedGridPreview.state.hoverRowBackgroundColor,
      sortIconInactiveOpacity: resolvedGridPreview.header.sortIconInactiveOpacity,
      sortIconColor: resolvedGridPreview.header.sortIconColor,
    });
  }, [presetKey, preset, resolvedGridPreview, onData]);

  return (
    <section className="components-example-section" aria-label={t('컴포넌트별 테마 설정')}>
      <div className="components-example-content">
        <ToggleButtonGroup
          className="integration-choice"
          size="small"
          exclusive
          value={presetKey}
          aria-label={t('테마 색상')}
          onChange={(_, next: keyof typeof surfacePresets | null) => {
            if (!next) return;
            setPresetKey(next);
            onRecord('theme.surfacePreset', next);
          }}
        >
          {(Object.keys(surfacePresets) as Array<keyof typeof surfacePresets>).map((key) => (
            <ToggleButton key={key} value={key}>
              {t(surfacePresets[key].label)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <OwpThemeProvider
          table={{
            borderRadius: preset.borderRadius,
            header: {
              backgroundColor: preset.headerBackground,
              color: preset.headerColor,
            },
            row: {
              hoverBackgroundColor: preset.rowHoverBackground,
            },
          }}
          dataGrid={gridConfig}
          datePicker={{
            selectedBackground: preset.pickerSelectedBackground,
            selectedColor: '#ffffff',
          }}
        >
          <ScopedTokenConsumer />
        </OwpThemeProvider>

        <Typography variant="body2" color="text.secondary">
          {t(
            '오션 블루는 정렬 아이콘의 opacity와 색상에 undefined를 전달해 기본값을 사용합니다. 슬레이트 그레이는 0과 빈 문자열을 전달하고 두 값이 그대로 유지됩니다. 틸 그린은 별도의 opacity와 색상을 지정합니다.',
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(
            'Date Picker의 selectedBackground에 CSS 변수를 지정하면 선택 배경에 적용합니다. 파생 색상은 MUI 기본 primary를 기준으로 계산합니다. 선택 배경이 비어 있으면 MUI 기본 primary를 사용합니다.',
          )}
        </Typography>
      </div>
    </section>
  );
}
