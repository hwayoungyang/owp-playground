import { useEffect, useId, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { OwpFieldTable, OwpTable } from '@owp/components';
import { OwpStyleProvider } from '@owp/core/contexts';
import {
  useChangeOwpTheme,
  useGetCurrentSettings,
  useGetDefaultSettings,
  useGetMainTheme,
  useResetSettings,
  useSetSettings,
  useStorage,
} from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import { summarizeStoredEnv } from '../model/policy';
import type { CoreExampleProps } from '../model/types';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice } from '../runtime/Controls';
import {
  coreThemePresets,
  createCorePresetTheme,
  getCoreThemePresetId,
  withCoreTableFontSize,
} from '../model/theme-presets';

const rows = [
  { name: 'Item A', count: 12 },
  { name: 'Item B', count: 24 },
];

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const settings = useGetCurrentSettings();
  const mainTheme = useGetMainTheme();
  const [baseline] = useState(settings.theme.main);
  const selectId = useId();
  const defaultSettings = useGetDefaultSettings();
  const setSettings = useSetSettings();
  const changeOwpTheme = useChangeOwpTheme();
  const resetSettings = useResetSettings();
  const { getEnv } = useStorage();
  const preset = getCoreThemePresetId(settings.theme.main, baseline);
  const presetLabel =
    preset === 'app-default' ? t('앱 기본 테마') : preset === 'custom' ? t('사용자 지정') : preset;
  const size = Number(settings.theme.main.table?.cell?.fontSize ?? 14);
  const defaultSize = Number(defaultSettings.theme.main.table?.cell?.fontSize ?? 14);
  const { keyCount: envKeyCount, hasApiBaseUrl } = summarizeStoredEnv(getEnv());

  useEffect(() => {
    onData({
      table: settings.theme.main.table,
      defaultTable: defaultSettings.theme.main.table,
      preset,
      theme: settings.theme.main,
      defaultTheme: defaultSettings.theme.main,
      storageEnvSummary: {
        keyCount: envKeyCount,
        hasApiBaseUrl,
      },
    });
  }, [defaultSettings.theme.main, envKeyCount, hasApiBaseUrl, onData, preset, settings.theme.main]);
  return (
    <CoreDemo
      controls={
        <>
          <CoreChoice
            label="글자 크기 (px)"
            value={size}
            options={[12, 14, 16]}
            onChange={(fontSize) => {
              setSettings({
                ...settings,
                theme: {
                  ...settings.theme,
                  main: withCoreTableFontSize(settings.theme.main, fontSize),
                },
              });
              onRecord('settings.change', JSON.stringify({ fontSize }));
            }}
          />
          <FormControl size="small" className="core-control-field">
            <span id={selectId} className="core-control-label">
              {t('테마 구성')}
            </span>
            <Select
              labelId={selectId}
              value={preset}
              onChange={(event) => {
                const nextPreset = event.target.value;
                if (
                  nextPreset !== 'app-default' &&
                  !coreThemePresets.some((option) => option.id === nextPreset)
                )
                  return;
                changeOwpTheme({
                  ...settings.theme,
                  main: createCorePresetTheme(nextPreset, baseline, settings.theme.main),
                });
                onRecord('theme.change', nextPreset);
              }}
            >
              <MenuItem value="app-default">{t('앱 기본 테마')}</MenuItem>
              {preset === 'custom' && (
                <MenuItem value="custom" disabled>
                  {t('사용자 지정')}
                </MenuItem>
              )}
              {(['light', 'dark'] as const).flatMap((mode) => [
                <ListSubheader key={mode}>
                  {t(mode === 'light' ? '밝은 테마' : '어두운 테마')}
                </ListSubheader>,
                ...coreThemePresets
                  .filter((option) => option.mode === mode)
                  .map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.id}
                    </MenuItem>
                  )),
              ])}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              resetSettings();
              onRecord('settings.reset', 'defaults');
            }}
          >
            {t('현재 설정 초기화')}
          </Button>
        </>
      }
    >
      <DemoSection description="useSetSettings는 현재 설정을, useChangeOwpTheme는 기본·현재 테마를 메모리 store에서 갱신합니다. 설정 저장은 앱의 책임이며 useStorage는 앱 환경 조회·저장과 storage 초기화를 제공합니다.">
        <Typography variant="body2">
          {t(
            'ThemePreview와 같은 공개 프리셋을 사용하며, toolbar 전용 프리셋은 제외합니다. 현재 설정 초기화는 마지막으로 적용한 테마의 기본값으로 되돌립니다.',
          )}
        </Typography>
        <OwpStyleProvider theme={mainTheme} root={false}>
          <Box sx={{ bgcolor: 'background.default', color: 'text.primary', p: 2, borderRadius: 1 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
              <Button variant="contained">{t('기본 색상')}</Button>
              <Typography variant="body2">
                {presetLabel} · {t(mainTheme.palette.mode === 'dark' ? '어두운 테마' : '밝은 테마')}
              </Typography>
            </Stack>
            <OwpTable
              aria-label={t('설정 미리보기')}
              headers={{ name: t('항목명'), count: t('개수') }}
              rows={rows}
              size="small"
            />
            <OwpFieldTable
              layout={[
                [
                  { title: t('현재 글자 크기'), key: 'currentFontSize' },
                  { title: t('기본 헤더 크기'), key: 'defaultHeaderSize' },
                ],
                [
                  { title: t('테마 구성'), key: 'preset' },
                  { title: t('저장소 경계'), key: 'storageBoundary' },
                ],
              ]}
              data={{
                currentFontSize: `${size}px (default ${defaultSize}px)`,
                defaultHeaderSize: `${Number(defaultSettings.theme.main.table?.header?.fontSize ?? 14)}px`,
                preset: presetLabel,
                storageBoundary: t('메모리 Jotai 상태 (자동 저장 없음)'),
              }}
              titleWidth={140}
            />
          </Box>
        </OwpStyleProvider>
      </DemoSection>
    </CoreDemo>
  );
}
