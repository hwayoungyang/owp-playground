import { useOwpTranslation } from '@owp/components/hooks';
import {
  defaultStyledTableTheme,
  OwpThemeProvider,
  resolveOwpGridTheme,
  resolveOwpTableTheme,
  useDatePickerTheme,
  useGridTheme,
  useTableTheme,
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
  },
  slate: {
    label: '슬레이트 그레이',
    headerBackground: '#334155',
    headerColor: '#ffffff',
    rowHoverBackground: '#f8fafc',
    borderRadius: '6px',
    pickerSelectedBackground: '#475569',
  },
  teal: {
    label: '틸 그린',
    headerBackground: '#115e59',
    headerColor: '#ffffff',
    rowHoverBackground: '#f0fdfa',
    borderRadius: '12px',
    pickerSelectedBackground: '#0d9488',
  },
} as const;

function ScopedTokenConsumer() {
  const { t } = useOwpTranslation();
  const tableTheme = useTableTheme();
  const gridTheme = useGridTheme('dataGrid');
  const pickerTheme = useDatePickerTheme();
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
            api: 'useTableTheme',
            value: colorValue(resolvedTable.header.backgroundColor, resolvedTable.header.color),
          },
          {
            label: t('DataGrid 헤더'),
            api: 'useGridTheme',
            value: colorValue(gridTheme.header.backgroundColor, gridTheme.header.color),
          },
          {
            label: t('DatePicker 선택 배경'),
            api: 'useDatePickerTheme',
            value: colorValue(
              pickerTheme.selectedBackground ?? '',
              pickerTheme.selectedColor ?? '',
            ),
          },
          { label: 'radius', api: 'useTableTheme', value: tableTheme.borderRadius },
        ]}
      />
    </Box>
  );
}

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const [presetKey, setPresetKey] = useState<keyof typeof surfacePresets>('ocean');
  const preset = surfacePresets[presetKey];

  const resolvedGridPreview = useMemo(
    () =>
      resolveOwpGridTheme({
        header: {
          backgroundColor: preset.headerBackground,
          color: preset.headerColor,
        },
        state: {
          hoverBackgroundColor: preset.rowHoverBackground,
        },
      }),
    [preset],
  );

  useEffect(() => {
    onData({
      presetKey,
      preset,
      gridHeaderBackground: resolvedGridPreview.header.backgroundColor,
      gridHoverRowBackground: resolvedGridPreview.state.hoverRowBackgroundColor,
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
          dataGrid={{
            header: {
              backgroundColor: preset.headerBackground,
              color: preset.headerColor,
            },
            state: {
              hoverBackgroundColor: preset.rowHoverBackground,
            },
          }}
          datePicker={{
            selectedBackground: preset.pickerSelectedBackground,
            selectedColor: '#ffffff',
          }}
        >
          <ScopedTokenConsumer />
        </OwpThemeProvider>

        <Typography variant="body2" color="text.secondary">
          {t(
            '색상과 radius를 미리 봅니다. Table·DataGrid의 행에 마우스를 올려 배경색도 확인하세요.',
          )}
        </Typography>
      </div>
    </section>
  );
}
